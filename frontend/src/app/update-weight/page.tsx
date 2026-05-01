'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function UpdateWeightPage() {
  const [batchId, setBatchId] = useState('')
  const [newWeight, setNewWeight] = useState('')
  const [justification, setJustification] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const actorId = user?.actor_id || 'unknown'
    try {
      await api.put(`/lot/${batchId}/weight`, {
        actor_id: actorId,
        new_weight: parseFloat(newWeight),
        justification,
      })
      toast.success('Poids mis à jour')
      router.push('/lots')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-h1 mb-6">Mettre à jour le poids</h1>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          ID du lot
          <input type="text" value={batchId} onChange={(e) => setBatchId(e.target.value)} required />
        </label>
        <label>
          Nouveau poids (kg)
          <input type="number" step="0.01" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} required />
        </label>
        <label>
          Justification
          <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={3} required />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Mettre à jour
          </button>
          <button type="button" className="btn-outline" onClick={() => router.push('/lots')}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
