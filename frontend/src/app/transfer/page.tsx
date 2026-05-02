'use client'

import { Suspense, useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRightIcon, ShieldCheckIcon } from 'lucide-react'
import api, { ActorDTO } from '@/lib/api'
import toast from 'react-hot-toast'

function TransferContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading } = useAuth()
  const [formData, setFormData] = useState({
    batch_id: '',
    to_actor_id: '',
    commentaire: ''
  })
  const [actors, setActors] = useState<ActorDTO[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    const lot = searchParams.get('lot')
    if (lot) {
      setFormData((prev) => ({ ...prev, batch_id: lot.trim() }))
    }
  }, [searchParams])

  useEffect(() => {
    if (isAuthenticated) {
      api
        .get<{ success: boolean; actors: ActorDTO[] }>('/actors')
        .then((res) => setActors(res.data.actors || []))
        .catch(() => setActors([]))
    }
  }, [isAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post('/transfer', {
        batch_id: formData.batch_id,
        to_actor_id: formData.to_actor_id,
        commentaire: formData.commentaire,
      })
      toast.success('Transfert effectué avec succès')
      router.push('/lots')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du transfert'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">
          Transfert de propriété
        </h1>
        <p className="text-[var(--color-muted)] mt-2">
          Transférez un lot à un autre acteur de la chaîne
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card group">
          <div className="card-header border-b border-[var(--color-border)]/50">
            <h2 className="card-title flex items-center gap-2">
              <ArrowRightIcon className="w-5 h-5 text-[var(--color-primary)]" />
              Détails du transfert
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-group">
              <label className="form-label">ID du lot à transférer</label>
              <input
                type="text"
                className="form-input"
                placeholder="Identifiant du lot"
                value={formData.batch_id}
                onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Acteur destinataire</label>
              {actors.length > 0 ? (
                <select
                  className="form-input"
                  value={formData.to_actor_id}
                  onChange={(e) => setFormData({ ...formData, to_actor_id: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un acteur</option>
                  {actors.map((actor) => (
                    <option key={actor.id} value={actor.id}>
                      {actor.nom} ({actor.role || '—'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Identifiant acteur destinataire"
                  value={formData.to_actor_id}
                  onChange={(e) => setFormData({ ...formData, to_actor_id: e.target.value })}
                  required
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Commentaire (optionnel)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Notes sur ce transfert..."
                value={formData.commentaire}
                onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              />
            </div>

            <div className="pt-4">
              <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> En cours...</>
                ) : (
                  <>Initier le transfert</>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card group">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-primary)]">Traçabilité sécurisée</p>
                  <p className="text-body-sm text-[var(--color-muted)]">Chaque transfert est immuable</p>
                </div>
              </div>
              <p className="text-body-sm text-[var(--color-muted)] leading-relaxed">
                Les transferts sont enregistrés sur la blockchain. Une fois validé, le changement de propriétaire est définitif et vérifiable par tous les acteurs de la chaîne.
              </p>
            </div>
          </div>

          <div className="card group">
            <div className="card-body">
              <h3 className="font-semibold text-[var(--color-primary)] mb-3">Étapes du processus</h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold flex items-center justify-center">1</span>
                  <span className="text-body-sm text-[var(--color-earth)]">Validation de la disponibilité</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold flex items-center justify-center">2</span>
                  <span className="text-body-sm text-[var(--color-earth)]">Signature numérique</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold flex items-center justify-center">3</span>
                  <span className="text-body-sm text-[var(--color-earth)]">Enregistrement blockchain</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold flex items-center justify-center">4</span>
                  <span className="text-body-sm text-[var(--color-earth)]">Mise à jour du registre</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TransferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
        </div>
      }
    >
      <TransferContent />
    </Suspense>
  )
}
