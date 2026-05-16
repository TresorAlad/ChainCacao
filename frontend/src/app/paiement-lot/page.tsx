'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleBasedRedirect } from '@/lib/role-utils'
import api, { type Batch, unwrapLotFromResponse } from '@/lib/api'
import { BanknotesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const PAYMENT_ROLES = ['transformateur', 'exportateur', 'admin']

type LotPreview = {
  marge_pct: number
  marge_fcfa: number
  montant_brut: number
  montant_net: number
  montant_total_debite: number
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('fr-FR')
}

function PaiementLotContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading, user } = useAuth()
  const [lotId, setLotId] = useState('')
  const [lot, setLot] = useState<Batch | null>(null)
  const [pin, setPin] = useState('')
  const [prixParKg, setPrixParKg] = useState('')
  const [preview, setPreview] = useState<LotPreview | null>(null)
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
    setPreview(null)
    try {
      const res = await api.get(`/lot/${encodeURIComponent(trimmed)}`)
      const b = unwrapLotFromResponse(res.data)
      if (!b) {
        toast.error('Lot introuvable')
        return
      }
      setLot(b)
      setLotId(trimmed)
      const st = (b.statut || '').toLowerCase()
      if (st.includes('transit')) {
        toast('Ce lot est en transit : confirmez d’abord la réception physique.', {
          icon: '⚠️',
        })
      }
    } catch {
      toast.error('Lot introuvable')
    } finally {
      setSearching(false)
    }
  }

  const loadPreview = useCallback(async () => {
    if (!lot) return
    const prix = parseFloat(prixParKg)
    if (!prix || prix <= 0) {
      setPreview(null)
      return
    }
    try {
      const res = await api.get<LotPreview & { success?: boolean }>(
        `/lot/${encodeURIComponent(lot.id)}/paiement-preview?prix_par_kg=${prix}`
      )
      setPreview(res.data)
    } catch {
      setPreview(null)
    }
  }, [lot, prixParKg])

  useEffect(() => {
    const t = setTimeout(() => void loadPreview(), 400)
    return () => clearTimeout(t)
  }, [loadPreview])

  const handlePay = async () => {
    if (!lot) return
    const st = (lot.statut || '').toLowerCase()
    if (st.includes('transit')) {
      toast.error('Réception physique requise avant le paiement')
      router.push(`/reception-lot?lot=${encodeURIComponent(lot.id)}`)
      return
    }
    if (!pin || pin.length !== 4) {
      toast.error('Code PIN à 4 chiffres requis')
      return
    }
    setSubmitting(true)
    try {
      const prix = prixParKg.trim() ? parseFloat(prixParKg) : undefined
      if (prixParKg.trim() && (!prix || prix <= 0)) {
        toast.error('Prix par kg invalide')
        setSubmitting(false)
        return
      }
      if (prix && prix > 0) {
        await api.post(`/lot/${encodeURIComponent(lot.id)}/prix`, { prix_par_kg: prix })
      }
      await api.post(`/lot/${encodeURIComponent(lot.id)}/confirmer`, { pin })
      toast.success('Paiement enregistré — le producteur sera notifié')
      router.push(getRoleBasedRedirect(user?.role))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Échec du paiement')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#33691E] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user?.role || !PAYMENT_ROLES.includes(user.role)) return null

  const roleKey = user.role === 'exportateur' ? 'exportateur' : 'transformateur'

  return (
    <RoleLayout role={roleKey}>
      <div className="page-container py-6 sm:py-8 max-w-2xl mx-auto">
        <header className="page-header mb-6 sm:mb-10">
          <h1 className="page-heading-row">
            <BanknotesIcon className="page-heading-icon" />
            Paiement par identifiant
          </h1>
          <p className="page-subtitle">
            Prix brut, marge coopérative et montant net affichés avant confirmation (CDC).
          </p>
        </header>

        <div className="card-panel space-y-6">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Identifiant du lot</label>
            <div className="toolbar-row mt-2">
              <input
                type="text"
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadLot()}
                placeholder="Ex: LOT-2026-05015-00001"
                className="form-input font-mono text-sm font-bold"
              />
              <button
                type="button"
                onClick={() => loadLot()}
                disabled={searching}
                className="btn-primary px-5 py-3 flex items-center gap-2 disabled:opacity-50"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                {searching ? '…' : 'Charger'}
              </button>
            </div>
          </div>

          {lot && (
            <div className="rounded-2xl bg-[#F1F8E9] border border-[#C8E6C9] p-5 space-y-2">
              <p className="font-mono font-black text-[#1B5E20] break-all">{lot.id}</p>
              <p className="text-sm text-gray-600">
                {lot.culture} {lot.variete ? `· ${lot.variete}` : ''} — {lot.quantite} kg
              </p>
              <p className="text-xs text-gray-500">Statut : {lot.statut || '—'}</p>
            </div>
          )}

          {lot && (
            <>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Prix par kg (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={prixParKg}
                  onChange={(e) => setPrixParKg(e.target.value)}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold"
                  placeholder="Ex: 1200"
                />
              </div>

              {preview && prixParKg.trim() && (
                <div className="rounded-xl border border-[#C8E6C9] bg-white p-4 text-sm space-y-2">
                  <p>
                    Prix brut : <strong>{fmt(preview.montant_brut)} FCFA</strong>
                  </p>
                  <p>
                    Marge coopérative ({preview.marge_pct} %) :{' '}
                    <strong>−{fmt(preview.marge_fcfa)} FCFA</strong>
                  </p>
                  <p className="text-[#1B5E20]">
                    Montant net producteur : <strong>{fmt(preview.montant_net)} FCFA</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Total débité sur votre portefeuille : {fmt(preview.montant_total_debite)} FCFA
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Code PIN (4 chiffres)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold tracking-widest"
                  placeholder="••••"
                />
              </div>
              <button
                type="button"
                onClick={handlePay}
                disabled={submitting || !preview}
                className="w-full py-4 bg-[#1B3A0F] text-white rounded-2xl text-sm font-black hover:brightness-110 disabled:opacity-50"
              >
                {submitting ? 'Traitement…' : 'Confirmer le paiement'}
              </button>
            </>
          )}
        </div>
      </div>
    </RoleLayout>
  )
}

export default function PaiementLotPage() {
  return (
    <Suspense
      fallback={
        <div className="page-loading">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#33691E] border-t-transparent" />
        </div>
      }
    >
      <PaiementLotContent />
    </Suspense>
  )
}
