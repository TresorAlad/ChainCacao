'use client'

import { useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function EudrReportPage() {
  const [batchId, setBatchId] = useState('')
  const [report, setReport] = useState<any>(null)

  const loadReport = async () => {
    try {
      const res = await api.get(`/eudr/${batchId}/report`)
      setReport(res.data)
      toast.success('Rapport chargé')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const downloadPdf = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/eudr/${batchId}/report/pdf`
    window.open(url, '_blank')
  }

  return (
    <div>
      <h1 className="text-h1 mb-6">Rapport EUDR</h1>
      <div className="flex gap-4 items-end mb-6">
        <div className="flex-1">
          <label className="block text-label mb-1">ID du lot</label>
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="px-3 py-2 border rounded w-full"
          />
        </div>
        <button onClick={loadReport} className="btn-primary">
          Voir rapport (JSON)
        </button>
        <button onClick={downloadPdf} className="btn-outline">
          Télécharger PDF
        </button>
      </div>

      {report && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-h2 mb-4">Rapport EUDR pour {batchId}</h2>
          <pre className="text-xs overflow-auto bg-gray-50 p-4 rounded">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
