'use client'

import { Suspense, useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { WeightIcon, TrendingUpIcon } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

function UpdateWeightContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading } = useAuth()
  const [formData, setFormData] = useState({
    lotId: '',
    newWeight: '',
    justification: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    const lotFromUrl = searchParams.get('lot')
    if (lotFromUrl) {
      setFormData((prev) => ({ ...prev, lotId: lotFromUrl }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.put(`/lot/${formData.lotId}/weight`, {
        new_weight: parseFloat(formData.newWeight),
        justification: formData.justification,
      })
      toast.success('Poids mis à jour avec succès')
      setFormData({ lotId: '', newWeight: '', justification: '' })
      router.push('/lots')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
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
          Mise à jour du poids
        </h1>
        <p className="text-[var(--color-muted)] mt-2">
          Ajustez le poids d'un lot suite à une perte ou un ajout
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card group">
          <div className="card-header border-b border-[var(--color-border)]/50">
            <h2 className="card-title flex items-center gap-2">
              <WeightIcon className="w-5 h-5 text-[var(--color-primary)]" />
              Nouveau poids
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-group">
              <label className="form-label">ID du lot concerné</label>
              <input
                type="text"
                className="form-input"
                placeholder="Identifiant du lot"
                value={formData.lotId}
                onChange={(e) => setFormData({ ...formData, lotId: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nouveau poids (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="Poids en kg"
                value={formData.newWeight}
                onChange={(e) => setFormData({ ...formData, newWeight: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Justification (optionnel)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="perte, ajustement, humidité..."
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              />
            </div>

            <div className="pt-4">
              <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Mise à jour...</>
                ) : (
                  <>Enregistrer le poids</>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="card group">
          <div className="card-header border-b border-[var(--color-border)]/50">
            <h2 className="card-title flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5 text-[var(--color-primary)]" />
              Informations
            </h2>
          </div>
          <div className="card-body">
            <p className="text-body-sm text-[var(--color-muted)] leading-relaxed mb-4">
              La mise à jour du poids est enregistrée de façon immuable sur la blockchain. Assurez-vous d'entrer la valeur correcte en kilogrammes avant de valider.
            </p>
            <div className="p-3 rounded-lg bg-[var(--color-accent)]/10">
              <div className="flex items-center gap-2 text-[var(--color-accent)] mb-1">
                <TrendingUpIcon className="w-4 h-4" />
                <span className="font-semibold text-[var(--color-earth)]">Conseil</span>
              </div>
              <p className="text-body-sm text-[var(--color-earth)]">
                Précisez la raison de l'ajustement dans le champ justification pour une meilleure traçabilité.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UpdateWeightPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
        </div>
      }
    >
      <UpdateWeightContent />
    </Suspense>
  )
}
