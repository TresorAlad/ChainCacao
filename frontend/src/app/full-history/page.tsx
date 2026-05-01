'use client'

import { useState } from 'react'
import api, { BatchHistoryEvent } from '@/lib/api'
import toast from 'react-hot-toast'

export default function FullHistoryPage() {
  const [batchId, setBatchId] = useState('')
  const [history, setHistory] = useState<BatchHistoryEvent[]>([])

  const loadHistory = async () => {
    try {
      const res = await api.get<BatchHistoryEvent[]>(`/lot/${batchId}/history`)
      setHistory(res.data)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-h1 mb-6">Historique complet d’un lot</h1>
      <div className="flex gap-4 items-end mb-6">
        <div className="flex-1">
          <label className="block text-label mb-1">ID du lot</label>
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="px-3 py-2 border rounded w-full"
          />
        </div>
        <button onClick={loadHistory} className="btn-primary">
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
                Quantité: {ev.payload.Quantite} kg – Statut: {ev.payload.Statut}
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
      {history.length === 0 && batchId && <p className="caption mt-4">Aucun historique trouvé.</p>}
    </div>
  )
}
