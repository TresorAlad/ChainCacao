'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Actor {
  actor_id: string
  name?: string
  email?: string
  role?: string
  org_id?: string
}

export default function ActorsPage() {
  const [actors, setActors] = useState<Actor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Actor[]>('/actors')
      .then((res) => {
        setActors(res.data)
        setLoading(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cacao"></div></div>

  return (
    <div>
      <h1 className="text-h1 mb-6">Acteurs enregistrés</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {actors.map((actor) => (
          <div key={actor.actor_id} className="card">
            <h3 className="text-lg font-semibold mb-2">{actor.name || actor.actor_id}</h3>
            <p className="text-sm"><strong>ID:</strong> {actor.actor_id}</p>
            <p className="text-sm"><strong>Email:</strong> {actor.email || '—'}</p>
            <p className="text-sm"><strong>Rôle:</strong> {actor.role || '—'}</p>
            <p className="text-sm"><strong>Organisation:</strong> {actor.org_id || '—'}</p>
          </div>
        ))}
      </div>
      {actors.length === 0 && <p className="caption mt-4">Aucun acteur trouvé.</p>}
    </div>
  )
}
