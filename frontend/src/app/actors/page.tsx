'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import api, { ActorDTO } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ActorsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [actors, setActors] = useState<ActorDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    api
      .get<{ success: boolean; actors: ActorDTO[] }>('/actors')
      .then((res) => {
        setActors(res.data.actors || [])
        setLoading(false)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erreur'
        toast.error(message)
        setLoading(false)
      })
  }, [isAuthenticated])

  if (authLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-6">Acteurs enregistrés</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {actors.map((actor) => (
          <div key={actor.id} className="card">
            <h3 className="text-lg font-semibold mb-2">{actor.nom}</h3>
            <p className="text-sm">
              <strong>ID :</strong> {actor.id}
            </p>
            <p className="text-sm">
              <strong>Email :</strong> {actor.email || '—'}
            </p>
            <p className="text-sm">
              <strong>Rôle :</strong> {actor.role || '—'}
            </p>
            <p className="text-sm">
              <strong>Organisation :</strong> {actor.org_id || '—'}
            </p>
          </div>
        ))}
      </div>
      {actors.length === 0 && <p className="text-[var(--color-muted)] mt-4">Aucun acteur trouvé.</p>}
    </div>
  )
}
