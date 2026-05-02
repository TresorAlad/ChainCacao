'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowDownTrayIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import api from '@/lib/api'

interface TransferRow {
  id?: string
  batch_id?: string
  lot_id?: string
  from_actor_id?: string
  to_actor_id?: string
  from_actor?: string
  to_actor?: string
  sender?: string
  receiver?: string
  created_at?: string
  date?: string
  type?: string
  tx_hash?: string
  commentaire?: string
  status?: string
}

function formatDate(d?: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return d }
}

function shortHash(h?: string) {
  if (!h) return '—'
  if (h.length <= 12) return h
  return `${h.slice(0, 6)}…${h.slice(-4)}`
}

export default function TransactionsPage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const [transfers, setTransfers] = useState<TransferRow[]>([])
  const [fetching, setFetching] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    const admin = user.role === 'admin'
    setIsAdmin(admin)
    setFetching(true)
    const endpoint = admin ? '/dashboard/recent-transfers' : null
    if (!endpoint) {
      setTransfers([])
      setFetching(false)
      return
    }
    api.get<TransferRow[] | { transfers?: TransferRow[]; data?: TransferRow[] }>(endpoint)
      .then((res) => {
        const raw = res.data
        const list = Array.isArray(raw) ? raw : (raw as { transfers?: TransferRow[]; data?: TransferRow[] }).transfers ?? (raw as { data?: TransferRow[] }).data ?? []
        setTransfers(list)
      })
      .catch(() => setTransfers([]))
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
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
            Historique des Transactions
          </h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Registre des transferts enregistrés sur la blockchain ChainCacao.
          </p>
        </div>
        {isAdmin && transfers.length > 0 && (
          <button
            onClick={() => {
              const rows = transfers.map(t => {
                const from = t.from_actor_id || t.from_actor || t.sender || ''
                const to = t.to_actor_id || t.to_actor || t.receiver || ''
                return `${t.tx_hash || t.id || ''},${from},${to},${t.created_at || t.date || ''}`
              })
              const csv = ['hash,expediteur,destinataire,date', ...rows].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'transactions.csv'; a.click()
              URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Exporter CSV
          </button>
        )}
      </header>

      {!isAdmin && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 font-medium">
          Les statistiques globales de transactions sont réservées à l&apos;administrateur.
          Vous pouvez consulter l&apos;historique d&apos;un lot spécifique via la page{' '}
          <a href="/lots" className="underline font-bold">Gestion des lots</a>.
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] overflow-hidden">
        {transfers.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <ArrowsRightLeftIcon className="w-16 h-16 text-gray-200" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              {isAdmin ? 'Aucune transaction enregistrée' : 'Aucune transaction disponible pour votre rôle'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hash / Date</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Expéditeur</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Destinataire</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lot</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transfers.map((tx, idx) => (
                  <tr key={tx.id ?? idx} className="group hover:bg-gray-50 transition-all">
                    <td className="py-5">
                      <p className="text-xs font-mono font-bold text-gray-400 mb-1">{shortHash(tx.tx_hash || tx.id)}</p>
                      <p className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-tight">
                        {formatDate(tx.created_at || tx.date)}
                      </p>
                    </td>
                    <td className="py-5 text-sm font-bold text-[var(--color-primary)]">
                      {tx.from_actor_id || tx.from_actor || tx.sender || '—'}
                    </td>
                    <td className="py-5 text-sm font-bold text-[var(--color-primary)]">
                      {tx.to_actor_id || tx.to_actor || tx.receiver || '—'}
                    </td>
                    <td className="py-5 text-sm text-gray-500">
                      {tx.batch_id || tx.lot_id || tx.id || '—'}
                    </td>
                    <td className="py-5 text-right">
                      <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[#F1F8E9] text-[#33691E]">
                        {tx.type || tx.status || 'TRANSFERT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
