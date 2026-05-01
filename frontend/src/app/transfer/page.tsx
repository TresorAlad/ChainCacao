'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function TransferPage() {
  const [batchId, setBatchId] = useState('')
  const [fromActorId, setFromActorId] = useState('')
  const [toActorId, setToActorId] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/transfer', {
        batch_id: batchId,
        from_actor_id: fromActorId,
        to_actor_id: toActorId,
        commentaire,
      })
      toast.success('Transfert effectué')
      router.push('/lots')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-h1 mb-6">Transférer un lot</h1>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          ID du lot
          <input type="text" value={batchId} onChange={(e) => setBatchId(e.target.value)} required />
        </label>
        <label>
          Propriétaire actuel (from)
          <input type="text" value={fromActorId} onChange={(e) => setFromActorId(e.target.value)} required />
        </label>
        <label>
          Nouveau propriétaire (to)
          <input type="text" value={toActorId} onChange={(e) => setToActorId(e.target.value)} required />
        </label>
        <label>
          Commentaire
          <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Transférer
          </button>
          <button type="button" className="btn-outline" onClick={() => router.push('/lots')}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
