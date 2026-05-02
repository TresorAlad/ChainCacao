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
  InboxArrowDownIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'

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
        api.get<Batch>(`/lot/${lotId}`),
        api.get<{ success: boolean; events: BatchHistoryEvent[] }>(`/lot/${lotId}/history`),
      ])
      setDetailData({ lot: lotRes.data as Batch, history: histRes.data.events || [] })
    } catch {
      toast.error('Lot introuvable')
    } finally {
      setSearching(false)
    }
  }

  const statusColor = (s?: string) => s === 'transfere' ? 'bg-blue-100 text-blue-700' : s === 'exporte' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
  const statusLabel = (s?: string) => s === 'transfere' ? 'Transféré' : s === 'exporte' ? 'Exporté' : s === 'cree' ? 'Reçu / Créé' : s || '—'
  const fmt = (d?: string) => { try { return d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—' } catch { return d || '—' } }

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
                  {myLots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-gray-50 transition-all">
                      <td className="py-4 text-sm font-mono font-bold text-[#1B5E20]">{lot.id}</td>
                      <td className="py-4 text-sm text-gray-700">{lot.culture}{lot.variete ? ` · ${lot.variete}` : ''}</td>
                      <td className="py-4 text-sm font-bold text-gray-700">{lot.quantite} kg</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest \${statusColor(lot.statut)}`}>
                          {statusLabel(lot.statut)}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setSearchId(lot.id); fetchLotWithHistory(lot.id) }} className="px-3 py-1.5 text-xs font-black bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                            Historique
                          </button>
                          <Link href={`/transfer?lot=\${lot.id}`} className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-[#33691E] text-white rounded-xl hover:brightness-110">
                            <ArrowRightIcon className="w-3 h-3" /> Transférer
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
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
          <div className="flex gap-3 mb-5">
            <input
              type="text"
              placeholder="Ex: TC-20260502-00001"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLotWithHistory()}
              className="flex-1 px-4 py-3 bg-gray-50 border border-[var(--color-border)] rounded-2xl text-sm font-bold text-[var(--color-primary)] focus:ring-2 focus:ring-[#33691E] outline-none"
            />
            <button onClick={() => fetchLotWithHistory()} disabled={searching} className="px-6 py-3 bg-[#33691E] text-white rounded-2xl text-sm font-black hover:brightness-110 disabled:opacity-50 flex items-center gap-2">
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
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase \${statusColor(detailData.lot.statut)}`}>{statusLabel(detailData.lot.statut)}</span>
                <div className="flex gap-2">
                  <Link href={`/lot-detail?id=\${detailData.lot.id}`} className="px-4 py-2 text-xs font-black bg-white border border-[#C8E6C9] rounded-xl text-[#33691E] hover:bg-[#E8F5E9]">Détail</Link>
                  <Link href={`/transfer?lot=\${detailData.lot.id}`} className="flex items-center gap-1 px-4 py-2 text-xs font-black bg-[#33691E] text-white rounded-xl hover:brightness-110">
                    <ArrowRightIcon className="w-4 h-4" /> Transférer
                  </Link>
                </div>
              </div>
              <div className="space-y-2">
                {detailData.history.map((ev, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-4 rounded-xl bg-gray-50">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black \${ev.type === 'transfert' ? 'bg-blue-100 text-blue-700' : ev.type === 'creation' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {ev.type === 'creation' ? '+' : ev.type === 'transfert' ? '→' : '·'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-black uppercase">{ev.type}</span>
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
