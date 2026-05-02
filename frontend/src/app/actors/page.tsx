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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'agriculteur':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cooperative':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'exportateur':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'transformateur':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header animate-fade-in flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">
            Acteurs
          </h1>
          <p className="text-[var(--color-muted)] mt-2">
            Gérez les intervenants enregistrés sur la filière cacao.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary-outline bg-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filtrer
          </button>
          <button className="btn btn-secondary flex items-center gap-2 text-white shadow-sm hover:shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Ajouter acteur
          </button>
        </div>
      </header>

      {/* Actors Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-[var(--color-bg)] text-left">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Acteur</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Rôle</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Statut</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b text-right">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--color-border)]">
              {actors.map((actor) => (
                <tr key={actor.id} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold flex items-center justify-center border border-[var(--color-primary)]/20">
                          {getInitials(actor.nom || 'A')}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-[var(--color-primary)]">{actor.nom}</div>
                        <div className="text-xs text-[var(--color-muted)]">{actor.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-earth)] font-medium">
                    {actor.email || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeClass(actor.role)}`}>
                      {actor.role?.toUpperCase() || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      ACTIF
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] font-semibold transition-colors">
                      Éditer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {actors.length === 0 && (
            <div className="p-8 text-center text-[var(--color-muted)]">
              Aucun acteur trouvé.
            </div>
          )}
        </div>
        
        {/* Pagination mock */}
        {actors.length > 0 && (
          <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between bg-white">
            <span className="text-sm text-[var(--color-muted)]">
              Affichage de 1 à {actors.length} sur {actors.length} acteurs
            </span>
            <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-bg)]">&lt;</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-secondary)] text-white font-medium">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-earth)] hover:bg-[var(--color-bg)]">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-earth)] hover:bg-[var(--color-bg)]">3</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-bg)]">&gt;</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
