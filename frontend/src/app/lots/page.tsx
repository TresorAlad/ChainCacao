'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CubeIcon, PlusIcon, QrCodeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import api, { type Batch } from '@/lib/api'

function statusLabel(statut?: string): { label: string; cls: string } {
  switch ((statut || '').toUpperCase()) {
    case 'VERIFIED':
    case 'VÉRIFIÉ':
      return { label: 'VÉRIFIÉ', cls: 'bg-[#E8F5E9] text-[#2E7D32]' }
    case 'REJECTED':
    case 'REJETÉ':
      return { label: 'REJETÉ', cls: 'bg-[#FFEBEE] text-[#B71C1C]' }
    default:
      return { label: 'EN COURS', cls: 'bg-[#FFF3E0] text-[#E65100]' }
  }
}

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

  const fetchLot = useCallback(async (id: string) => {
    if (!id.trim()) return
    setSearching(true)
    setSearchResult(null)
    try {
      const res = await api.get<{ batch: Batch }>(`/lot/${id.trim()}`)
      const batch = res.data.batch ?? res.data
      setSearchResult(batch as Batch)
      setSelectedLot(batch as Batch)
    } catch {
      setSearchResult('not-found')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  // L'API n'expose pas GET /lot (liste globale) — les lots sont chargés via la recherche par ID

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
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">Gestion des Lots</h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Inventaire complet et traçabilité des récoltes de cacao.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/nouveau-lot')}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Nouveau Lot
          </button>
        </div>
      </header>

      {/* Recherche par ID */}
      <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)]">
        <p className="text-sm font-bold text-[var(--color-primary)] mb-3">Rechercher un lot par ID</p>
        <div className="flex gap-3">
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
            className="px-5 py-2 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:brightness-110 transition-all"
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
        <div className="flex-1 bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-[var(--color-primary)]">Registre des Récoltes</h3>
            <span className="px-3 py-1 bg-[#F1F8E9] text-[#33691E] rounded-full text-[10px] font-black uppercase tracking-widest">
              Total : {lots.length} lots
            </span>
          </div>

          {lots.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-4 text-center">
              <CubeIcon className="w-16 h-16 text-gray-200" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Aucun lot disponible</p>
              <p className="text-xs text-gray-400">Utilisez la recherche ci-dessus pour trouver un lot par ID,<br />ou créez un nouveau lot.</p>
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
                  {lots.map((lot) => {
                    const st = statusLabel(lot.statut)
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
                          <span className="text-sm font-black text-[var(--color-primary)]">{lot.quantite.toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">kg</span>
                        </td>
                        <td className="py-5 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${st.cls}`}>
                            {st.label}
                          </span>
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
                <div className="flex justify-between">
                  <span className="text-gray-500">EUDR</span>
                  <span className={`font-black ${selectedLot.eudr_conforme ? 'text-green-700' : 'text-red-600'}`}>
                    {selectedLot.eudr_conforme ? 'Conforme' : 'Non conforme'}
                  </span>
                </div>
              </div>

              <Link
                href={`/lot-detail?id=${selectedLot.id}`}
                className="w-full mt-8 py-4 bg-[#1B3A0F] text-white rounded-[1.5rem] text-sm font-bold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <CubeIcon className="w-5 h-5" />
                Voir historique complet
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
