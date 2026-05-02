'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface SyncResult {
  index: number
  lot_id?: string
  tx_hash?: string
  error?: string
}

export default function SyncPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [jsonInput, setJsonInput] = useState('')
  const [results, setResults] = useState<SyncResult[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const handleSync = async () => {
    let payload: unknown
    try {
      payload = JSON.parse(jsonInput)
    } catch {
      toast.error('JSON invalide. Veuillez entrer un tableau JSON valide.')
      return
    }
    if (!Array.isArray(payload)) {
      toast.error('Le payload doit être un tableau JSON : [{...}, {...}]')
      return
    }
    setIsSyncing(true)
    setResults([])
    try {
      const res = await api.post<{ success: boolean; results: SyncResult[] }>('/sync', payload)
      setResults(res.data.results || [])
      toast.success(`Synchronisation terminée : ${res.data.results?.length ?? 0} lot(s) traité(s)`)
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la synchronisation')
    } finally {
      setIsSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">
          Synchronisation hors-ligne
        </h1>
        <p className="text-[var(--color-muted)] mt-2">
          Synchronisez des lots créés hors-ligne avec le ledger blockchain
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header border-b border-[var(--color-border)]/50">
            <h2 className="card-title">Payload JSON (tableau de lots)</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Tableau de lots à synchroniser</label>
              <textarea
                className="form-input font-mono text-sm"
                rows={14}
                placeholder="[]"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
              <p className="form-hint mt-2">
                Collez un tableau JSON de lots. Chaque lot doit contenir : culture, variete, quantite, lieu, region, village, parcelle, date_recolte.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSync}
                disabled={isSyncing || !jsonInput.trim()}
                className="btn btn-primary flex items-center gap-2"
              >
                {isSyncing ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Sync en cours...</>
                ) : (
                  'Synchroniser'
                )}
              </button>
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <div className="card">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title">Résultats ({results.length})</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {results.map((r) => (
                  <div
                    key={r.index}
                    className={`p-3 rounded-lg border ${r.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
                  >
                    <p className="text-body-sm font-semibold">
                      Lot #{r.index + 1}
                      {r.error ? (
                        <span className="text-red-600 ml-2">— Erreur</span>
                      ) : (
                        <span className="text-green-600 ml-2">— Succès</span>
                      )}
                    </p>
                    {r.lot_id && <p className="text-body-sm text-[var(--color-muted)]">ID: {r.lot_id}</p>}
                    {r.tx_hash && <p className="text-body-sm font-mono text-[var(--color-muted)]">Tx: {r.tx_hash.slice(0, 16)}...</p>}
                    {r.error && <p className="text-body-sm text-red-600">{r.error}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
