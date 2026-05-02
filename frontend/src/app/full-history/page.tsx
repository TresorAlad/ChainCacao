'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import api, { BatchHistoryEvent } from '@/lib/api'
import toast from 'react-hot-toast'

export default function FullHistoryPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [batchId, setBatchId] = useState('')
  const [history, setHistory] = useState<BatchHistoryEvent[]>([])

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const loadHistory = async () => {
    const id = batchId.trim()
    if (!id) {
      toast.error('Saisissez un ID de lot')
      return
    }
    try {
      const res = await api.get<{ success: boolean; events: BatchHistoryEvent[] }>(
        `/lot/${encodeURIComponent(id)}/history`
      )
      setHistory(res.data.events || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur'
      toast.error(message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="page-container py-6 sm:py-8">
      <h1 className="text-h1 mb-6">Historique complet d’un lot</h1>
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-label mb-1">ID du lot</label>
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="form-input w-full"
          />
        </div>
        <button type="button" onClick={loadHistory} className="btn btn-primary">
          Charger historique
        </button>
      </div>

      <div className="space-y-3">
        {history.map((ev, idx) => (
          <div key={idx} className="list-item">
            <div>
              <strong>{ev.type}</strong> – {ev.actor_id || 'système'}
              {ev.commentaire && <p className="caption">{ev.commentaire}</p>}
              {ev.from_actor_id && (
                <p className="caption">
                  De {ev.from_actor_id} → {ev.to_actor_id}
                </p>
              )}
              <p className="caption">
                Quantité: {ev.payload.quantite} kg – Statut: {ev.payload.statut ?? '—'}
              </p>
            </div>
            <div className="text-right">
              <span className="badge btn-blockchain">
                Tx: {ev.tx_hash?.slice(0, 8)}...
              </span>
              <small className="block">
                {new Date(ev.created_at).toLocaleString('fr-FR')}
              </small>
            </div>
          </div>
        ))}
      </div>
      {history.length === 0 && batchId.trim() !== '' && (
        <p className="caption mt-4 text-[var(--color-muted)]">Aucun historique trouvé pour ce lot.</p>
      )}
    </div>
  )
}
