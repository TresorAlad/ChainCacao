'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { WeightIcon, PackageIcon, TrendingUpIcon } from 'lucide-react'

export default function UpdateWeightPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [formData, setFormData] = useState({
    lotId: '',
    newWeight: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/lot/${formData.lotId}/weight`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({ newWeight: formData.newWeight })
      })
      if (res.ok) {
        alert('Poids mis à jour avec succès')
        setFormData({ lotId: '', newWeight: '' })
        router.push('/lots')
      } else {
        throw new Error('Erreur lors de la mise à jour')
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
    { id: 'LOT-2024-0892', type: 'Cacao Forastero', currentWeight: '2,500 kg' },
    { id: 'LOT-2024-0891', type: 'Cacao Criollo', currentWeight: '1,800 kg' },
    { id: 'LOT-2024-0890', type: 'Cacao Trinitario', currentWeight: '3,200 kg' },
  ]

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
        {/* Formulaire */}
        <div className="card group">
          <div className="card-header border-b border-[var(--color-border)]/50">
            <h2 className="card-title flex items-center gap-2">
              <WeightIcon className="w-5 h-5 text-[var(--color-primary)]" />
              Nouveau poids
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-group">
              <label className="form-label">Lot concerné</label>
              <select 
                className="form-input"
                value={formData.lotId}
                onChange={(e) => {
                  setFormData({...formData, lotId: e.target.value})
                  const lot = mockLots.find(l => l.id === e.target.value)
                  if (lot) {
                    const currentWeight = lot.currentWeight.replace(/[^0-9]/g, '')
                    setFormData(prev => ({...prev, newWeight: currentWeight}))
                  }
                }}
                required
              >
                <option value="">Sélectionner un lot</option>
                {mockLots.map(lot => (
                  <option key={lot.id} value={lot.id}>{lot.id} - {lot.type} ({lot.currentWeight})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nouveau poids (kg)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="ex: 2450"
                value={formData.newWeight}
                onChange={(e) => setFormData({...formData, newWeight: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Justification (optionnel)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="perte, ajustement, humidité..."
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

        {/* Historique des poids */}
        <div className="card group">
          <div className="card-header border-b border-[var(--color-border)]/50">
            <h2 className="card-title flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5 text-[var(--color-primary)]" />
              Évolution du Lot-2024-0892
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)]/50">
                <span className="text-body-sm text-[var(--color-muted)]">25 Mars 2026</span>
                <span className="font-bold text-[var(--color-earth)]">2,500 kg</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)]/50">
                <span className="text-body-sm text-[var(--color-muted)]">28 Mars 2026</span>
                <span className="font-bold text-[var(--color-danger)]">2,450 kg</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)]/50">
                <span className="text-body-sm text-[var(--color-muted)]">01 Avril 2026</span>
                <span className="font-bold text-[var(--color-warning)]">2,400 kg</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-[var(--color-accent)]/10">
              <div className="flex items-center gap-2 text-[var(--color-accent)] mb-1">
                <TrendingUpIcon className="w-4 h-4" />
                <span className="font-semibold text-[var(--color-earth)]">Tendance</span>
              </div>
              <p className="text-body-sm text-[var(--color-earth)]">
                Perte moyenne : <span className="font-medium">1.7%</span> par semaine
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}