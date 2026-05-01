'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function NouveauLotPage() {
  const [formData, setFormData] = useState({
    id: '',
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
    proprietaire_id: '',
    org_id: '',
    eudr_conforme: false,
    notes: '',
  })
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      quantite: parseFloat(formData.quantite),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    }
    try {
      await api.post('/lot', payload)
      toast.success('Lot créé avec succès')
      router.push('/lots')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-h1 mb-6">Nouveau lot</h1>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          ID du lot
          <input type="text" name="id" value={formData.id} onChange={handleChange} required />
        </label>
        <label>
          Culture
          <input type="text" name="culture" value={formData.culture} onChange={handleChange} required />
        </label>
        <label>
          Variété
          <input type="text" name="variete" value={formData.variete} onChange={handleChange} required />
        </label>
        <label>
          Quantité (kg)
          <input type="number" step="0.01" name="quantite" value={formData.quantite} onChange={handleChange} required />
        </label>
        <label>
          Lieu
          <input type="text" name="lieu" value={formData.lieu} onChange={handleChange} required />
        </label>
        <label>
          Latitude
          <input type="number" step="0.000001" name="latitude" value={formData.latitude} onChange={handleChange} required />
        </label>
        <label>
          Longitude
          <input type="number" step="0.000001" name="longitude" value={formData.longitude} onChange={handleChange} required />
        </label>
        <label>
          Région
          <input type="text" name="region" value={formData.region} onChange={handleChange} required />
        </label>
        <label>
          Village
          <input type="text" name="village" value={formData.village} onChange={handleChange} required />
        </label>
        <label>
          Parcelle
          <input type="text" name="parcelle" value={formData.parcelle} onChange={handleChange} required />
        </label>
        <label>
          Date de récolte
          <input type="date" name="date_recolte" value={formData.date_recolte} onChange={handleChange} required />
        </label>
        <label>
          Propriétaire ID
          <input type="text" name="proprietaire_id" value={formData.proprietaire_id} onChange={handleChange} required />
        </label>
        <label>
          Org ID
          <input type="text" name="org_id" value={formData.org_id} onChange={handleChange} required />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="eudr_conforme"
            checked={formData.eudr_conforme}
            onChange={handleChange}
            className="h-4 w-4"
          />
          Conforme EUDR
        </label>
        <label>
          Notes
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Créer le lot
          </button>
          <button type="button" className="btn-outline" onClick={() => router.push('/lots')}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
