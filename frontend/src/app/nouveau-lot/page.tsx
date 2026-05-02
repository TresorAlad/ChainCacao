'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function NouveauLotPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  const [formData, setFormData] = useState({
    culture: '',
    variete: '',
    quantite: '',
    lieu: '',
    latitude: '',
    longitude: '',
    region: '',
    village: '',
    parcelle: '',
    date_recolte: '',
    certificat_url: '',
    photo_url: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const payload = {
      culture: formData.culture,
      variete: formData.variete,
      quantite: parseFloat(formData.quantite),
      lieu: formData.lieu,
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
      region: formData.region,
      village: formData.village,
      parcelle: formData.parcelle,
      date_recolte: formData.date_recolte,
      certificat_url: formData.certificat_url,
      photo_url: formData.photo_url,
      notes: formData.notes,
    }
    try {
      const res = await api.post<{ success: boolean; batch: { id: string } }>('/lot', payload)
      toast.success(`Lot créé avec succès${res.data.batch?.id ? ` (ID: ${res.data.batch.id})` : ''}`)
      router.push('/lots')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création du lot')
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
          Nouveau lot
        </h1>
        <p className="text-[var(--color-muted)] mt-2">
          Enregistrer un nouveau lot de cacao sur la blockchain
        </p>
      </header>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Culture *</label>
              <input
                type="text"
                name="culture"
                className="form-input"
                placeholder="Culture"
                value={formData.culture}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Variété *</label>
              <input
                type="text"
                name="variete"
                className="form-input"
                placeholder="Variété"
                value={formData.variete}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quantité (kg) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="quantite"
                className="form-input"
                placeholder="Quantité en kg"
                value={formData.quantite}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lieu *</label>
              <input
                type="text"
                name="lieu"
                className="form-input"
                placeholder="Nom du lieu / exploitation"
                value={formData.lieu}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input
                type="number"
                step="0.000001"
                name="latitude"
                className="form-input"
                placeholder="Latitude (décimal)"
                value={formData.latitude}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input
                type="number"
                step="0.000001"
                name="longitude"
                className="form-input"
                placeholder="Longitude (décimal)"
                value={formData.longitude}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Région *</label>
              <input
                type="text"
                name="region"
                className="form-input"
                placeholder="Région"
                value={formData.region}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Village *</label>
              <input
                type="text"
                name="village"
                className="form-input"
                placeholder="Village ou commune"
                value={formData.village}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Parcelle *</label>
              <input
                type="text"
                name="parcelle"
                className="form-input"
                placeholder="Référence parcelle"
                value={formData.parcelle}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date de récolte *</label>
              <input
                type="date"
                name="date_recolte"
                className="form-input"
                value={formData.date_recolte}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">URL Certificat (optionnel)</label>
              <input
                type="url"
                name="certificat_url"
                className="form-input"
                placeholder="https://..."
                value={formData.certificat_url}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">URL Photo (optionnel)</label>
              <input
                type="url"
                name="photo_url"
                className="form-input"
                placeholder="https://..."
                value={formData.photo_url}
                onChange={handleChange}
              />
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Notes (optionnel)</label>
              <textarea
                name="notes"
                className="form-input"
                rows={3}
                placeholder="Informations complémentaires..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2 flex gap-4 pt-2">
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Création...</>
                ) : (
                  'Créer le lot'
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => router.push('/lots')}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
