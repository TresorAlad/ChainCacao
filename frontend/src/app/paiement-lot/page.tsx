'use client'

import { Suspense, useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleBasedRedirect } from '@/lib/role-utils'
import api, { type Batch } from '@/lib/api'
import { BanknotesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const PAYMENT_ROLES = ['transformateur', 'exportateur', 'admin']

function PaiementLotContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading, user } = useAuth()
  const [lotId, setLotId] = useState('')
  const [lot, setLot] = useState<Batch | null>(null)
  const [pin, setPin] = useState('')
  const [prixParKg, setPrixParKg] = useState('')
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
      const res = await api.get<Batch>(`/lot/${encodeURIComponent(trimmed)}`)
      setLot(res.data as Batch)
      setLotId(trimmed)
    } catch {
      toast.error('Lot introuvable')
    } finally {
      setSearching(false)
    }
  }

  const handlePay = async () => {
    if (!lot) return
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#33691E] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user?.role || !PAYMENT_ROLES.includes(user.role)) return null

  const roleKey = user.role === 'exportateur' ? 'exportateur' : 'transformateur'

  return (
    <RoleLayout role={roleKey}>
      <div className="w-full py-6 sm:py-8 max-w-2xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)] flex items-center gap-3">
            <BanknotesIcon className="w-10 h-10 text-[#33691E]" />
            Paiement par identifiant
          </h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Saisissez l&apos;identifiant du lot (pas de scan QR sur le web). Vérifiez les informations, puis confirmez avec votre PIN.
          </p>
        </header>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] space-y-6">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Identifiant du lot</label>
            <div className="flex gap-3 mt-2">
              <input
                type="text"
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadLot()}
                placeholder="Ex: LOT-2026-05015-00001"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold font-mono"
              />
              <button
                type="button"
                onClick={() => loadLot()}
                disabled={searching}
                className="px-5 py-3 bg-[#33691E] text-white rounded-xl text-sm font-black flex items-center gap-2 disabled:opacity-50"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                {searching ? '…' : 'Charger'}
              </button>
            </div>
          </div>

          {lot && (
            <div className="rounded-2xl bg-[#F1F8E9] border border-[#C8E6C9] p-5 space-y-2">
              <p className="font-mono font-black text-[#1B5E20]">{lot.id}</p>
              <p className="text-sm text-gray-600">
                {lot.culture} {lot.variete ? `· ${lot.variete}` : ''} — {lot.quantite} kg
              </p>
              <p className="text-xs text-gray-500">Statut : {lot.statut || '—'} · Propriétaire : {lot.proprietaire_id}</p>
            </div>
          )}

          {lot && (
            <>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Prix par kg (FCFA, optionnel)
                </label>
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
                disabled={submitting}
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#33691E] border-t-transparent" />
        </div>
      }
    >
      <PaiementLotContent />
    </Suspense>
  )
}
