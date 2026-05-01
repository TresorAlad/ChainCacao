'use client'

import { useState } from 'react'
import api from '@/lib/api'

export default function VerifyPage() {
  const [batchId, setBatchId] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleVerify = async () => {
    try {
      const res = await api.get(`/verify/${batchId}`)
      setResult(res.data)
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-h1 mb-6">Vérification publique d’un lot</h1>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          placeholder="ID du lot"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button onClick={handleVerify} className="btn-primary">
          Vérifier
        </button>
      </div>

      {result && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-h2 mb-4">Résultat</h2>
          <div className="space-y-2">
            <p><strong>Lot:</strong> {result.batch_id}</p>
            <p><strong>Statut:</strong> {result.status}</p>
            <p><strong>Validé EUDR:</strong> {result.eudr_valid ? 'Oui' : 'Non'}</p>
            <p><strong>Dernier événement:</strong> {result.last_event_type || '—'}</p>
            {result.verify_url && (
              <p>
                <strong>URL vérification:</strong>{' '}
                <a href={result.verify_url} target="_blank" rel="noreferrer" className="text-cacao">
                  {result.verify_url}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
