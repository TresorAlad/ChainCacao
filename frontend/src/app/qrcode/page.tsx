'use client'

import { useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function QRCodePage() {
  const [batchId, setBatchId] = useState('')
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [qrData, setQrData] = useState<any>(null)

  const generateQR = async () => {
    try {
      // Essayer d'abord l'image PNG
      const imgUrl = `${process.env.NEXT_PUBLIC_API_URL}/qrcode/${batchId}?format=png`
      // Testons si l'image se charge
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imgUrl
      })
      setQrImageUrl(imgUrl)
      setQrData(null)
    } catch {
      // fallback JSON
      try {
        const res = await api.get(`/qrcode/${batchId}`)
        setQrData(res.data)
        setQrImageUrl(null)
      } catch (err: any) {
        toast.error(err.message)
      }
    }
  }

  return (
    <div>
      <h1 className="text-h1 mb-6">Générer QR code</h1>
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
        <button onClick={generateQR} className="btn-primary">
          Afficher QR
        </button>
      </div>

      {qrImageUrl && (
        <div className="bg-white p-4 rounded shadow inline-block">
          <img src={qrImageUrl} alt={`QR code ${batchId}`} className="border rounded" />
          <p className="caption mt-2">Scannez pour vérifier le lot {batchId}</p>
        </div>
      )}

      {qrData && (
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
