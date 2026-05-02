'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function UploadPhotoPage() {
  const [batchId, setBatchId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Veuillez sélectionner un fichier')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lot/${batchId}/photo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
          body: formData,
        }
      )
      if (!res.ok) throw new Error('Upload échoué')
      const data = await res.json()
      toast.success('Photo uploadée')
      console.log('URL:', data.url)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h1 className="text-h1 mb-6">Upload photo de lot</h1>
      <form onSubmit={handleSubmit} className="form-grid max-w-lg">
        <label>
          ID du lot
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            required
          />
        </label>
        <label>
          Fichier photo (JPG/PNG)
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={uploading}>
            {uploading ? 'Upload...' : 'Uploader'}
          </button>
          <button type="button" className="btn-outline" onClick={() => router.push('/lots')}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
