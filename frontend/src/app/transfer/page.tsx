'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { PackageIcon, ArrowRightIcon, UsersIcon, ShieldCheckIcon } from 'lucide-react'

export default function TransferPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [formData, setFormData] = useState({
    lotId: '',
    toActorId: '',
    quantity: '',
    comment: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/v1/transfer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        router.push('/lots')
      } else {
        throw new Error('Erreur lors du transfert')
      }
    } catch (err: any) {
      alert(err.message)
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

  const mockLots = [
    { id: 'LOT-2024-0892', type: 'Cacao Forastero', quantity: '2,500 kg' },
    { id: 'LOT-2024-0891', type: 'Cacao Criollo', quantity: '1,800 kg' },
    { id: 'LOT-2024-0890', type: 'Cacao Trinitario', quantity: '3,200 kg' },
  ]

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
        {/* Formulaire */}
        <div className="card group">
          <div className="card-header border-b border-[var(--color-border)]/50">
            <h2 className="card-title flex items-center gap-2">
              <ArrowRightIcon className="w-5 h-5 text-[var(--color-primary)]" />
              Détails du transfert
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-group">
              <label className="form-label">Lot concerné</label>
              <select 
                className="form-input"
                value={formData.lotId}
                onChange={(e) => setFormData({...formData, lotId: e.target.value})}
                required
              >
                <option value="">Sélectionner un lot</option>
                {mockLots.map(lot => (
                  <option key={lot.id} value={lot.id}>{lot.id} - {lot.type} ({lot.quantity})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ID de l'acteur destinataire</label>
              <input
                type="text"
                className="form-input"
                placeholder="ex: actor-coop-002"
                value={formData.toActorId}
                onChange={(e) => setFormData({...formData, toActorId: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Quantité à transférer</label>
              <input
                type="text"
                className="form-input"
                placeholder="ex: 500 kg"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Commentaire (optionnel)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Notes sur ce transfert..."
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
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

        {/* Info contextuelle */}
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