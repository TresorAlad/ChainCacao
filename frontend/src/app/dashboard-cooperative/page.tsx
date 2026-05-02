'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleTheme } from '@/lib/role-themes'
import api, { type ActorDTO, type Batch, type BatchHistoryEvent } from '@/lib/api'
import {
  CalendarIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ScaleIcon,
  TruckIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function CooperativeDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('cooperative')

  const [actors, setActors] = useState<ActorDTO[]>([])
  const [fetching, setFetching] = useState(true)

  const [searchId, setSearchId] = useState('')
  const [foundLot, setFoundLot] = useState<Batch | null>(null)
  const [lotHistory, setLotHistory] = useState<BatchHistoryEvent[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    api.get<ActorDTO[] | { actors?: ActorDTO[]; data?: ActorDTO[] }>('/actors')
      .then((res) => {
        const raw = res.data
        const list = Array.isArray(raw) ? raw : (raw as { actors?: ActorDTO[] }).actors ?? (raw as { data?: ActorDTO[] }).data ?? []
        setActors(list)
      })
      .catch(() => setActors([]))
      .finally(() => setFetching(false))
  }, [isAuthenticated])

  if (loading || fetching) {
    return (
      <div style={{ backgroundColor: theme.surface, minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const fetchLotWithHistory = async () => {
    const id = searchId.trim()
    if (!id) { toast.error('Saisissez un ID de lot'); return }
    setSearching(true)
    setFoundLot(null)
    setLotHistory([])
    try {
      const [lotRes, histRes] = await Promise.all([
        api.get<Batch>(`/lot/${id}`),
        api.get<{ success: boolean; events: BatchHistoryEvent[] }>(`/lot/${id}/history`),
      ])
      const lot = (lotRes.data as unknown as { batch?: Batch }).batch ?? lotRes.data
      setFoundLot(lot)
      setLotHistory(histRes.data.events || [])
    } catch {
      toast.error('Lot introuvable')
      setFoundLot(null)
      setLotHistory([])
    } finally {
      setSearching(false)
    }
  }

  if (!isAuthenticated || user?.role !== 'cooperative') return null

  const agriculteurs = actors.filter(a => a.role === 'agriculteur')

  return (
    <RoleLayout role="cooperative">
      <div className="w-full py-6 sm:py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">Tableau de bord</h1>
            <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
              Bienvenue, voici un aperçu de votre chaîne d&apos;approvisionnement.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/eudr-report"
              className="px-6 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm font-bold text-[var(--color-muted)] hover:bg-gray-50 transition-colors"
            >
              Rapport EUDR
            </Link>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#33691E] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all">
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
            <p className="text-2xl font-black text-[var(--color-primary)] mt-1">— <span className="text-sm font-bold opacity-40 uppercase">kg</span></p>
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
            <p className="text-2xl font-black text-[var(--color-primary)] mt-1">— <span className="text-sm font-bold opacity-40 uppercase">cette semaine</span></p>
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

        {/* Recherche lot + historique des transferts */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] mb-10">
          <h3 className="text-2xl font-black text-[var(--color-primary)] mb-6">Suivre un lot & ses transferts</h3>

          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="text"
                placeholder="Ex: TC-20260502-00001"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLotWithHistory()}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[var(--color-border)] rounded-2xl text-sm font-bold text-[var(--color-primary)] focus:ring-2 focus:ring-[#33691E] outline-none"
              />
            </div>
            <button
              onClick={fetchLotWithHistory}
              disabled={searching}
              className="px-6 py-3 bg-[#33691E] text-white rounded-2xl text-sm font-black shadow-md hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {searching
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <MagnifyingGlassIcon className="w-5 h-5" />}
              Chercher
            </button>
          </div>

          {foundLot && (
            <div className="space-y-4">
              {/* Résumé du lot */}
              <div className="rounded-2xl bg-[#F1F8E9] border border-[#C8E6C9] p-5 flex flex-wrap gap-6 items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lot</p>
                  <p className="text-lg font-black text-[#1B5E20]">{foundLot.id}</p>
                  <p className="text-sm text-gray-600 mt-1">{foundLot.culture}{foundLot.variete ? ` · ${foundLot.variete}` : ''} — {foundLot.quantite} kg</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Propriétaire actuel</p>
                  <p className="text-sm font-bold text-[var(--color-primary)]">{foundLot.proprietaire_id || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Statut</p>
                  <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[#E8F5E9] text-[#2E7D32]">
                    {foundLot.statut || '—'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/lot-detail?id=${foundLot.id}`} className="px-4 py-2 text-xs font-black bg-white border border-[#C8E6C9] rounded-xl text-[#33691E] hover:bg-[#E8F5E9] transition-colors">
                    Détail complet
                  </Link>
                  <Link href={`/transfer?lot=${foundLot.id}`} className="flex items-center gap-1 px-4 py-2 text-xs font-black bg-[#33691E] text-white rounded-xl hover:brightness-110 transition-all">
                    <ArrowRightIcon className="w-4 h-4" /> Transférer
                  </Link>
                </div>
              </div>

              {/* Timeline des transferts */}
              {lotHistory.length > 0 ? (
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Historique blockchain ({lotHistory.length} événement{lotHistory.length > 1 ? 's' : ''})
                  </p>
                  <div className="space-y-2">
                    {lotHistory.map((ev, idx) => (
                      <div key={idx} className="flex gap-4 items-start p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black ${
                          ev.type === 'transfert' ? 'bg-blue-100 text-blue-700' :
                          ev.type === 'creation' ? 'bg-green-100 text-green-700' :
                          ev.type === 'export' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {ev.type === 'transfert' ? '→' : ev.type === 'creation' ? '+' : ev.type === 'export' ? '✓' : '·'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-2 items-center mb-1">
                            <span className="text-xs font-black text-[var(--color-primary)] uppercase">{ev.type}</span>
                            {ev.type === 'transfert' && (
                              <span className="text-xs text-gray-500 font-bold">
                                {ev.from_actor_id || '?'} <span className="text-[#33691E]">→</span> {ev.to_actor_id || '?'}
                              </span>
                            )}
                            {ev.commentaire && (
                              <span className="text-xs text-gray-400 italic">{ev.commentaire}</span>
                            )}
                          </div>
                          <div className="flex gap-4 text-[10px] text-gray-400 font-bold">
                            <span>{new Date(ev.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            <span className="font-mono truncate">Tx: {ev.tx_hash?.slice(0, 10)}…</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Aucun historique blockchain pour ce lot.</p>
              )}
            </div>
          )}

          {!foundLot && !searching && searchId.trim() !== '' && (
            <p className="text-sm text-gray-400 text-center py-6">Aucun lot trouvé pour cet ID.</p>
          )}

          {!foundLot && !searching && searchId.trim() === '' && (
            <p className="text-sm text-gray-400 text-center py-6">Saisissez un ID de lot pour voir son historique de transferts.</p>
          )}
        </div>

        {/* Carte GPS zones de collecte */}
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-[var(--color-border)]">
          <div className="p-8 border-b border-[var(--color-border)] flex justify-between items-center">
            <h3 className="text-2xl font-black text-[var(--color-primary)]">Zones de collecte actives</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase">
                <div className="w-2 h-2 rounded-full bg-[#33691E]" />
                Forte activité
              </span>
            </div>
          </div>
          <div className="h-[400px] relative">
            <img
              src="https://api.mapbox.com/styles/v1/mapbox/light-v10/static/1.23,43.60,11,0/1200x400?access_token=pk.xxx"
              className="w-full h-full object-cover grayscale opacity-50"
              alt="Carte de collecte"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=1200&h=400'
              }}
            />
            <div className="absolute inset-0 p-8 flex items-start justify-end">
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-[1.5rem] shadow-xl border border-white/50 w-64">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}
