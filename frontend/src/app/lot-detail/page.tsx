'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api, { Batch, BatchHistoryEvent } from '@/lib/api'
import Spinner from '@/components/Spinner'
import toast from 'react-hot-toast'

function LotDetailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const batchId = searchParams.get('id')
  const [batch, setBatch] = useState<Batch | null>(null)
  const [history, setHistory] = useState<BatchHistoryEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!batchId) {
      router.push('/lots')
      return
    }
    Promise.all([
      api.get<Batch>(`/lot/${batchId}`),
      api.get<BatchHistoryEvent[]>(`/lot/${batchId}/history`),
    ])
      .then(([batchRes, histRes]) => {
        setBatch(batchRes.data)
        setHistory(histRes.data)
        setLoading(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setLoading(false)
      })
  }, [batchId, router])

  if (loading) return <Spinner />
  if (!batch) return <p>Lot introuvable</p>

  return (
    <div>
      <h1 className="text-h1 mb-6">
        Détail du lot <span className="text-cacao">{batch.id}</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <p><strong>Culture:</strong> {batch.culture}</p>
        <p><strong>Variété:</strong> {batch.variete}</p>
        <p><strong>Quantité:</strong> {batch.Quantite} kg</p>
        <p><strong>Lieu:</strong> {batch.lieu}</p>
        <p><strong>Coordonnées:</strong> {batch.latitude}, {batch.longitude}</p>
        <p><strong>Région:</strong> {batch.region}</p>
        <p><strong>Village:</strong> {batch.village}</p>
        <p><strong>Parcelle:</strong> {batch.parcelle}</p>
        <p><strong>Date récolte:</strong> {batch.date_recolte}</p>
        <p><strong>Propriétaire:</strong> {batch.proprietaire_id}</p>
        <p><strong>Organisation:</strong> {batch.org_id}</p>
        <p><strong>Statut:</strong> {batch.Statut || 'créé'}</p>
        <p>
          <strong>EUDR conforme:</strong>{' '}
          <span className={batch.EUDRConforme ? 'badge badge-conforme' : 'badge badge-non-conforme'}>
            {batch.EUDRConforme ? 'Oui' : 'Non'}
          </span>
        </p>
        <p><strong>Timestamp:</strong> {new Date(batch.Timestamp).toLocaleString('fr-FR')}</p>
      </div>

      <h2 className="text-h2 mb-4">Historique blockchain</h2>
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
              <p className="caption">Poids: {ev.payload.Quantite} kg – Statut: {ev.payload.Statut}</p>
            </div>
            <div className="text-right">
              <span className="badge btn-blockchain">
                Tx: {ev.tx_hash?.slice(0, 8)}...
              </span>
              <small className="block">{new Date(ev.created_at).toLocaleString('fr-FR')}</small>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-outline mt-6" onClick={() => router.push('/lots')}>
        ← Retour à la liste
      </button>
    </div>
  )
}

export default function LotDetailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cacao"></div></div>}>
      <LotDetailContent />
    </Suspense>
  )
}
