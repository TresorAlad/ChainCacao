'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { getApiBaseUrl } from '@/lib/api-base'
import toast from 'react-hot-toast'

export default function QRCodePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [batchId, setBatchId] = useState('')
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [qrData, setQrData] = useState<unknown>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const generateQR = async () => {
    const id = batchId.trim()
    if (!id) {
      toast.error('Saisissez un ID de lot')
      return
    }
    const encoded = encodeURIComponent(id)
    try {
      const imgUrl = `${getApiBaseUrl()}/qrcode/${encoded}?format=png`
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imgUrl
      })
      setQrImageUrl(imgUrl)
      setQrData(null)
    } catch {
      try {
        const res = await api.get(`/qrcode/${encoded}`)
        setQrData(res.data)
        setQrImageUrl(null)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur'
        toast.error(message)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="page-container py-6 sm:py-8">
      <h1 className="text-h1 mb-6">Générer QR code</h1>
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-label mb-1">ID du lot</label>
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="form-input w-full"
          />
        </div>
        <button type="button" onClick={generateQR} className="btn btn-primary">
          Afficher QR
        </button>
      </div>

      {qrImageUrl && (
        <div className="bg-white p-4 rounded shadow inline-block">
          <img src={qrImageUrl} alt={`QR code ${batchId}`} className="border rounded" />
          <p className="caption mt-2">Scannez pour vérifier le lot {batchId}</p>
        </div>
      )}

      {qrData != null && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-h2 mb-4">Données QR</h2>
          <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(qrData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
