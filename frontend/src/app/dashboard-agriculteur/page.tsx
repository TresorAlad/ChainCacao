'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleTheme } from '@/lib/role-themes'
import api, { type Batch, type BatchHistoryEvent } from '@/lib/api'
import {
  BeakerIcon,
  MapPinIcon,
  CheckCircleIcon,
  PlusIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface LotWithHistory {
  lot: Batch
  history: BatchHistoryEvent[]
}

export default function AgriculteurDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('agriculteur')

  const [searchId, setSearchId] = useState('')
  const [foundLot, setFoundLot] = useState<Batch | null | 'not-found'>(null)
  const [searching, setSearching] = useState(false)

  const [myLots, setMyLots] = useState<LotWithHistory[]>([])
  const [lotsLoading, setLotsLoading] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  // Charger les lots de l'utilisateur depuis localStorage
  useEffect(() => {
    if (!isAuthenticated) return
    const ids = JSON.parse(localStorage.getItem('chaincacao_my_lots') || '[]') as string[]
    if (ids.length === 0) return
    setLotsLoading(true)
    Promise.all(
      ids.map(async (id) => {
        try {
          const [lotRes, histRes] = await Promise.all([
            api.get<Batch>(`/lot/${id}`),
            api.get<{ success: boolean; events: BatchHistoryEvent[] }>(`/lot/${id}/history`),
          ])
          return { lot: lotRes.data as Batch, history: histRes.data.events || [] }
        } catch {
          return null
        }
      })
    ).then((results) => {
      setMyLots(results.filter(Boolean) as LotWithHistory[])
      setLotsLoading(false)
    })
  }, [isAuthenticated])

  const fetchLot = useCallback(async (id: string) => {
    if (!id.trim()) return
    setSearching(true)
    setFoundLot(null)
    try {
      const res = await api.get<Batch>(`/lot/${id.trim()}`)
      setFoundLot(res.data as Batch)
    } catch {
      setFoundLot('not-found')
      toast.error('Lot introuvable')
    } finally {
      setSearching(false)
    }
  }, [])

  const statusColor = (statut: string) => {
    if (statut === 'transfere') return 'bg-blue-100 text-blue-700'
    if (statut === 'exporte') return 'bg-purple-100 text-purple-700'
    return 'bg-green-100 text-green-700'
  }
  const statusLabel = (statut: string) => {
    if (statut === 'transfere') return 'Transféré'
    if (statut === 'exporte') return 'Exporté'
    if (statut === 'cree') return 'Créé'
    return statut || '—'
  }
  const fmt = (d?: string) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) } catch { return d }
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: theme.surface, minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'agriculteur') return null

  return (
    <RoleLayout role="agriculteur">
      <div className="w-full py-6 sm:py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: theme.primary }}>
              Bonjour, {user?.email?.split('@')[0] || user?.actor_id || 'Kofi'}
            </h1>
            <p className="text-lg mt-2 font-medium opacity-60" style={{ color: theme.text.secondary }}>
              Voici l&apos;état de votre récolte pour la saison actuelle.
            </p>
          </div>
          <Link
            href="/nouveau-lot"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Nouveau Lot
          </Link>
        </header>

        {/* KPI — pas d'endpoint personnel, on affiche — */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                <BeakerIcon className="w-6 h-6 text-[#2E7D32]" />
              </div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Production Totale</span>
            </div>
            <div className="text-4xl font-black text-[var(--color-primary)]">—</div>
            <p className="mt-3 text-xs font-medium text-gray-400">Recherchez un lot par ID ci-dessous</p>
          </div>

          <div className="bg-[#33691E] rounded-[2rem] p-8 shadow-lg relative overflow-hidden">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CubeIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">ID Acteur</span>
              </div>
              <div className="text-2xl font-black break-all">{user?.actor_id || '—'}</div>
              <p className="mt-3 text-sm font-medium text-white/60">Votre identifiant blockchain</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
            <CheckCircleIcon className="w-16 h-16 text-[#33691E]/30 mb-4" />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Statut Compte</p>
            <p className="text-2xl font-black text-[#2E7D32] mt-2">Actif</p>
          </div>
        </div>

        {/* Mes lots avec historique */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] mb-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <ClockIcon className="w-6 h-6 text-[#33691E]" />
              <h3 className="text-xl font-black text-[var(--color-primary)]">Mes lots &amp; historique</h3>
            </div>
            <Link href="/nouveau-lot" className="flex items-center gap-2 px-4 py-2 bg-[#1B3A0F] text-white rounded-xl text-xs font-black hover:brightness-110 transition-all">
              <PlusIcon className="w-4 h-4" /> Nouveau lot
            </Link>
          </div>

          {lotsLoading ? (
            <div className="py-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-[#33691E] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : myLots.length === 0 ? (
            <div className="py-10 text-center">
              <BeakerIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">Aucun lot créé encore.</p>
              <p className="text-xs text-gray-400 mt-1">Vos lots apparaîtront ici après création.</p>
              <Link href="/nouveau-lot" className="inline-block mt-4 px-6 py-2 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold hover:brightness-110">
                Créer mon premier lot
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myLots.map(({ lot, history }) => (
                <div key={lot.id} className="rounded-2xl border border-gray-100 overflow-hidden">
                  {/* En-tête du lot */}
                  <div className="flex flex-wrap gap-3 items-center justify-between p-5 bg-[#F9FBF7]">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Lot</p>
                      <p className="text-base font-black text-[#1B5E20]">{lot.id}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {lot.culture}{lot.variete ? ` · ${lot.variete}` : ''} — <strong>{lot.quantite} kg</strong>
                        {lot.lieu ? ` · ${lot.lieu}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusColor(lot.statut ?? '')}`}>
                        {statusLabel(lot.statut ?? '')}
                      </span>
                      <Link href={`/lot-detail?id=${lot.id}`} className="px-4 py-2 bg-white border border-gray-200 text-[#33691E] rounded-xl text-xs font-black hover:bg-[#F1F8E9] transition-colors">
                        Détail
                      </Link>
                      {lot.statut !== 'exporte' && (
                        <Link href={`/transfer?lot=${lot.id}`} className="flex items-center gap-1 px-4 py-2 bg-[#33691E] text-white rounded-xl text-xs font-black hover:brightness-110 transition-all">
                          <ArrowRightIcon className="w-3 h-3" /> Transférer
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Timeline des événements blockchain */}
                  {history.length > 0 && (
                    <div className="p-5 space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                        Blockchain · {history.length} événement{history.length > 1 ? 's' : ''}
                      </p>
                      {history.map((ev, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                            ev.type === 'transfert' ? 'bg-blue-100 text-blue-700' :
                            ev.type === 'creation' ? 'bg-green-100 text-green-700' :
                            ev.type === 'export' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {ev.type === 'creation' ? '+' : ev.type === 'transfert' ? '→' : ev.type === 'export' ? '✓' : '·'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-xs font-black text-[var(--color-primary)] uppercase">{ev.type}</span>
                              {ev.type === 'transfert' && (
                                <span className="text-xs text-gray-500">{ev.from_actor_id} → {ev.to_actor_id}</span>
                              )}
                              {ev.commentaire && <span className="text-xs text-gray-400 italic">· {ev.commentaire}</span>}
                            </div>
                            <div className="flex gap-4 mt-0.5 text-[10px] text-gray-400">
                              <span>{fmt(ev.created_at)}</span>
                              <span className="font-mono truncate">Tx: {ev.tx_hash?.slice(0, 12)}…</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recherche lot par ID */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] mb-12">
          <h3 className="text-xl font-black text-[var(--color-primary)] mb-4 flex items-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5 text-[#33691E]" /> Rechercher un lot par ID
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLot(searchId)}
              placeholder="Ex: TC-20260502-00001"
              className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[#33691E] outline-none"
            />
            <button
              onClick={() => fetchLot(searchId)}
              disabled={searching || !searchId.trim()}
              className="px-6 py-3 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {searching ? '…' : 'Chercher'}
            </button>
          </div>
          {foundLot && foundLot !== 'not-found' && (
            <div className="mt-4 p-4 bg-[#F1F8E9] rounded-2xl border border-[#C5E1A5]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-[#1B5E20]">{foundLot.id}</p>
                  <p className="text-xs text-gray-500 mt-1">{foundLot.culture} — {foundLot.quantite} kg · {statusLabel(foundLot.statut ?? '')}</p>
                </div>
                <Link href={`/lot-detail?id=${foundLot.id}`} className="px-4 py-2 bg-[#1B3A0F] text-white rounded-xl text-xs font-bold hover:brightness-110">
                  Voir détail
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Carte GPS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-8 relative rounded-[2rem] overflow-hidden shadow-sm border border-[var(--color-border)] h-[400px]">
            <img
              src="https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-1.28,5.12,14,0/800x400?access_token=pk.eyJ1IjoiY2hhaW5jYWNhbyIsImEiOiJjbHNnd2R2bmwwMWZpMnJvN2x3eGZ3bmM4In0.xxx"
              alt="Vue Satellite des Parcelles"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&q=80&w=800&h=400'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl text-white">
              <MapPinIcon className="w-5 h-5" />
              <span className="text-sm font-bold">Vue des Parcelles • {user?.actor_id || 'Ma parcelle'}</span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#F1F8E9] rounded-[2rem] p-8 border border-[var(--color-secondary-light)]/30 flex flex-col justify-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
              <CheckCircleIcon className="w-6 h-6 text-[#33691E]" />
            </div>
            <h3 className="text-2xl font-black text-[var(--color-primary)] mb-4">Traçabilité Blockchain</h3>
            <p className="text-sm font-medium text-[var(--color-primary)]/60 mb-8">
              Vos lots sont sécurisés et traçables sur la blockchain du réseau ChainCacao.
            </p>
            <div className="space-y-3">
              <Link
                href="/sync"
                className="block w-full py-3 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold text-center hover:brightness-110 transition-all"
              >
                Synchroniser mes lots
              </Link>
              <Link
                href="/lots"
                className="block w-full py-3 bg-white border border-[var(--color-border)] text-[var(--color-primary)] rounded-xl text-sm font-bold text-center hover:bg-gray-50 transition-all"
              >
                Gérer mes lots
              </Link>
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}
