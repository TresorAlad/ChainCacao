'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'

function EudrReportInner() {
  const searchParams = useSearchParams()
  const lotFromUrl = searchParams.get('lot') || ''
  const [batchId, setBatchId] = useState(lotFromUrl)
  const [report, setReport] = useState<unknown>(null)

  useEffect(() => {
    if (lotFromUrl) setBatchId(lotFromUrl)
  }, [lotFromUrl])

  const loadReport = async () => {
    const id = batchId.trim()
    if (!id) {
      toast.error('Saisissez un ID de lot')
      return
    }
    try {
      const res = await api.get<{ success: boolean; report: unknown }>(`/eudr/${encodeURIComponent(id)}/report`)
      setReport(res.data.report ?? res.data)
      toast.success('Rapport chargé')
    } catch (err: any) {
      toast.error(err.message)
      setReport(null)
    }
  }

  const downloadPdf = async () => {
    const id = batchId.trim()
    if (!id) {
      toast.error('Saisissez un ID de lot')
      return
    }
    try {
      const res = await api.get(`/eudr/${encodeURIComponent(id)}/report/pdf`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `eudr-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF téléchargé')
    } catch (err: any) {
      toast.error(err.message || 'Échec du téléchargement PDF')
    }
  }

  return (
    <div className="page-container max-w-4xl">
      <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-6">Rapport EUDR</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">
        Réservé aux rôles autorisés par l’API (ex. distributeur, administrateur).
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-end mb-6">
        <div className="flex-1 w-full">
          <label className="form-label">ID du lot</label>
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="form-input w-full"
          />
        </div>
        <button type="button" onClick={loadReport} className="btn btn-primary shrink-0">
          Voir rapport (JSON)
        </button>
        <button type="button" onClick={downloadPdf} className="btn btn-secondary-outline shrink-0">
          Télécharger PDF
        </button>
      </div>

      {report != null && (
        <div className="card border border-[var(--color-border)]">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4">Rapport pour {batchId.trim()}</h2>
            <pre className="text-xs overflow-auto bg-[var(--color-bg)] p-4 rounded-lg max-h-[480px]">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EudrReportPage() {
  return (
    <Suspense fallback={<div className="page-container p-8">Chargement…</div>}>
      <EudrReportInner />
    </Suspense>
  )
}
