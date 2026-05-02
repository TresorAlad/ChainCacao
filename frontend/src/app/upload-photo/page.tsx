'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getApiBaseUrl } from '@/lib/api-base'
import toast from 'react-hot-toast'

export default function UploadPhotoPage() {
  const [batchId, setBatchId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Veuillez sélectionner un fichier')
      return
    }
    const id = batchId.trim()
    if (!id) {
      toast.error('Saisissez un ID de lot')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('jwt') : '')
      const res = await fetch(`${getApiBaseUrl()}/lot/${encodeURIComponent(id)}/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(typeof j.error === 'string' ? j.error : 'Upload échoué')
      }
      await res.json().catch(() => ({}))
      toast.success('Photo uploadée avec succès')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur'
      toast.error(message)
    } finally {
      setUploading(false)
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
    <div className="page-container">
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
