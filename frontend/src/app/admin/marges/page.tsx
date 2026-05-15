'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { AdminGate } from '@/components/AdminGate'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/error-utils'

type CoopActor = { id: string; nom: string; org_id: string; role?: string }

export default function AdminMargesPage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const [coops, setCoops] = useState<CoopActor[]>([])
  const [orgId, setOrgId] = useState('CooperativeMSP')
  const [margin, setMargin] = useState('5')
  const [currentMargin, setCurrentMargin] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lastTx, setLastTx] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    api
      .get<{ actors?: CoopActor[] }>('/admin/actors')
      .then((res) => {
        const list = (res.data.actors || []).filter(
          (a) => a.role === 'cooperative' || (a.org_id && a.org_id.includes('Cooperative'))
        )
        setCoops(list.length ? list : [{ id: 'actor-coop-001', nom: 'Coopérative Plateaux', org_id: 'CooperativeMSP' }])
      })
      .catch(() => setCoops([{ id: 'actor-coop-001', nom: 'Coopérative Plateaux', org_id: 'CooperativeMSP' }]))
  }, [isAuthenticated])

  const loadCurrentMargin = useCallback(async (oid: string) => {
    try {
      const res = await api.get<{ margin?: number; margin_pct?: number }>(`/admin/marge?org_id=${encodeURIComponent(oid)}`)
      const m = res.data.margin_pct ?? res.data.margin ?? 0
      setCurrentMargin(m)
    } catch {
      setCurrentMargin(null)
    }
  }, [])

  useEffect(() => {
    if (orgId) void loadCurrentMargin(orgId)
  }, [orgId, loadCurrentMargin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const m = parseFloat(margin)
    if (Number.isNaN(m) || m < 0 || m > 100) {
      toast.error('Marge invalide (0 à 100 %)')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post<{ success: boolean; tx_hash?: string; message?: string }>(
        '/admin/marge',
        { org_id: orgId.trim(), margin: m }
      )
      setLastTx(res.data.tx_hash || null)
      setCurrentMargin(m)
      toast.success(res.data.message || 'Marge enregistrée sur la blockchain')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Impossible d’enregistrer la marge'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  return (
    <AdminGate role={user?.role}>
      <div className="w-full py-6 sm:py-8 max-w-2xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[#33691E] mb-6 hover:underline">
          <ArrowLeftIcon className="w-4 h-4" />
          Retour administration
        </Link>

        <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">Marges coopératives</h1>
        <p className="text-[var(--color-muted)] mb-8">
          Après validation de la lettre signée, saisissez le pourcentage officiel (ex. 5 = 5 %). La marge est gravée sur le ledger et
          appliquée automatiquement à chaque paiement.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-[var(--color-border)] space-y-6">
          <div>
            <label className="form-label">Coopérative</label>
            <select className="form-input" value={orgId} onChange={(e) => setOrgId(e.target.value)} required>
              {coops.map((c) => (
                <option key={c.org_id} value={c.org_id}>
                  {c.nom} ({c.org_id})
                </option>
              ))}
              {!coops.some((c) => c.org_id === 'CooperativeMSP') && (
                <option value="CooperativeMSP">CooperativeMSP (démo)</option>
              )}
            </select>
            {currentMargin !== null && (
              <p className="text-sm text-[var(--color-muted)] mt-2">
                Marge actuelle sur le ledger : <strong>{currentMargin} %</strong>
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Marge (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              className="form-input"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Exemple CDC : 5 pour une marge de 5 %</p>
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary w-full">
            {submitting ? 'Enregistrement…' : 'Appliquer la marge'}
          </button>
          {lastTx && <p className="text-xs font-mono text-gray-500 break-all">Dernier tx : {lastTx}</p>}
        </form>
      </div>
    </AdminGate>
  )
}
