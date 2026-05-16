'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleTheme } from '@/lib/role-themes'
import api, { type ActorDTO, type Batch, type BatchHistoryEvent, unwrapLotFromResponse } from '@/lib/api'
import {
  CalendarIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ScaleIcon,
  TruckIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  InboxArrowDownIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { LocationMap } from '@/components/maps/LocationMapDynamic'
import { markersFromActors, markersFromLots, type MapMarker } from '@/lib/geo-utils'
import { canPayLot, canTransferLot, historyEventLabel, isEnTransit } from '@/lib/lot-workflow'

interface LotWithHistory { lot: Batch; history: BatchHistoryEvent[] }

export default function CooperativeDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('cooperative')

  const [actors, setActors] = useState<ActorDTO[]>([])
  const [fetching, setFetching] = useState(true)

  // Lots reçus (propriétaire courant = moi)
  const [myLots, setMyLots] = useState<Batch[]>([])
  const [lotsLoading, setLotsLoading] = useState(false)

  // Détail / historique d'un lot spécifique
  const [searchId, setSearchId] = useState('')
  const [detailData, setDetailData] = useState<LotWithHistory | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    // Acteurs du réseau
    api.get<ActorDTO[] | { actors?: ActorDTO[]; data?: ActorDTO[] }>('/actors')
      .then((res) => {
        const raw = res.data
        const list = Array.isArray(raw) ? raw : (raw as { actors?: ActorDTO[] }).actors ?? (raw as { data?: ActorDTO[] }).data ?? []
        setActors(list)
      })
      .catch(() => setActors([]))
      .finally(() => setFetching(false))

    // Lots dont je suis le propriétaire courant (transferts reçus inclus)
    setLotsLoading(true)
    api.get<{ success: boolean; lots: Batch[] }>('/actors/me/lots')
      .then((res) => setMyLots(res.data.lots || []))
      .catch(() => setMyLots([]))
      .finally(() => setLotsLoading(false))
  }, [isAuthenticated])

  const agriculteurs = useMemo(() => actors.filter((a) => a.role === 'agriculteur'), [actors])

  const collectMapMarkers = useMemo<MapMarker[]>(() => {
    const lotMarkers = markersFromLots(myLots)
    const farmerMarkers = markersFromActors(agriculteurs, { idPrefix: 'agri' })
    return [...farmerMarkers, ...lotMarkers]
  }, [myLots, agriculteurs])

  const geoLotCount = useMemo(() => markersFromLots(myLots).length, [myLots])

  const [networkProductionKg, setNetworkProductionKg] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated || agriculteurs.length === 0) {
      setNetworkProductionKg(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const results = await Promise.all(
          agriculteurs.slice(0, 40).map((a) =>
            api
              .get<{ success?: boolean; lots?: Batch[] }>(`/actors/${encodeURIComponent(a.id)}/lots`)
              .then((r) => r.data.lots ?? [])
              .catch(() => [] as Batch[])
          )
        )
        if (cancelled) return
        const seen = new Set<string>()
        let kg = 0
        for (const list of results) {
          for (const lot of list) {
            if (!lot.id || seen.has(lot.id)) continue
            seen.add(lot.id)
            kg += Number(lot.quantite) || 0
          }
        }
        setNetworkProductionKg(kg)
      } catch {
        if (!cancelled) setNetworkProductionKg(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, agriculteurs])

  const totalProductionKg = useMemo(() => {
    if (networkProductionKg != null && networkProductionKg > 0) return networkProductionKg
    return myLots.reduce((sum, lot) => sum + (Number(lot.quantite) || 0), 0)
  }, [networkProductionKg, myLots])

  const collectedThisWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return myLots.filter((lot) => {
      const raw = lot.timestamp || lot.date_recolte
      if (!raw) return false
      const t = new Date(raw).getTime()
      return !Number.isNaN(t) && t >= cutoff
    })
  }, [myLots])

  const collectedWeekKg = useMemo(
    () => collectedThisWeek.reduce((sum, lot) => sum + (Number(lot.quantite) || 0), 0),
    [collectedThisWeek]
  )

  if (loading || fetching) {
    return (
      <div style={{ backgroundColor: theme.surface, minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const fetchLotWithHistory = async (id?: string) => {
    const lotId = (id ?? searchId).trim()
    if (!lotId) { toast.error('Saisissez un ID de lot'); return }
    setSearching(true)
    setDetailData(null)
    try {
      const [lotRes, histRes] = await Promise.all([
        api.get(`/lot/${lotId}`),
        api.get<{ success: boolean; events: BatchHistoryEvent[] }>(`/lot/${lotId}/history`),
      ])
      const b = unwrapLotFromResponse(lotRes.data)
      if (!b) {
        toast.error('Réponse lot invalide')
        return
      }
      setDetailData({ lot: b, history: histRes.data.events || [] })
    } catch {
      toast.error('Lot introuvable')
    } finally {
      setSearching(false)
    }
  }

  const statusColor = (s?: string) => {
    const x = (s || '').toLowerCase()
    if (x === 'en_transit') return 'bg-amber-100 text-amber-800'
    if (x === 'transfere') return 'bg-blue-100 text-blue-700'
    if (x === 'exporte') return 'bg-purple-100 text-purple-700'
    if (x === 'recu') return 'bg-teal-100 text-teal-800'
    return 'bg-green-100 text-green-700'
  }
  const statusLabel = (s?: string) => {
    const x = (s || '').toLowerCase()
    if (x === 'en_transit') return 'En transit'
    if (x === 'transfere') return 'Transféré'
    if (x === 'exporte') return 'Exporté'
    if (x === 'recu') return 'Reçu'
    if (x === 'cree') return 'Créé'
    return s || '—'
  }
  const fmt = (d?: string) => { try { return d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—' } catch { return d || '—' } }

  if (!isAuthenticated || user?.role !== 'cooperative') return null

  return (
    <RoleLayout role="cooperative">
      <div className="w-full py-6 sm:py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="page-heading">Tableau de bord</h1>
            <p className="page-subtitle">
              Bienvenue, voici un aperçu de votre chaîne d&apos;approvisionnement.
            </p>
          </div>
          <div className="page-actions">
            <Link
              href="/liste-groupee"
              className="px-6 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm font-bold text-[var(--color-muted)] hover:bg-gray-50 transition-colors text-center"
            >
              Liste groupée
            </Link>
            <Link
              href="/paiement-lot"
              className="px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all text-center"
            >
              Payer un lot
            </Link>
            <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#33691E] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all">
              <CalendarIcon className="w-5 h-5" />
              Derniers 30 jours
            </button>
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                <ScaleIcon className="w-6 h-6 text-[#2E7D32]" />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Production Totale</p>
            <p className="text-2xl font-black text-[var(--color-primary)] mt-1">
              {lotsLoading ? '…' : totalProductionKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}{' '}
              <span className="text-sm font-bold opacity-40 uppercase">kg</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">
              {agriculteurs.length > 0 ? 'Réseau agriculteurs' : 'Lots en possession'}
            </p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-[#1565C0]" />
              </div>
              <span className="text-xs font-bold text-[#1565C0] bg-[#E3F2FD] px-2 py-1 rounded-lg">{actors.length}</span>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Acteurs enregistrés</p>
            <p className="text-2xl font-black text-[var(--color-primary)] mt-1">{agriculteurs.length} <span className="text-sm font-bold opacity-40 uppercase">agriculteurs</span></p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-[#FFF3E0] rounded-xl flex items-center justify-center">
                <TruckIcon className="w-6 h-6 text-[#E65100]" />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lots Collectés</p>
            <p className="text-2xl font-black text-[var(--color-primary)] mt-1">
              {lotsLoading ? '…' : collectedThisWeek.length}{' '}
              <span className="text-sm font-bold opacity-40 uppercase">lots</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">
              {lotsLoading
                ? '…'
                : `${collectedWeekKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg · 7 derniers jours`}
            </p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-[#2E7D32]" />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID Acteur</p>
            <p className="text-sm font-black text-[var(--color-primary)] mt-1 break-all">{user?.actor_id || '—'}</p>
          </div>
        </div>

        {/* Actors list */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] mb-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-[var(--color-primary)]">Acteurs du réseau</h3>
            <Link href="/actors" className="text-sm font-bold text-[#33691E] hover:underline">Voir tout</Link>
          </div>
          {actors.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <UserGroupIcon className="w-12 h-12 text-gray-200" />
              <p className="text-sm text-gray-400">Aucun acteur disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom</th>
                    <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle</th>
                    <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {actors.slice(0, 6).map((actor) => (
                    <tr key={actor.id} className="hover:bg-gray-50 transition-all">
                      <td className="py-4 text-sm font-bold text-[var(--color-primary)]">{actor.nom}</td>
                      <td className="py-4 text-xs text-gray-500 capitalize">{actor.role}</td>
                      <td className="py-4 text-xs font-mono text-gray-400">{actor.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Lots reçus / détenus */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] mb-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <InboxArrowDownIcon className="w-6 h-6 text-[#33691E]" />
              <h3 className="text-2xl font-black text-[var(--color-primary)]">
                Lots reçus / en ma possession
                {myLots.length > 0 && <span className="ml-2 text-sm font-bold text-[#33691E]">({myLots.length})</span>}
              </h3>
            </div>
          </div>

          {lotsLoading ? (
            <div className="py-8 flex justify-center"><div className="w-8 h-8 border-4 border-[#33691E] border-t-transparent rounded-full animate-spin" /></div>
          ) : myLots.length === 0 ? (
            <div className="py-10 text-center">
              <InboxArrowDownIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">Aucun lot en votre possession pour le moment.</p>
              <p className="text-xs text-gray-400 mt-1">Les lots qui vous sont transférés apparaîtront ici automatiquement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Lot</th>
                    <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Culture</th>
                    <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantité</th>
                    <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                    <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myLots.map((lot) => {
                    const isTransferredAway = Boolean(
                      user?.actor_id &&
                        lot.proprietaire_id &&
                        lot.proprietaire_id !== user.actor_id
                    )
                    const enTransit = isEnTransit(lot.statut)
                    const canTransfer = !isTransferredAway && canTransferLot(lot.statut)
                    const canPay =
                      !isTransferredAway && canPayLot(lot.statut) && !enTransit
                    return (
                    <tr key={lot.id} className="hover:bg-gray-50 transition-all">
                      <td className="py-4 text-sm font-mono font-bold text-[#1B5E20]">
                        {lot.id}
                        {isTransferredAway ? (
                          <span className="ml-2 text-[9px] font-black uppercase text-blue-600">· transféré</span>
                        ) : null}
                      </td>
                      <td className="py-4 text-sm text-gray-700">{lot.culture}{lot.variete ? ` · ${lot.variete}` : ''}</td>
                      <td className="py-4 text-sm font-bold text-gray-700">{lot.quantite} kg</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusColor(lot.statut)}`}>
                          {statusLabel(lot.statut)}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setSearchId(lot.id); fetchLotWithHistory(lot.id) }} className="px-3 py-1.5 text-xs font-black bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                            Historique
                          </button>
                          {enTransit ? (
                            <Link href={`/reception-lot?lot=${encodeURIComponent(lot.id)}`} className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-amber-500 text-white rounded-xl hover:brightness-110">
                              <InboxArrowDownIcon className="w-3 h-3" /> Réception
                            </Link>
                          ) : canPay ? (
                            <Link href={`/paiement-lot?lot=${encodeURIComponent(lot.id)}`} className="px-3 py-1.5 text-xs font-black bg-emerald-700 text-white rounded-xl hover:brightness-110">
                              Payer
                            </Link>
                          ) : canTransfer ? (
                            <Link href={`/transfer?lot=${lot.id}`} className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-[#33691E] text-white rounded-xl hover:brightness-110">
                              <ArrowRightIcon className="w-3 h-3" /> Transférer
                            </Link>
                          ) : isTransferredAway ? (
                            <Link href={`/lot-detail?id=${lot.id}`} className="px-3 py-1.5 text-xs font-black bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100">
                              Détail
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Suivi par ID */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] mb-10">
          <h3 className="text-xl font-black text-[var(--color-primary)] mb-5 flex items-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5 text-[#33691E]" /> Suivi par ID de lot
          </h3>
          <div className="toolbar-row mb-5">
            <input
              type="text"
              placeholder="Ex: TC-20260502-00001"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLotWithHistory()}
              className="form-input rounded-2xl text-sm font-bold"
            />
            <button onClick={() => fetchLotWithHistory()} disabled={searching} className="btn-primary px-6 py-3 rounded-2xl text-sm font-black disabled:opacity-50 flex items-center gap-2">
              {searching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MagnifyingGlassIcon className="w-5 h-5" />}
              Chercher
            </button>
          </div>
          {detailData && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#F1F8E9] border border-[#C8E6C9] p-5 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <p className="text-lg font-black text-[#1B5E20]">{detailData.lot.id}</p>
                  <p className="text-sm text-gray-600">{detailData.lot.culture} — {detailData.lot.quantite} kg</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${statusColor(detailData.lot.statut)}`}>{statusLabel(detailData.lot.statut)}</span>
                <div className="flex gap-2">
                  <Link href={`/lot-detail?id=${detailData.lot.id}`} className="px-4 py-2 text-xs font-black bg-white border border-[#C8E6C9] rounded-xl text-[#33691E] hover:bg-[#E8F5E9]">Détail</Link>
                  {isEnTransit(detailData.lot.statut) ? (
                    <Link href={`/reception-lot?lot=${encodeURIComponent(detailData.lot.id)}`} className="flex items-center gap-1 px-4 py-2 text-xs font-black bg-amber-500 text-white rounded-xl hover:brightness-110">
                      <InboxArrowDownIcon className="w-4 h-4" /> Confirmer réception
                    </Link>
                  ) : canTransferLot(detailData.lot.statut) ? (
                    <Link href={`/transfer?lot=${detailData.lot.id}`} className="flex items-center gap-1 px-4 py-2 text-xs font-black bg-[#33691E] text-white rounded-xl hover:brightness-110">
                      <ArrowRightIcon className="w-4 h-4" /> Transférer
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                {detailData.history.map((ev, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-4 rounded-xl bg-gray-50">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black ${ev.type === 'transfert' ? 'bg-blue-100 text-blue-700' : ev.type === 'creation' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {ev.type === 'creation' ? '+' : ev.type === 'transfert' ? '→' : '·'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-black uppercase">{historyEventLabel(ev.type)}</span>
                        {ev.type === 'transfert' && <span className="text-xs text-gray-500">{ev.from_actor_id} → {ev.to_actor_id}</span>}
                        {ev.commentaire && <span className="text-xs text-gray-400 italic">· {ev.commentaire}</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{fmt(ev.created_at)} · Tx: {ev.tx_hash?.slice(0, 12)}…</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Carte GPS zones de collecte */}
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-[var(--color-border)]">
          <div className="p-4 sm:p-8 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h3 className="text-xl sm:text-2xl font-black text-[var(--color-primary)]">Zones de collecte actives</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase">
                <div className="w-2 h-2 rounded-full bg-[#33691E]" />
                Forte activité
              </span>
            </div>
          </div>
          <div className="h-[400px] relative">
            <LocationMap height="400px" markers={collectMapMarkers} className="h-full" />
            <div className="absolute inset-0 p-3 sm:p-8 flex items-end sm:items-start justify-center sm:justify-end pointer-events-none">
              <div className="bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-[1.5rem] shadow-xl border border-white/50 w-full max-w-[16rem] sm:w-64 mx-3 sm:mx-0 mb-3 sm:mb-0">
                <h4 className="text-sm font-black text-[var(--color-primary)] mb-3 uppercase tracking-widest">Réseau ChainCacao</h4>
                <div className="space-y-2 text-xs font-bold">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Acteurs actifs</span>
                    <span className="text-[var(--color-primary)]">{actors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Agriculteurs</span>
                    <span className="text-[var(--color-primary)]">{agriculteurs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lots GPS</span>
                    <span className="text-[var(--color-primary)]">{geoLotCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}
