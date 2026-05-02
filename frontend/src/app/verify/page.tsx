'use client'

import { useState } from 'react'
import { getApiBaseUrl } from '@/lib/api-base'
import type { Batch, BatchHistoryEvent } from '@/lib/api'
import toast from 'react-hot-toast'

interface VerifyResponse {
  success: boolean
  lot: Batch
  origin: {
    actor_id?: string
    actor_nom?: string
    region?: string
    village?: string
    parcelle?: string
    latitude?: number
    longitude?: number
    photo_url?: string
  }
  owner: {
    actor_id?: string
    actor_nom?: string
    org_id?: string
  }
  timeline: BatchHistoryEvent[]
  eudr_conforme: boolean
  blockchain_txhash?: string
  verified_at_utc?: string
}

export default function VerifyPage() {
  const [batchId, setBatchId] = useState('')
  const [result, setResult] = useState<VerifyResponse | null>(null)

  const handleVerify = async () => {
    const id = batchId.trim()
    if (!id) {
      toast.error('Saisissez un ID de lot')
      return
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/verify/${encodeURIComponent(id)}`)
      const data = (await res.json().catch(() => null)) as VerifyResponse | null
      if (!res.ok) {
        const msg =
          data && typeof data === 'object' && 'error' in data && typeof (data as { error?: string }).error === 'string'
            ? (data as { error: string }).error
            : 'Lot introuvable'
        throw new Error(msg)
      }
      if (data && typeof data === 'object') setResult(data)
      else throw new Error('Réponse invalide')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lot introuvable'
      toast.error(message)
      setResult(null)
    }
  }

  return (
    <div className="page-container max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">
        Vérification publique d’un lot
      </h1>
      <p className="text-[var(--color-muted)] mb-8">
        Consultez les informations exposées par l’API pour ce lot (sans compte).
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          placeholder="ID du lot"
          className="form-input flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
        />
        <button type="button" onClick={handleVerify} className="btn btn-primary shrink-0">
          Vérifier
        </button>
      </div>

      {result?.success && result.lot && (
        <div className="card border border-[var(--color-border)]">
          <div className="card-body space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">Lot {result.lot.id}</h2>
              <p className="text-[var(--color-muted)]">
                <strong>Culture :</strong> {result.lot.culture} {result.lot.variete ? `— ${result.lot.variete}` : ''}
              </p>
              <p className="text-[var(--color-muted)]">
                <strong>Quantité :</strong> {result.lot.quantite} kg — <strong>Statut :</strong>{' '}
                {result.lot.statut || '—'}
              </p>
              <p className="text-[var(--color-muted)]">
                <strong>EUDR :</strong> {result.eudr_conforme ? 'Conforme' : 'Non conforme'}
              </p>
              {result.blockchain_txhash && (
                <p className="text-caption font-mono mt-2 break-all">
                  Dernier tx : {result.blockchain_txhash}
                </p>
              )}
              {result.verified_at_utc && (
                <p className="text-caption mt-1">Vérifié le {new Date(result.verified_at_utc).toLocaleString('fr-FR')}</p>
              )}
            </div>

            {(result.origin.actor_nom || result.origin.region) && (
              <div className="border-t border-[var(--color-border)] pt-4">
                <h3 className="font-semibold text-[var(--color-earth)] mb-2">Origine</h3>
                <ul className="text-sm text-[var(--color-muted)] space-y-1">
                  {result.origin.actor_nom && <li>Producteur : {result.origin.actor_nom}</li>}
                  <li>
                    {[result.origin.region, result.origin.village].filter(Boolean).join(' — ') || '—'}
                  </li>
                  {result.origin.parcelle && <li>Parcelle : {result.origin.parcelle}</li>}
                </ul>
              </div>
            )}

            {result.owner.actor_id && (
              <div className="border-t border-[var(--color-border)] pt-4">
                <h3 className="font-semibold text-[var(--color-earth)] mb-2">Propriétaire actuel</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  {result.owner.actor_nom || result.owner.actor_id} ({result.owner.org_id || '—'})
                </p>
              </div>
            )}

            {result.timeline?.length > 0 && (
              <div className="border-t border-[var(--color-border)] pt-4">
                <h3 className="font-semibold text-[var(--color-earth)] mb-2">
                  Chronologie ({result.timeline.length} événement{result.timeline.length > 1 ? 's' : ''})
                </h3>
                <ul className="space-y-2 text-sm">
                  {result.timeline.slice(-8).map((ev, i) => (
                    <li key={i} className="flex justify-between gap-4 border-b border-[var(--color-border)]/50 pb-2">
                      <span>
                        <strong className="text-[var(--color-primary)]">{ev.type}</strong>
                        {ev.actor_id && <span className="text-[var(--color-muted)]"> — {ev.actor_id}</span>}
                      </span>
                      <span className="text-caption whitespace-nowrap">
                        {new Date(ev.created_at).toLocaleString('fr-FR')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
