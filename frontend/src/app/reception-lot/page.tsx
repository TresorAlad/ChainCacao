'use client'

import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import api, { type Batch } from '@/lib/api'
import { TruckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const RECEPTION_ROLES = ['cooperative', 'transformateur', 'exportateur', 'admin']

function ReceptionLotContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading, user } = useAuth()
  const [lotId, setLotId] = useState('')
  const [lot, setLot] = useState<Batch | null>(null)
  const [pin, setPin] = useState('')
  const [poidsConstate, setPoidsConstate] = useState('')
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    const id = searchParams.get('lot')?.trim()
    if (id) {
      setLotId(id)
      void loadLot(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const loadLot = async (id?: string) => {
    const trimmed = (id ?? lotId).trim()
    if (!trimmed) {
      toast.error('Saisissez un identifiant de lot')
      return
    }
    setSearching(true)
    setLot(null)
    try {
      const res = await api.get<{ lot?: Batch } | Batch>(`/lot/${encodeURIComponent(trimmed)}`)
      const data = res.data as { lot?: Batch }
      const b = data.lot ?? (res.data as Batch)
      setLot(b)
      setLotId(trimmed)
      if (b.quantite != null) setPoidsConstate(String(b.quantite))
    } catch {
      toast.error('Lot introuvable')
    } finally {
      setSearching(false)
    }
  }

  const handleReception = async () => {
    if (!lot?.id) return
    if (!pin || pin.length !== 4) {
      toast.error('Code PIN à 4 chiffres requis')
      return
    }
    setSubmitting(true)
    try {
      const poids = poidsConstate.trim() ? parseFloat(poidsConstate) : undefined
      await api.post(`/lot/${encodeURIComponent(lot.id)}/reception`, {
        pin,
        poids_constate: poids && poids > 0 ? poids : undefined,
      })
      toast.success('Réception physique confirmée sur la chaîne')
      router.push(`/paiement-lot?lot=${encodeURIComponent(lot.id)}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la réception'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#33691E] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user?.role || !RECEPTION_ROLES.includes(user.role)) return null

  const statut = (lot?.statut || '').toLowerCase()
  const enTransit = statut.includes('transit')

  return (
    <RoleLayout role={user.role} path="/reception-lot">
      <div className="page-container py-6 sm:py-8 max-w-2xl">
        <header className="page-header mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-2">
            <TruckIcon className="h-7 w-7" />
            Réception physique du lot
          </h1>
          <p className="text-[var(--color-muted)] mt-2">
            Confirmez la réception sur balance avant tout paiement (CDC).
          </p>
        </header>

        <div className="card p-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              className="form-input flex-1"
              placeholder="ID du lot ou scan QR"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
            />
            <button type="button" className="btn-primary px-4" onClick={() => void loadLot()} disabled={searching}>
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>

          {lot ? (
            <div className="rounded-lg bg-[var(--color-surface)] p-4 text-sm space-y-2">
              <p>
                <strong>ID :</strong> {lot.id}
              </p>
              <p>
                <strong>Culture :</strong> {lot.culture} — {lot.quantite} kg déclarés
              </p>
              <p>
                <strong>Adresse :</strong> {lot.lieu || '—'}
              </p>
              {lot.latitude != null && lot.longitude != null ? (
                <p className="text-[var(--color-muted)]">
                  GPS : {lot.latitude}, {lot.longitude}
                </p>
              ) : null}
              <p>
                <strong>Statut :</strong> {lot.statut}
                {!enTransit ? <span className="text-amber-700"> — pas en transit</span> : null}
              </p>
            </div>
          ) : null}

          <div>
            <label className="form-label">Poids constaté à la balance (kg)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={poidsConstate}
              onChange={(e) => setPoidsConstate(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Code PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="form-input"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </div>

          <button
            type="button"
            className="btn-primary w-full"
            disabled={submitting || !lot || !enTransit}
            onClick={() => void handleReception()}
          >
            {submitting ? 'Confirmation…' : 'Confirmer la réception'}
          </button>

          {lot && !enTransit ? (
            <p className="text-sm text-amber-700">
              Ce lot n’est pas en transit. Si déjà reçu, passez au{' '}
              <button
                type="button"
                className="underline font-medium"
                onClick={() => router.push(`/paiement-lot?lot=${encodeURIComponent(lot.id)}`)}
              >
                paiement
              </button>
              .
            </p>
          ) : null}
        </div>
      </div>
    </RoleLayout>
  )
}

export default function ReceptionLotPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement…</div>}>
      <ReceptionLotContent />
    </Suspense>
  )
}
