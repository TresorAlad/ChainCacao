'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function SyncPage() {
  const [batchId, setBatchId] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  const handleSync = async () => {
    try {
      await api.post('/sync', {
        batch_id: batchId,
        actor_id: user?.actor_id,
      })
      toast.success('Synchronisation demandée')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-h1 mb-6">Synchroniser avec le ledger</h1>
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-label mb-1">ID du lot</label>
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="px-3 py-2 border rounded w-full"
          />
        </div>
        <button onClick={handleSync} className="btn-primary">
          Sync
        </button>
      </div>
    </div>
  )
}
