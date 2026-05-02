'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { CloudArrowUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/error-utils'

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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Erreur lors de la synchronisation'))
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
    <div className="w-full py-6 sm:py-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
            Synchronisation Ledger
          </h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Téléversement et minage massif de données collectées hors-ligne.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-[var(--color-border)]">
             <h2 className="text-2xl font-black text-[var(--color-primary)] mb-6">Source de Données (JSON)</h2>
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payload de Lots</label>
                  <textarea
                    className="w-full px-6 py-4 bg-gray-50 border border-[var(--color-border)] rounded-2xl text-sm font-mono text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all placeholder:text-gray-300"
                    rows={12}
                    placeholder="[ { 'id': 'LOT1', ... }, ... ]"
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                  />
                  <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed p-2">
                    Le tableau doit respecter le schéma de validation blockchain (culture, variete, quantite, geoloc).
                  </p>
                </div>
                
                <button
                  onClick={handleSync}
                  disabled={isSyncing || !jsonInput.trim()}
                  className="w-full py-4 bg-[#1B3A0F] text-white rounded-[1.5rem] text-sm font-black shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSyncing ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : (
                    <>
                      <CloudArrowUpIcon className="w-5 h-5" />
                      Lancer la Synchronisation
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-5 space-y-8">
           {results.length > 0 ? (
             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-6">Journal d'Opération</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                   {results.map((r, idx) => (
                     <div key={idx} className={`p-4 rounded-2xl border ${r.error ? 'bg-red-50 border-red-100' : 'bg-[#F1F8E9] border-[#33691E]/10'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest">Lot #{r.index + 1}</span>
                           <span className={`text-[10px] font-black uppercase ${r.error ? 'text-red-600' : 'text-[#2E7D32]'}`}>
                              {r.error ? 'Échec' : 'Succès'}
                           </span>
                        </div>
                        {r.lot_id && <p className="text-xs font-bold text-[var(--color-primary)]">ID: {r.lot_id}</p>}
                        {r.tx_hash && <p className="text-[10px] font-mono text-gray-400 truncate">TX: {r.tx_hash}</p>}
                        {r.error && <p className="text-xs font-bold text-red-600 mt-1">{r.error}</p>}
                     </div>
                   ))}
                </div>
             </div>
           ) : (
             <div className="bg-[#FAFDF7] rounded-[2rem] p-10 border border-[#33691E]/10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6">
                   <ArrowPathIcon className="w-10 h-10 text-[#33691E]" />
                </div>
                <h3 className="text-xl font-black text-[var(--color-primary)] mb-4">Prêt pour Sync</h3>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                   En attente de données. Collez votre export JSON pour commencer le traitement blockchain.
                </p>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
