'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CubeIcon, PlusIcon, QrCodeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import api, { type Batch, type BatchHistoryEvent, unwrapLotFromResponse } from '@/lib/api'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/error-utils'
import { canCreateLot } from '@/lib/role-nav'
import {
  canPayLot,
  historyActorSummary,
  historyEventLabel,
  isEnTransit,
  lotStatutDisplay,
} from '@/lib/lot-workflow'

function formatDate(d?: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('fr-FR') } catch { return d }
}

export default function LotsPage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const [lots, setLots] = useState<Batch[]>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [selectedLot, setSelectedLot] = useState<Batch | null>(null)
  const [searchId, setSearchId] = useState('')
  const [searchResult, setSearchResult] = useState<Batch | null | 'not-found'>(null)
  const [searching, setSearching] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [panelHistory, setPanelHistory] = useState<BatchHistoryEvent[]>([])
  const [panelHistoryLoading, setPanelHistoryLoading] = useState(false)
  const [lotsError, setLotsError] = useState<string | null>(null)

  const filteredLots =
    statusFilter === 'all'
      ? lots
      : lots.filter((l) => {
          const st = (l.statut || '').toLowerCase().trim()
          if (statusFilter === 'transfere') return st === 'transfere'
          return st === statusFilter
        })

  useEffect(() => {
    if (!selectedLot?.id) {
      setPanelHistory([])
      return
    }
    setPanelHistoryLoading(true)
    api
      .get<{ success: boolean; events: BatchHistoryEvent[] }>(
        `/lot/${encodeURIComponent(selectedLot.id)}/history`
      )
      .then((res) => setPanelHistory(res.data.events || []))
      .catch(() => setPanelHistory([]))
      .finally(() => setPanelHistoryLoading(false))
  }, [selectedLot?.id])

  const fetchLot = useCallback(async (id: string) => {
    if (!id.trim()) return
    setSearching(true)
    setSearchResult(null)
    try {
      const res = await api.get(`/lot/${id.trim()}`)
      const batch = unwrapLotFromResponse(res.data)
      if (!batch) {
        setSearchResult('not-found')
        return
      }
      setSearchResult(batch)
      setSelectedLot(batch)
    } catch {
      setSearchResult('not-found')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!isAuthenticated || !user?.role) return
    if (!['agriculteur', 'cooperative', 'transformateur', 'exportateur', 'admin'].includes(user.role)) return
    setFetching(true)
    setLotsError(null)
    api
      .get<{ success: boolean; lots: Batch[] }>('/actors/me/lots')
      .then((res) => {
        setLots(res.data.lots || [])
        setLotsError(null)
      })
      .catch((err: unknown) => {
        const msg = getErrorMessage(err, 'Impossible de charger vos lots')
        setLotsError(msg)
        setLots([])
        toast.error(msg)
      })
      .finally(() => setFetching(false))
  }, [isAuthenticated, user])

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="w-full py-6 sm:py-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="page-heading">Gestion des Lots</h1>
          <p className="page-subtitle">
            Inventaire complet et traçabilité des récoltes de cacao.
          </p>
        </div>
        {canCreateLot(user?.role) ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/nouveau-lot')}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              Nouveau Lot
            </button>
          </div>
        ) : null}
      </header>

      {/* Recherche par ID */}
      <div className="mb-8 card p-4 sm:p-6">
        <p className="text-sm font-bold text-[var(--color-primary)] mb-3">Rechercher un lot par ID</p>
        <div className="toolbar-row">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLot(searchId)}
              placeholder="Ex: 4CB-3409-A45"
              className="pl-10 pr-4 py-2 w-full border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            />
          </div>
          <button
            onClick={() => fetchLot(searchId)}
            disabled={searching || !searchId.trim()}
            className="btn-primary px-5 py-2 disabled:opacity-50"
          >
            {searching ? '…' : 'Chercher'}
          </button>
        </div>
        {searchResult === 'not-found' && (
          <p className="mt-2 text-sm text-red-600">Aucun lot trouvé pour cet identifiant.</p>
        )}
        {searchResult && searchResult !== 'not-found' && (
          <p className="mt-2 text-sm text-green-700 font-medium">
            Lot trouvé : <span className="font-black">{searchResult.id}</span> — {searchResult.quantite} kg
          </p>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Table */}
        <div className="flex-1 card-panel overflow-hidden min-w-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-[var(--color-primary)]">Registre des Récoltes</h3>
            <span className="px-3 py-1 bg-[#F1F8E9] text-[#33691E] rounded-full text-[10px] font-black uppercase tracking-widest">
              Total : {filteredLots.length} lots
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'cree', label: 'Créés' },
              { key: 'en_transit', label: 'En transit' },
              { key: 'recu', label: 'Reçus' },
              { key: 'transfere', label: 'Transférés' },
              { key: 'exporte', label: 'Exportés' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
                  statusFilter === key ? 'bg-[#1B3A0F] text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {lotsError ? (
            <div className="py-8 px-4 mb-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800">
              <p className="font-bold mb-1">Erreur serveur / blockchain</p>
              <p>{lotsError}</p>
              <p className="text-xs mt-2 text-red-700">
                Vérifiez que l&apos;API et Hyperledger Fabric tournent sur le serveur (redéploiement récent = ledger parfois vide).
              </p>
            </div>
          ) : null}
          {filteredLots.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-4 text-center">
              <CubeIcon className="w-16 h-16 text-gray-200" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Aucun lot sur ce serveur</p>
              <p className="text-xs text-gray-500 max-w-md">
                Les lots créés <strong>en local</strong> (localhost) ne sont pas sur Vercel / EC2.
                Après un redéploiement, le ledger peut être vide : créez un nouveau lot ou recherchez un ID existant.
              </p>
              <p className="text-xs text-gray-400">Recherche par ID ci-dessus, ou créez un lot ci-dessous.</p>
              <Link href="/nouveau-lot" className="mt-2 px-5 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all">
                Créer un lot
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lot ID</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Propriétaire</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Poids</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Statut</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLots.map((lot) => {
                    const st = lotStatutDisplay(lot.statut)
                    const isTransferredAway = Boolean(
                      user?.actor_id &&
                        lot.proprietaire_id &&
                        lot.proprietaire_id !== user.actor_id
                    )
                    return (
                      <tr
                        key={lot.id}
                        className={`group hover:bg-gray-50 transition-all cursor-pointer ${selectedLot?.id === lot.id ? 'bg-[#F1F8E9]/50' : ''}`}
                        onClick={() => setSelectedLot(lot)}
                      >
                        <td className="py-5">
                          <p className="text-sm font-black text-[var(--color-primary)]">{lot.id.split('-')[0]}</p>
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{lot.id.substring(4)}</p>
                        </td>
                        <td className="py-5 text-sm font-bold text-[var(--color-primary)]">{lot.proprietaire_id}</td>
                        <td className="py-5 text-center">
                          <span className="text-sm font-black text-[var(--color-primary)]">{(Number(lot.quantite) || 0).toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">kg</span>
                        </td>
                        <td className="py-5 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${st.cls}`}>
                            {st.label}
                          </span>
                          {isTransferredAway ? (
                            <span className="ml-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-blue-50 text-blue-700">
                              Traçabilité
                            </span>
                          ) : null}
                        </td>
                        <td className="py-5 text-right">
                          <Link href={`/lot-detail?id=${lot.id}`} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all inline-block">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedLot && (
          <div className="w-full xl:w-[400px] flex-shrink-0 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
              <h3 className="text-xl font-black text-[var(--color-primary)] mb-6">Détails de Traçabilité</h3>

              <div className="aspect-square bg-gray-50 rounded-[2rem] mb-8 flex items-center justify-center border-2 border-dashed border-gray-200 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#33691E]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <QrCodeIcon className="w-32 h-32 text-gray-300 group-hover:text-[#33691E] transition-colors" />
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID : {selectedLot.id}</p>
                </div>
              </div>

              <div className="mb-4">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${lotStatutDisplay(selectedLot.statut).cls}`}
                >
                  {lotStatutDisplay(selectedLot.statut).label}
                </span>
                {isEnTransit(selectedLot.statut) ? (
                  <p className="text-xs text-amber-800 mt-2 font-medium">
                    Réception physique requise avant un nouveau transfert.
                  </p>
                ) : null}
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Culture</span>
                  <span className="font-bold text-[var(--color-primary)]">{selectedLot.culture}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantité</span>
                  <span className="font-bold text-[var(--color-primary)]">{selectedLot.quantite} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lieu</span>
                  <span className="font-bold text-[var(--color-primary)]">{selectedLot.lieu || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date récolte</span>
                  <span className="font-bold text-[var(--color-primary)]">{formatDate(selectedLot.date_recolte)}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3">
                  Historique ({panelHistory.length})
                </p>
                {panelHistoryLoading ? (
                  <p className="text-xs text-gray-400">Chargement…</p>
                ) : panelHistory.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucun événement enregistré.</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {panelHistory.map((ev, idx) => (
                      <li key={idx} className="text-xs rounded-xl bg-gray-50 p-3">
                        <p className="font-bold text-[var(--color-primary)]">{historyEventLabel(ev.type)}</p>
                        <p className="text-gray-600 mt-0.5">{historyActorSummary(ev)}</p>
                        <p className="text-gray-400 mt-1">
                          {ev.created_at ? new Date(ev.created_at).toLocaleString('fr-FR') : '—'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-6">
                {isEnTransit(selectedLot.statut) &&
                user?.role &&
                ['cooperative', 'transformateur', 'exportateur', 'admin'].includes(user.role) &&
                selectedLot.proprietaire_id === user.actor_id ? (
                  <Link
                    href={`/reception-lot?lot=${encodeURIComponent(selectedLot.id)}`}
                    className="w-full py-3 bg-amber-500 text-white rounded-[1.5rem] text-sm font-bold text-center hover:brightness-110"
                  >
                    Confirmer réception
                  </Link>
                ) : null}
                {user?.role &&
                ['cooperative', 'transformateur', 'exportateur', 'admin'].includes(user.role) &&
                selectedLot.proprietaire_id === user.actor_id &&
                canPayLot(selectedLot.statut) &&
                !isEnTransit(selectedLot.statut) ? (
                  <Link
                    href={`/paiement-lot?lot=${encodeURIComponent(selectedLot.id)}`}
                    className="w-full py-3 bg-emerald-700 text-white rounded-[1.5rem] text-sm font-bold text-center hover:brightness-110"
                  >
                    Payer le producteur
                  </Link>
                ) : null}
                <Link
                  href={`/full-history?lot=${encodeURIComponent(selectedLot.id)}`}
                  className="w-full py-3 bg-[#1B3A0F] text-white rounded-[1.5rem] text-sm font-bold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <CubeIcon className="w-5 h-5" />
                  Historique complet
                </Link>
                <Link
                  href={`/lot-detail?id=${selectedLot.id}`}
                  className="w-full py-3 border border-[#C8E6C9] text-[#33691E] rounded-[1.5rem] text-sm font-bold text-center hover:bg-[#F1F8E9]"
                >
                  Détail du lot
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
