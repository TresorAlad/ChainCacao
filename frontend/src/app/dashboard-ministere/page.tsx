'use client'

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleTheme } from '@/lib/role-themes'
import { getRoleBasedRedirect, isAdminRole, isMinistereRole } from '@/lib/role-utils'
import api, { type ActorDTO, type Batch, type BatchHistoryEvent, unwrapLotFromResponse } from '@/lib/api'
import { LocationMap } from '@/components/maps/LocationMapDynamic'
import { coordsFromLot, markersFromActors, SUPERVISION_ACTOR_MAP_PIN, SUPERVISION_AUDIT_LOT_MAP_PIN, type MapMarker } from '@/lib/geo-utils'
import type { DashboardStats } from '@/lib/dashboard-stats'
import { displayKpiNumber, displayTracedVolume, pickTotalLots } from '@/lib/dashboard-kpi'
import {
  GlobeAmericasIcon,
  ScaleIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  MapIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { filterAnnuaireActors } from '@/lib/actors-utils'

function MinistereDashboardContent() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const lotFromUrlConsumed = useRef(false)
  const theme = getRoleTheme('ministere')

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alertsCount, setAlertsCount] = useState<number | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [searchId, setSearchId] = useState('')
  const [auditLot, setAuditLot] = useState<Batch | null>(null)
  const [auditHistory, setAuditHistory] = useState<BatchHistoryEvent[]>([])
  const [searching, setSearching] = useState(false)
  const [actors, setActors] = useState<ActorDTO[]>([])

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const canAccess = isMinistereRole(user?.role) || isAdminRole(user?.role)

  useEffect(() => {
    if (!loading && isAuthenticated && !canAccess) {
      router.replace(getRoleBasedRedirect(user?.role))
    }
  }, [loading, isAuthenticated, canAccess, user?.role, router])

  useEffect(() => {
    if (!isAuthenticated || !canAccess) return
    setStatsLoading(true)
    Promise.all([
      api.get<{ success: boolean; stats: DashboardStats }>('/dashboard/stats').catch(() => ({ data: { stats: {} } })),
      api.get<{ success: boolean; alerts: Record<string, unknown> }>('/dashboard/alerts-count').catch(() => null),
      api.get<{ success: boolean; actors: ActorDTO[] }>('/actors', { params: { limit: 500 } }).catch(() => ({ data: { actors: [] } })),
    ])
      .then(([statsRes, alertsRes, actorsRes]) => {
        setStats(statsRes.data.stats || {})
        const alerts = alertsRes?.data?.alerts as { total?: number; count?: number } | undefined
        setAlertsCount(alerts?.total ?? alerts?.count ?? null)
        setActors(filterAnnuaireActors(actorsRes.data.actors || []))
      })
      .finally(() => setStatsLoading(false))
  }, [isAuthenticated, canAccess])

  const runAuditWithId = useCallback(async (rawId: string) => {
    const id = rawId.trim()
    if (!id) {
      toast.error('Saisissez un ID de lot')
      return
    }
    setSearching(true)
    setAuditLot(null)
    setAuditHistory([])
    try {
      const enc = encodeURIComponent(id)
      const [lotRes, histRes] = await Promise.all([
        api.get(`/lot/${enc}`),
        api.get<{ success: boolean; events: BatchHistoryEvent[] }>(`/lot/${enc}/history`),
      ])
      const lotBody = unwrapLotFromResponse(lotRes.data)
      if (!lotBody) {
        toast.error('Réponse lot invalide')
        return
      }
      setAuditLot(lotBody)
      setAuditHistory(histRes.data.events || [])
    } catch {
      toast.error('Lot introuvable')
    } finally {
      setSearching(false)
    }
  }, [])

  const runAudit = () => void runAuditWithId(searchId)

  useEffect(() => {
    if (loading || !isAuthenticated || !canAccess) return
    const lot = searchParams.get('lot')?.trim()
    if (!lot || lotFromUrlConsumed.current) return
    lotFromUrlConsumed.current = true
    setSearchId(lot)
    void runAuditWithId(lot)
  }, [loading, isAuthenticated, canAccess, searchParams, runAuditWithId])

  const mapMarkers = useMemo<MapMarker[]>(() => {
    const fromActors = markersFromActors(actors, {
      idPrefix: 'actor',
      pinColor: SUPERVISION_ACTOR_MAP_PIN,
    })
    const auditCoords = auditLot ? coordsFromLot(auditLot.latitude, auditLot.longitude) : null
    if (auditCoords && auditLot) {
      return [
        ...fromActors,
        {
          ...auditCoords,
          id: `audit-${auditLot.id}`,
          label: `Lot audité : ${auditLot.id}`,
          pinColor: SUPERVISION_AUDIT_LOT_MAP_PIN,
        },
      ]
    }
    return fromActors
  }, [actors, auditLot])

  const gpsActorCount = useMemo(() => markersFromActors(actors).length, [actors])

  if (loading) {
    return (
      <div style={{ backgroundColor: theme.surface, minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: theme.primary }} />
      </div>
    )
  }

  if (!isAuthenticated || !canAccess) {
    return (
      <div className="page-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: theme.primary }} />
      </div>
    )
  }

  return (
    <RoleLayout role="ministere">
      <div className="w-full py-6 sm:py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
              Supervision nationale
            </h1>
            <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
              Audit de la filière cacao et alertes fraude.
            </p>
          </div>
          <Link
            href="/blockchain"
            className="px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
          >
            Explorer la blockchain
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center mb-4">
              <ScaleIcon className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Volume tracé</p>
            <p className="text-3xl font-black text-[var(--color-primary)] mt-1">
              {displayTracedVolume(stats, statsLoading)}
            </p>
          </div>
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center mb-4">
              <GlobeAmericasIcon className="w-6 h-6 text-[#1565C0]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lots actifs</p>
            <p className="text-3xl font-black text-[var(--color-primary)] mt-1">
              {displayKpiNumber(pickTotalLots(stats), statsLoading)}
            </p>
          </div>
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#F3E5F5] rounded-xl flex items-center justify-center mb-4">
              <DocumentCheckIcon className="w-6 h-6 text-[#7B1FA2]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lots en transit</p>
            <p className="text-3xl font-black text-[#E65100] mt-1">
              {displayKpiNumber(stats?.en_transit, statsLoading)}
            </p>
          </div>
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#FFEBEE] rounded-xl flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-[#B71C1C]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alertes fraude</p>
            <p className="text-3xl font-black text-[#B71C1C] mt-1">
              {displayKpiNumber(alertsCount, statsLoading)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
            <h3 className="text-xl font-black text-[var(--color-primary)] mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-[#B71C1C]" />
              Alertes fraude (aperçu)
            </h3>
            <ul className="space-y-3 text-sm text-[var(--color-muted)]">
              <li className="flex items-start gap-2 p-3 rounded-xl bg-red-50">
                <span className="font-bold text-red-700">Lots bloqués &gt; 30 jours</span>
                <span className="ml-auto font-black text-red-600">{displayKpiNumber(alertsCount, statsLoading)}</span>
              </li>
              <li className="p-3 rounded-xl bg-amber-50 text-amber-800">
                Variations de poids anormales — surveillance active via blockchain
              </li>
              <li className="p-3 rounded-xl bg-gray-50">
                Doublons détectés — corrélation GPS et identifiants lots
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-[var(--color-border)]">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-[#33691E]" />
              <h3 className="text-xl font-black text-[var(--color-primary)]">Cartographie nationale</h3>
            </div>
            <LocationMap height="280px" markers={mapMarkers} />
            <p className="px-6 py-3 text-xs text-[var(--color-muted)] border-t border-[var(--color-border)]">
              {gpsActorCount > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1.5 mr-2">
                    <span className="inline-block h-3 w-3 shrink-0 rounded-full bg-[#c62828] border border-white shadow-sm" aria-hidden />
                    Points rouges : « acteurs inscrits ayant renseigné leur GPS » à l&apos;enregistrement ({gpsActorCount}).{' '}
                  </span>
                  {auditLot ? (
                    <span className="inline-flex items-center gap-1.5">
                      Pastille bleue :
                      <span className="inline-block h-3 w-3 shrink-0 rounded-full bg-[#1565c0] border border-white shadow-sm" aria-hidden />
                      position du lot audité.
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  Aucune pastille rouge pour l&apos;instant : aucun acteur de la filière n&apos;a renseigné GPS à l&apos;inscription ; les coordonnées se saisissent lors de la création de compte ou sur le formulaire d&apos;enregistrement.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
          <h3 className="text-xl font-black text-[var(--color-primary)] mb-5 flex items-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5 text-[#33691E]" />
            Audit par identifiant de lot
          </h3>
          <div className="toolbar-row mb-6">
            <input
              type="text"
              className="form-input rounded-2xl text-sm font-bold"
              placeholder="Ex: LOT-2026-05015-00001"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void runAuditWithId(searchId)}
            />
            <button
              type="button"
              onClick={() => void runAuditWithId(searchId)}
              disabled={searching}
              className="px-6 py-3 bg-[#33691E] text-white rounded-2xl text-sm font-black hover:brightness-110 disabled:opacity-50"
            >
              {searching ? 'Recherche…' : 'Auditer'}
            </button>
          </div>
          {auditLot && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#F1F8E9] border border-[#C8E6C9] p-5">
                <p className="text-lg font-black text-[#1B5E20]">{auditLot.id}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {auditLot.culture} — {auditLot.quantite} kg — {auditLot.statut || '—'}
                </p>
                <Link href={`/lot-detail?id=${auditLot.id}`} className="inline-block mt-3 text-xs font-black text-[#33691E] hover:underline">
                  Voir le détail complet →
                </Link>
              </div>
              {coordsFromLot(auditLot.latitude, auditLot.longitude) && (
                <LocationMap
                  className="border border-[var(--color-border)] rounded-2xl overflow-hidden"
                  height="220px"
                  latitude={auditLot.latitude}
                  longitude={auditLot.longitude}
                />
              )}
              {auditHistory.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {auditHistory.map((ev, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 text-xs">
                      <span className="font-black uppercase text-[var(--color-primary)]">{ev.type}</span>
                      <span className="text-gray-500">{new Date(ev.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  )
}

export default function MinistereDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Chargement...</div>}>
      <MinistereDashboardContent />
    </Suspense>
  )
}
