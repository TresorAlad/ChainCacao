'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/error-utils'
import { reverseGeocodeWebParsed } from '@/lib/geocode'
import { LocationMap } from '@/components/maps/LocationMapDynamic'
import { RoleGate } from '@/components/RoleGate'

type GeoStatus = 'idle' | 'loading' | 'ok' | 'denied' | 'unsupported'

const VARIETES_CACAO = ['Amelonado', 'Criollo', 'Trinitario', 'Forastero'] as const
const VARIETES_CAFE = ['Robustra', 'Arabica', 'Niaouli'] as const

export default function NouveauLotPage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()

  const [typeProduit, setTypeProduit] = useState<'Cacao' | 'Cafe'>('Cacao')
  const [variete, setVariete] = useState('')
  const [quantite, setQuantite] = useState('')
  const [dateRecolte, setDateRecolte] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [lieu, setLieu] = useState('')
  const [region, setRegion] = useState('')
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const refreshPosition = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoStatus('unsupported')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLatitude(lat)
        setLongitude(lng)
        setGeoStatus('ok')
        void reverseGeocodeWebParsed(lat, lng).then(({ lieu: adresse, region: reg }) => {
          setLieu(adresse)
          setRegion(reg)
        })
      },
      () => {
        setLatitude(null)
        setLongitude(null)
        setGeoStatus('denied')
        toast.error('Localisation refusée ou indisponible. Autorisez la position dans le navigateur.')
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    refreshPosition()
  }, [isAuthenticated, refreshPosition])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (latitude == null || longitude == null || geoStatus !== 'ok') {
      toast.error('Position GPS requise : acceptez la localisation ou actualisez la position.')
      return
    }
    const qty = parseFloat(quantite.replace(',', '.'))
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('Indiquez un poids valide (kg).')
      return
    }
    if (!variete.trim()) {
      toast.error('Choisissez une variété.')
      return
    }

    const culture = typeProduit === 'Cacao' ? 'Cacao' : 'Cafe'
    const payload = {
      culture,
      variete: variete.trim(),
      quantite: qty,
      lieu: lieu.trim() || `Position GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
      latitude,
      longitude,
      region: region.trim(),
      village: '',
      parcelle: '',
      date_recolte: dateRecolte,
      notes: notes.trim(),
    }

    setIsSubmitting(true)
    try {
      const res = await api.post<{ success: boolean; batch: { id: string } }>('/lot', payload)
      const newId = res.data.batch?.id
      if (newId && typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('chaincacao_my_lots') || '[]') as string[]
        if (!stored.includes(newId)) {
          stored.unshift(newId)
          localStorage.setItem('chaincacao_my_lots', JSON.stringify(stored.slice(0, 50)))
        }
      }
      toast.success(`Lot créé avec succès${newId ? ` (ID: ${newId})` : ''}`)
      router.push('/dashboard-agriculteur')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Erreur lors de la création du lot'))
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

  const varietes = typeProduit === 'Cacao' ? VARIETES_CACAO : VARIETES_CAFE

  return (
    <RoleGate role={user?.role} path="/nouveau-lot">
      <div className="page-container py-6 sm:py-8 max-w-3xl mx-auto">
        <header className="page-header mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">Nouveau lot</h1>
          <p className="text-[var(--color-muted)] mt-2 text-sm leading-relaxed">
            Formulaire simplifié — même logique que l&apos;app mobile : la position est obtenue automatiquement via le GPS du
            navigateur (aucune saisie manuelle des coordonnées).
          </p>
        </header>

        <div className="card">
          <div className="card-body space-y-6">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[#FAFAFA] p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Position du lot</p>
                  <p className="text-sm text-[var(--color-muted)] mt-1">
                    {geoStatus === 'loading' && 'Acquisition du signal GPS…'}
                    {geoStatus === 'ok' && lieu ? lieu : geoStatus === 'ok' ? 'Coordonnées enregistrées' : null}
                    {geoStatus === 'denied' && 'Autorisez la localisation pour continuer.'}
                    {geoStatus === 'unsupported' && 'La géolocalisation n&apos;est pas disponible sur cet appareil.'}
                    {geoStatus === 'idle' && 'En attente…'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline text-sm whitespace-nowrap"
                  onClick={() => refreshPosition()}
                  disabled={geoStatus === 'loading'}
                >
                  {geoStatus === 'loading' ? 'Localisation…' : 'Actualiser la position'}
                </button>
              </div>
              <LocationMap
                height="260px"
                interactive={false}
                latitude={latitude ?? undefined}
                longitude={longitude ?? undefined}
              />
              <p className="text-xs text-[var(--color-muted)] mt-2">
                La carte se centre automatiquement sur votre position une fois le GPS accordé.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="form-label mb-2">Type de culture *</p>
                <div className="flex gap-3">
                  {(['Cacao', 'Cafe'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTypeProduit(t)
                        setVariete('')
                      }}
                      className={`flex-1 py-3 rounded-xl text-sm font-black border-2 transition-colors ${
                        typeProduit === t
                          ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#1B5E20]'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {t === 'Cafe' ? 'Café' : 'Cacao'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="variete">
                  Variété *
                </label>
                <select
                  id="variete"
                  className="form-input"
                  value={variete}
                  onChange={(e) => setVariete(e.target.value)}
                  required
                >
                  <option value="">Sélectionner…</option>
                  {varietes.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="quantite">
                  Poids (kg) *
                </label>
                <input
                  id="quantite"
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  placeholder="Ex : 50"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="date_recolte">
                  Date de récolte *
                </label>
                <input
                  id="date_recolte"
                  type="date"
                  className="form-input"
                  value={dateRecolte}
                  onChange={(e) => setDateRecolte(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notes">
                  Notes (optionnel)
                </label>
                <textarea
                  id="notes"
                  className="form-input"
                  rows={3}
                  placeholder="Informations complémentaires…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />{' '}
                      Création…
                    </>
                  ) : (
                    'Créer le lot'
                  )}
                </button>
                <button type="button" className="btn btn-outline flex-1 justify-center" onClick={() => router.push('/lots')}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </RoleGate>
  )
}
