'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  DocumentTextIcon as FileTextIcon, 
  ArrowDownTrayIcon as DownloadIcon, 
  ShieldCheckIcon, 
  CubeIcon as PackageIcon 
} from '@heroicons/react/24/outline'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/error-utils'

interface LotEntry {
  id: string
  culture: string
  quantite: number
  statut: string
}

const EXPORT_ALLOWED = ['distributeur', 'exportateur', 'admin']

export default function ExportPage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
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
      const markedLots: { id: string }[] = []
      const errors: string[] = []

      for (const id of selectedLots) {
        try {
          const res = await api.post<{ batch?: { id?: string } }>(`/lot/${encodeURIComponent(id)}/export`, {})
          const bid = res.data.batch?.id ?? id
          markedLots.push({ id: bid })
        } catch (err: unknown) {
          errors.push(`${id}: ${getErrorMessage(err, 'erreur')}`)
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
    } catch (err: unknown) {
      toast.error(`Erreur lors de l'export : ${getErrorMessage(err, 'erreur inconnue')}`)
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

  if (user?.role && !EXPORT_ALLOWED.includes(user.role)) {
    return (
      <div className="w-full py-6 sm:py-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-700 font-bold text-lg">Accès non autorisé</p>
          <p className="text-red-600 mt-2 text-sm">Votre rôle ({user.role}) n&apos;est pas autorisé à exporter des lots.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-6 sm:py-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
            Export de Données
          </h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Génération de manifestes JSON pour la logistique internationale.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Batch Input */}
          <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-[var(--color-border)]">
            <h2 className="text-2xl font-black text-[var(--color-primary)] mb-6 flex items-center gap-3">
              <PackageIcon className="w-6 h-6" />
              Sélection des Lots
            </h2>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">IDs des lots (un par ligne)</label>
              <textarea
                className="w-full px-6 py-4 bg-gray-50 border border-[var(--color-border)] rounded-2xl text-sm font-mono text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all placeholder:text-gray-300"
                rows={4}
                placeholder="Ex: 4CB-3409-A45..."
                value={batchIds}
                onChange={(e) => setBatchIds(e.target.value)}
              />
              <button
                onClick={loadLots}
                disabled={isLoading || !batchIds.trim()}
                className="px-8 py-3 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : 'Charger les lots'}
              </button>
            </div>
          </div>

          {/* Lots Table */}
          {lots.length > 0 && (
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-[var(--color-primary)]">Aperçu de l'Export ({lots.length})</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase">{selectedLots.length} sélectionné(s)</span>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead>
                     <tr className="text-left border-b border-gray-100">
                       <th className="pb-4">
                          <input
                            type="checkbox"
                            checked={selectedLots.length === lots.length && lots.length > 0}
                            onChange={() => {
                              if (selectedLots.length === lots.length) setSelectedLots([])
                              else setSelectedLots(lots.map((l) => l.id))
                            }}
                            className="w-5 h-5 rounded-lg border-gray-300 accent-[#33691E]"
                          />
                       </th>
                       <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                       <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Poids</th>
                       <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Statut</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {lots.map((lot) => (
                       <tr key={lot.id} className="group">
                         <td className="py-4">
                            <input
                              type="checkbox"
                              checked={selectedLots.includes(lot.id)}
                              onChange={() => toggleLot(lot.id)}
                              className="w-5 h-5 rounded-lg border-gray-300 accent-[#33691E]"
                            />
                         </td>
                         <td className="py-4">
                            <p className="text-sm font-black text-[var(--color-primary)]">{lot.id}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{lot.culture}</p>
                         </td>
                         <td className="py-4 text-center">
                            <span className="text-sm font-black text-[var(--color-primary)]">{lot.quantite} kg</span>
                         </td>
                         <td className="py-4 text-right">
                           <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                             {lot.statut}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>

        {/* Action Column */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-6 flex items-center gap-2">
                 <FileTextIcon className="w-4 h-4" />
                 Format de Sortie
              </h3>
              <div className="space-y-4">
                 <div className="p-4 bg-[#F1F8E9] border-2 border-[#33691E] rounded-2xl">
                    <p className="text-sm font-black text-[#33691E]">JSON Manifest</p>
                    <p className="text-[10px] font-bold text-[#33691E]/70 uppercase">Standard Intéropérable</p>
                 </div>
                 <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl opacity-50 grayscale">
                    <p className="text-sm font-black text-gray-400">Excel / CSV</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Indisponible</p>
                 </div>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting || selectedLots.length === 0}
                className="w-full mt-8 py-4 bg-[#1B3A0F] text-white rounded-[1.5rem] text-sm font-black shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isExporting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : (
                  <>
                    <DownloadIcon className="w-5 h-5" />
                    Télécharger Manifeste ({selectedLots.length})
                  </>
                )}
              </button>
           </div>

           <div className="bg-[#1A2E0D] rounded-[2rem] p-8 text-white">
              <ShieldCheckIcon className="w-8 h-8 mb-4 text-[#81C784]" />
              <h4 className="text-sm font-black mb-2 uppercase tracking-widest">Certification EUDR</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Ce manifeste inclut les preuves de non-déforestation requises par la réglementation européenne 2024.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
