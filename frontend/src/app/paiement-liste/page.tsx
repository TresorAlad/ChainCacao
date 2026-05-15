'use client'

import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleBasedRedirect } from '@/lib/role-utils'
import api from '@/lib/api'
import { BanknotesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const PAYMENT_ROLES = ['transformateur', 'exportateur', 'admin']

type PaymentLine = {
  lot_id: string
  poids_kg: number
  montant_brut: number
  marge_fcfa: number
  montant_net: number
}

type PreviewResponse = {
  success: boolean
  list_id: string
  prix_par_kg: number
  marge_pct: number
  marge_fcfa: number
  montant_brut: number
  montant_net_agriculteurs: number
  montant_total_debite: number
  nb_agriculteurs: number
  poids_total_kg: number
  lots: PaymentLine[]
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('fr-FR')
}

function PaiementListeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading, user } = useAuth()
  const [listId, setListId] = useState('')
  const [prixParKg, setPrixParKg] = useState('')
  const [pin, setPin] = useState('')
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    const id = searchParams.get('list')?.trim()
    if (id) setListId(id)
  }, [searchParams])

  useEffect(() => {
    if (!isAuthenticated) return
    api
      .get<{ balance?: number }>('/portefeuille/solde')
      .then((r) => setBalance(r.data.balance ?? 0))
      .catch(() => setBalance(null))
  }, [isAuthenticated])

  const runPreview = async () => {
    const id = listId.trim()
    const prix = parseFloat(prixParKg)
    if (!id) {
      toast.error('Identifiant de liste requis')
      return
    }
    if (!prix || prix <= 0) {
      toast.error('Prix par kg invalide')
      return
    }
    setLoadingPreview(true)
    setPreview(null)
    try {
      const res = await api.post<PreviewResponse>(`/liste-groupee/${encodeURIComponent(id)}/preview`, {
        prix_par_kg: prix,
      })
      setPreview(res.data)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Prévisualisation impossible')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handlePay = async () => {
    if (!preview) return
    if (!pin || pin.length !== 4) {
      toast.error('Code PIN à 4 chiffres requis')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/liste-groupee/${encodeURIComponent(preview.list_id)}/payer`, {
        pin,
        prix_par_kg: preview.prix_par_kg,
      })
      toast.success('Paiement de la liste effectué')
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
      <div className="w-full py-6 sm:py-8 max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)] flex items-center gap-3">
            <BanknotesIcon className="w-10 h-10 text-[#33691E]" />
            Payer une liste groupée
          </h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Saisissez l&apos;identifiant LIST-… et le prix convenu par kg. La marge coopérative est déduite automatiquement.
          </p>
        </header>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] space-y-6">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Identifiant liste</label>
            <input
              type="text"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              placeholder="LIST-20260515-0001"
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Prix par kg (FCFA)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={prixParKg}
              onChange={(e) => setPrixParKg(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold"
              placeholder="1200"
            />
          </div>
          <button
            type="button"
            onClick={runPreview}
            disabled={loadingPreview}
            className="w-full py-3 bg-[#33691E] text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            {loadingPreview ? 'Calcul…' : 'Prévisualiser le paiement'}
          </button>

          {balance !== null && (
            <p className="text-sm text-gray-600">
              Solde portefeuille : <strong>{fmt(balance)} FCFA</strong>
            </p>
          )}

          {preview && (
            <div className="rounded-2xl bg-[#F1F8E9] border border-[#C8E6C9] p-5 space-y-4">
              <p className="font-mono font-black text-[#1B5E20]">{preview.list_id}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p>
                  <span className="text-gray-500">Agriculteurs</span>
                  <br />
                  <strong>{preview.nb_agriculteurs}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Poids total</span>
                  <br />
                  <strong>{preview.poids_total_kg} kg</strong>
                </p>
                <p>
                  <span className="text-gray-500">Prix / kg</span>
                  <br />
                  <strong>{fmt(preview.prix_par_kg)} FCFA</strong>
                </p>
                <p>
                  <span className="text-gray-500">Marge coop.</span>
                  <br />
                  <strong>
                    {preview.marge_pct} % ({fmt(preview.marge_fcfa)} FCFA)
                  </strong>
                </p>
                <p className="col-span-2">
                  <span className="text-gray-500">Total à débiter</span>
                  <br />
                  <strong className="text-lg text-[#1B5E20]">{fmt(preview.montant_total_debite)} FCFA</strong>
                </p>
                <p className="col-span-2 text-xs text-gray-600">
                  Net aux producteurs : {fmt(preview.montant_net_agriculteurs)} FCFA
                </p>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1">Lot</th>
                    <th>kg</th>
                    <th>Brut</th>
                    <th>Marge</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.lots?.map((ln) => (
                    <tr key={ln.lot_id} className="border-t border-[#C8E6C9]/50">
                      <td className="py-1 font-mono">{ln.lot_id}</td>
                      <td>{ln.poids_kg}</td>
                      <td>{fmt(ln.montant_brut)}</td>
                      <td>{fmt(ln.marge_fcfa)}</td>
                      <td>{fmt(ln.montant_net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Code PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold tracking-widest"
                />
              </div>
              <button
                type="button"
                onClick={handlePay}
                disabled={submitting || (balance !== null && balance < preview.montant_total_debite)}
                className="w-full py-4 bg-[#1B3A0F] text-white rounded-2xl text-sm font-black disabled:opacity-50"
              >
                {submitting ? 'Paiement…' : 'Payer la liste'}
              </button>
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  )
}

export default function PaiementListePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#33691E] border-t-transparent" />
        </div>
      }
    >
      <PaiementListeContent />
    </Suspense>
  )
}
