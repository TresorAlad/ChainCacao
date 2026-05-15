'use client'

import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import api from '@/lib/api'
import toast from 'react-hot-toast'

type EudrReport = {
  lot_id: string
  generated_at: string
  culture: string
  quantite_kg: number
  latitude: number
  longitude: number
  lieu: string
  parcelle: string
  statut: string
  eudr_conforme: boolean
  verify_url: string
  hashes_blockchain: string[]
  chain_propriete: Array<{ type: string; actor_id: string; tx_hash: string; created_at: string }>
}

function EudrReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading, user } = useAuth()
  const [lotId, setLotId] = useState('')
  const [report, setReport] = useState<EudrReport | null>(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    const id = searchParams.get('lot')?.trim()
    if (id) {
      setLotId(id)
      void loadReport(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const loadReport = async (id?: string) => {
    const trimmed = (id ?? lotId).trim()
    if (!trimmed) {
      toast.error('Saisissez un ID de lot')
      return
    }
    setFetching(true)
    setReport(null)
    try {
      const res = await api.get<{ success: boolean; report: EudrReport }>(
        `/eudr/${encodeURIComponent(trimmed)}/report`
      )
      setReport(res.data.report)
      setLotId(trimmed)
    } catch {
      toast.error('Impossible de générer le rapport')
    } finally {
      setFetching(false)
    }
  }

  const downloadTxt = () => {
    if (!lotId) return
    const base = process.env.NEXT_PUBLIC_API_URL || ''
    window.open(`${base}/api/v1/eudr/${encodeURIComponent(lotId)}/report/pdf`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#33691E] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || (user?.role !== 'exportateur' && user?.role !== 'admin')) return null

  return (
    <RoleLayout role={user.role} path="/eudr-report">
      <div className="page-container py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-2">Rapport EUDR</h1>
        <p className="text-[var(--color-muted)] mb-6">Conformité antidéforestation (CDC critère 13).</p>

        <div className="flex gap-2 mb-6">
          <input
            className="form-input flex-1"
            placeholder="ID du lot"
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
          />
          <button type="button" className="btn-primary" disabled={fetching} onClick={() => void loadReport()}>
            Générer
          </button>
        </div>

        {report ? (
          <div className="card p-6 space-y-4 text-sm">
            <p>
              <strong>Lot :</strong> {report.lot_id}
            </p>
            <p>
              <strong>GPS :</strong> {report.latitude?.toFixed(8)}, {report.longitude?.toFixed(8)}
            </p>
            <p>
              <strong>Adresse :</strong> {report.lieu || '—'}
            </p>
            <p>
              <strong>Parcelle :</strong> {report.parcelle || '—'} — {report.quantite_kg} kg
            </p>
            <p>
              <strong>Conforme EUDR :</strong> {report.eudr_conforme ? 'Oui' : 'Non'}
            </p>
            <p>
              <strong>Vérification :</strong>{' '}
              <a href={report.verify_url} className="text-[var(--color-primary)] underline" target="_blank" rel="noreferrer">
                {report.verify_url}
              </a>
            </p>
            <div>
              <strong>Hashes blockchain :</strong>
              <ul className="list-disc pl-5 mt-1">
                {report.hashes_blockchain?.map((h) => (
                  <li key={h} className="font-mono text-xs break-all">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <button type="button" className="btn-outline" onClick={downloadTxt}>
              Télécharger rapport texte
            </button>
          </div>
        ) : null}
      </div>
    </RoleLayout>
  )
}

export default function EudrReportPage() {
  return (
    <Suspense fallback={<div className="p-8">Chargement…</div>}>
      <EudrReportContent />
    </Suspense>
  )
}
