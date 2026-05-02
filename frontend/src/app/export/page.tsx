'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { FileTextIcon, DownloadIcon, ShieldCheckIcon, PackageIcon } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface LotEntry {
  id: string
  culture: string
  quantite: number
  statut: string
}

export default function ExportPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [batchIds, setBatchIds] = useState('')
  const [lots, setLots] = useState<LotEntry[]>([])
  const [selectedLots, setSelectedLots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const loadLots = async () => {
    const ids = batchIds.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
    if (ids.length === 0) {
      toast.error('Entrez au moins un ID de lot')
      return
    }
    setIsLoading(true)
    const loaded: LotEntry[] = []
    for (const id of ids) {
      try {
        const res = await api.get<any>(`/lot/${id}`)
        const b = res.data
        loaded.push({
          id: b.id || id,
          culture: b.culture || '—',
          quantite: b.quantite ?? 0,
          statut: b.statut || '—',
        })
      } catch {
        toast.error(`Lot introuvable : ${id}`)
      }
    }
    setLots(loaded)
    setSelectedLots(loaded.map((l) => l.id))
    setIsLoading(false)
  }

  const toggleLot = (lotId: string) => {
    setSelectedLots((prev) =>
      prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId]
    )
  }

  const handleExport = async () => {
    if (selectedLots.length === 0) {
      toast.error('Veuillez sélectionner au moins un lot')
      return
    }
    setIsExporting(true)
    try {
      const markedLots: any[] = []
      const errors: string[] = []

      for (const id of selectedLots) {
        try {
          const res = await api.post<any>(`/lot/${id}/export`, {})
          markedLots.push(res.data.batch || { id })
        } catch (err: any) {
          errors.push(`${id}: ${err.message}`)
        }
      }

      if (errors.length > 0) {
        toast.error(`Erreurs pour ${errors.length} lot(s)`)
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        lots: markedLots,
        totalLots: markedLots.length,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-chaincacao-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      if (markedLots.length > 0) {
        toast.success(`${markedLots.length} lot(s) marqué(s) exporté(s) et téléchargés`)
      }
      setSelectedLots([])
    } catch (err: any) {
      toast.error('Erreur lors de l\'export: ' + err.message)
    } finally {
      setIsExporting(false)
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
          Export de données
        </h1>
        <p className="text-[var(--color-muted)] mt-2">
          Marquez des lots comme exportés et téléchargez un rapport JSON
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recherche et sélection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chargement des lots */}
          <div className="card group">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title flex items-center gap-2">
                <PackageIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Charger des lots
              </h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">IDs des lots (séparés par virgule, point-virgule ou saut de ligne)</label>
                <textarea
                  className="form-input font-mono text-sm"
                  rows={4}
                  placeholder="Un identifiant par ligne ou séparés par virgule"
                  value={batchIds}
                  onChange={(e) => setBatchIds(e.target.value)}
                />
              </div>
              <button
                onClick={loadLots}
                disabled={isLoading || !batchIds.trim()}
                className="btn btn-secondary flex items-center gap-2"
              >
                {isLoading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Chargement...</>
                ) : (
                  'Charger les lots'
                )}
              </button>
            </div>
          </div>

          {/* Table des lots chargés */}
          {lots.length > 0 && (
            <div className="card group">
              <div className="card-header border-b border-[var(--color-border)]/50">
                <h2 className="card-title flex items-center justify-between">
                  <span>Lots chargés ({lots.length})</span>
                  <span className="text-body-sm text-[var(--color-muted)]">{selectedLots.length} sélectionné(s)</span>
                </h2>
              </div>
              <div className="card-body p-0">
                <div className="overflow-x-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
                        <th className="px-6 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={selectedLots.length === lots.length && lots.length > 0}
                            onChange={() => {
                              if (selectedLots.length === lots.length) {
                                setSelectedLots([])
                              } else {
                                setSelectedLots(lots.map((l) => l.id))
                              }
                            }}
                            className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">ID du lot</th>
                        <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Culture</th>
                        <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Quantité (kg)</th>
                        <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lots.map((lot) => (
                        <tr key={lot.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg)]/50 transition-all">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedLots.includes(lot.id)}
                              onChange={() => toggleLot(lot.id)}
                              className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                            />
                          </td>
                          <td className="px-6 py-4 font-medium text-[var(--color-primary)]">{lot.id}</td>
                          <td className="px-6 py-4 text-[var(--color-earth)]">{lot.culture}</td>
                          <td className="px-6 py-4 text-[var(--color-earth)]">{lot.quantite} kg</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {lot.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Options d'export */}
        <div className="space-y-6">
          <div className="card group">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Format d'export
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-[var(--color-primary)] cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    defaultChecked
                    className="w-4 h-4 text-[var(--color-primary)]"
                    readOnly
                  />
                  <div>
                    <p className="font-medium text-[var(--color-earth)]">JSON</p>
                    <p className="text-body-sm text-[var(--color-muted)]">Format standard pour intégration API</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer opacity-50">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    disabled
                    className="w-4 h-4 text-[var(--color-primary)]"
                  />
                  <div>
                    <p className="font-medium text-[var(--color-earth)]">CSV</p>
                    <p className="text-body-sm text-[var(--color-muted)]">Bientôt disponible</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="card group">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Conformité EUDR
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="badge badge-success">✓</span>
                  <span className="text-body-sm text-[var(--color-earth)]">Traçabilité complète</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-success">✓</span>
                  <span className="text-body-sm text-[var(--color-earth)]">Géo-localisation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-success">✓</span>
                  <span className="text-body-sm text-[var(--color-earth)]">Preuves de durabilité</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting || selectedLots.length === 0}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Export en cours...</>
            ) : (
              <><DownloadIcon className="w-4 h-4" /> Exporter ({selectedLots.length} lot{selectedLots.length > 1 ? 's' : ''})</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
