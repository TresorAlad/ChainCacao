'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { FileTextIcon, DownloadIcon, ShieldCheckIcon, PackageIcon } from 'lucide-react'

export default function ExportPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [lots, setLots] = useState<Array<{id: string, type: string, quantity: string, status: string}>>([])
  const [selectedLots, setSelectedLots] = useState<string[]>([])
  const [format, setFormat] = useState('json')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
    if (isAuthenticated) {
      setLots([
        { id: 'LOT-2024-0892', type: 'Cacao Forastero', quantity: '2,500 kg', status: 'Exporté' },
        { id: 'LOT-2024-0891', type: 'Cacao Criollo', quantity: '1,800 kg', status: 'En Stock' },
        { id: 'LOT-2024-0890', type: 'Cacao Trinitario', quantity: '3,200 kg', status: 'En Stock' },
        { id: 'LOT-2024-0889', type: 'Cacao Forastero', quantity: '1,500 kg', status: 'En Transit' },
      ])
    }
  }, [isAuthenticated, loading, router])

  const toggleLot = (lotId: string) => {
    setSelectedLots(prev => 
      prev.includes(lotId) 
        ? prev.filter(id => id !== lotId)
        : [...prev, lotId]
    )
  }

  const handleExport = async () => {
    if (selectedLots.length === 0) {
      alert('Veuillez sélectionner au moins un lot')
      return
    }
    setIsExporting(true)
    try {
      // Simulation d'export
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const data = {
        exportDate: new Date().toISOString(),
        lots: selectedLots.map(id => lots.find(l => l.id === id)),
        format
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-chaincacao-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setSelectedLots([])
    } catch (err: any) {
      alert('Erreur lors de l\'export: ' + err.message)
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
          Exportez vos lots au format JSON avec conformité EUDR
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des lots */}
        <div className="lg:col-span-2">
          <div className="card group">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title flex items-center gap-2">
                <PackageIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Sélection des lots
              </h2>
              <span className="text-body-sm text-[var(--color-muted)]">
                {selectedLots.length} sélectionné(s)
              </span>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
                      <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">
                        <input
                          type="checkbox"
                          checked={selectedLots.length === lots.length && lots.length > 0}
                          onChange={() => {
                            if (selectedLots.length === lots.length) {
                              setSelectedLots([])
                            } else {
                              setSelectedLots(lots.map(l => l.id))
                            }
                          }}
                          className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">ID du lot</th>
                      <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Type</th>
                      <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Quantité</th>
                      <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map(lot => (
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
                        <td className="px-6 py-4 text-[var(--color-earth)]">{lot.type}</td>
                        <td className="px-6 py-4 text-[var(--color-earth)]">{lot.quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            lot.status === 'Exporté' ? 'bg-green-100 text-green-800' :
                            lot.status === 'En Transit' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {lot.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={format === 'json'}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-4 h-4 text-[var(--color-primary)]"
                  />
                  <div>
                    <p className="font-medium text-[var(--color-earth)]">JSON</p>
                    <p className="text-body-sm text-[var(--color-muted)]">Format standard pour intégration API</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors opacity-50">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-4 h-4 text-[var(--color-primary)]"
                    disabled
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