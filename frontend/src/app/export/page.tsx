'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function ExportPage() {
  const [batchId, setBatchId] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const actorId = user?.actor_id || 'unknown'
    try {
      await api.post(`/lot/${batchId}/export`, { actor_id: actorId })
      toast.success('Lot marqué exporté')
      router.push('/lots')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-h1 mb-6">Marquer un lot comme exporté</h1>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          ID du lot
          <input type="text" value={batchId} onChange={(e) => setBatchId(e.target.value)} required />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Exporter
          </button>
          <button type="button" className="btn-outline" onClick={() => router.push('/lots')}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
