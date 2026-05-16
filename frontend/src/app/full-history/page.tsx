'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import api, { BatchHistoryEvent } from '@/lib/api'
import { historyActorSummary, historyEventLabel } from '@/lib/lot-workflow'
import toast from 'react-hot-toast'
import Link from 'next/link'

function FullHistoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading } = useAuth()
  const [batchId, setBatchId] = useState('')
  const [history, setHistory] = useState<BatchHistoryEvent[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    const id = searchParams.get('lot')?.trim()
    if (id) setBatchId(id)
  }, [searchParams])

  const loadHistory = useCallback(async (idOverride?: string) => {
    const id = (idOverride ?? batchId).trim()
    if (!id) {
      toast.error('Saisissez un ID de lot')
      return
    }
    setLoadingHistory(true)
    try {
      const res = await api.get<{ success: boolean; events: BatchHistoryEvent[] }>(
        `/lot/${encodeURIComponent(id)}/history`
      )
      setHistory(res.data.events || [])
      if (!idOverride) setBatchId(id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur'
      toast.error(message)
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }, [batchId])

  useEffect(() => {
    const id = searchParams.get('lot')?.trim()
    if (id && isAuthenticated && !loading) {
      void loadHistory(id)
    }
  }, [searchParams, isAuthenticated, loading, loadHistory])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const eventIconClass = (type?: string) => {
    const t = String(type ?? '').toLowerCase()
    if (t === 'transfert') return 'bg-blue-100 text-blue-700'
    if (t === 'reception') return 'bg-amber-100 text-amber-800'
    if (t === 'creation') return 'bg-green-100 text-green-700'
    if (t === 'paiement' || t === 'paiement_liste') return 'bg-emerald-100 text-emerald-800'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="page-container py-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">Historique complet d&apos;un lot</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Transferts, réceptions confirmées, paiements — tels qu&apos;enregistrés sur la chaîne.
          </p>
        </div>
        {batchId ? (
          <Link href={`/lot-detail?id=${encodeURIComponent(batchId)}`} className="btn btn-secondary btn-sm">
            Retour au détail du lot
          </Link>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-label mb-1">ID du lot</label>
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void loadHistory()}
            className="form-input w-full"
            placeholder="Ex. TC-20260502-00001"
          />
        </div>
        <button
          type="button"
          onClick={() => void loadHistory()}
          disabled={loadingHistory}
          className="btn btn-primary disabled:opacity-50"
        >
          {loadingHistory ? 'Chargement…' : 'Charger historique'}
        </button>
      </div>

      <div className="space-y-3">
        {history.map((ev, idx) => (
          <div
            key={`${ev.tx_hash ?? ''}-${idx}`}
            className="list-item flex flex-wrap gap-4 justify-between"
          >
            <div className="flex gap-3 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${eventIconClass(ev.type)}`}
              >
                {String(ev.type ?? '').toLowerCase() === 'transfert'
                  ? '→'
                  : String(ev.type ?? '').toLowerCase() === 'reception'
                    ? '✓'
                    : '·'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[var(--color-primary)]">{historyEventLabel(ev.type)}</p>
                <p className="text-sm text-[var(--color-earth)] mt-0.5">{historyActorSummary(ev)}</p>
                {ev.commentaire ? (
                  <p className="caption mt-1 text-[var(--color-muted)]">{ev.commentaire}</p>
                ) : null}
                {ev.payload?.quantite != null || ev.payload?.statut ? (
                  <p className="caption mt-1">
                    {ev.payload?.quantite != null ? `${ev.payload.quantite} kg` : null}
                    {ev.payload?.quantite != null && ev.payload?.statut ? ' · ' : null}
                    {ev.payload?.statut ? `statut : ${ev.payload.statut}` : null}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="badge btn-blockchain">Tx: {ev.tx_hash?.slice(0, 10) ?? '—'}…</span>
              <small className="block text-[var(--color-muted)] mt-1">
                {ev.created_at ? new Date(ev.created_at).toLocaleString('fr-FR') : '—'}
              </small>
            </div>
          </div>
        ))}
      </div>

      {!loadingHistory && history.length === 0 && batchId.trim() !== '' && (
        <p className="caption mt-4 text-[var(--color-muted)]">Aucun événement pour ce lot.</p>
      )}
    </div>
  )
}

export default function FullHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      }
    >
      <FullHistoryContent />
    </Suspense>
  )
}
