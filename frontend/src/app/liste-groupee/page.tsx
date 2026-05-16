'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import api, { type Batch } from '@/lib/api'
import { getApiBaseUrl } from '@/lib/api-base'
import { RectangleStackIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

function generateListId() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const r = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `LIST-${y}${m}${day}-${r}`
}

export default function ListeGroupeePage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const [lots, setLots] = useState<Batch[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [lotsLoading, setLotsLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [lastListId, setLastListId] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [history, setHistory] = useState<{ list_id: string; batch_ids: string[] }[]>([])

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    if (user?.role !== 'cooperative' && user?.role !== 'admin') return
    setLotsLoading(true)
    api
      .get<{ success: boolean; lots: Batch[] }>('/actors/me/lots')
      .then((res) => setLots(res.data.lots || []))
      .catch(() => setLots([]))
      .finally(() => setLotsLoading(false))
  }, [isAuthenticated, user])

  const toggleLot = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const createGroupedList = async () => {
    if (selected.size < 2) {
      toast.error('Sélectionnez au moins 2 lots')
      return
    }
    const listId = generateListId()
    setCreating(true)
    try {
      const res = await api.post<{ success: boolean; list_id: string; tx_hash?: string }>('/liste-groupee', {
        list_id: listId,
        batch_ids: Array.from(selected),
      })
      const id = res.data.list_id || listId
      setLastListId(id)
      setHistory((h) => [{ list_id: id, batch_ids: Array.from(selected) }, ...h])
      setQrUrl(`${getApiBaseUrl()}/qrcode/${encodeURIComponent(id)}?format=png`)
      setSelected(new Set())
      toast.success('Liste groupée créée sur la blockchain')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Échec de création')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#33691E] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || (user?.role !== 'cooperative' && user?.role !== 'admin')) return null

  return (
    <RoleLayout role="cooperative">
      <div className="w-full py-6 sm:py-8 max-w-5xl mx-auto">
        <header className="page-header mb-6 sm:mb-10">
          <h1 className="page-heading-row">
            <RectangleStackIcon className="page-heading-icon" />
            Liste groupée
          </h1>
          <p className="page-subtitle">
            Regroupez plusieurs lots reçus en une liste unique avec QR code (CDC §7.2).
          </p>
        </header>

        <div className="card-panel mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
            <h2 className="text-lg font-black text-[var(--color-primary)]">Lots en ma possession</h2>
            <button
              type="button"
              onClick={createGroupedList}
              disabled={creating || selected.size < 2}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#33691E] text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:brightness-110"
            >
              {creating ? 'Création…' : `Créer liste (${selected.size})`}
            </button>
          </div>
          {lotsLoading ? (
            <p className="text-center py-8 text-gray-400">Chargement…</p>
          ) : lots.length === 0 ? (
            <p className="text-center py-8 text-gray-400">Aucun lot disponible.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {lots.map((lot) => (
                <label
                  key={lot.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    selected.has(lot.id) ? 'border-[#33691E] bg-[#F1F8E9]' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(lot.id)}
                    onChange={() => toggleLot(lot.id)}
                    className="w-5 h-5 rounded border-gray-300 text-[#33691E]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-sm text-[#1B5E20]">{lot.id}</p>
                    <p className="text-xs text-gray-500">
                      {lot.culture} · {lot.quantite} kg · {lot.statut || '—'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {lastListId && (
          <div className="card-panel border-[#C8E6C9] mb-6 sm:mb-8">
            <h2 className="text-lg font-black text-[var(--color-primary)] mb-4 flex items-center gap-2">
              <QrCodeIcon className="w-6 h-6 text-[#33691E]" />
              QR liste créée
            </h2>
            <p className="font-mono text-sm font-bold text-[#33691E] mb-4 break-all">{lastListId}</p>
            {qrUrl && (
              <img
                src={qrUrl}
                alt={`QR ${lastListId}`}
                className="w-48 h-48 mx-auto border rounded-xl bg-white p-2"
              />
            )}
            <a
              href={`/paiement-liste?list=${encodeURIComponent(lastListId)}`}
              className="mt-4 block w-full py-3 text-center bg-[#33691E] text-white rounded-xl text-sm font-bold hover:brightness-110"
            >
              Payer cette liste groupée
            </a>
            <p className="text-xs text-center text-gray-500 mt-4">
              Menu <strong>Payer liste groupée</strong> avec l&apos;identifiant <strong>LIST-…</strong> (pas un lot{' '}
              <strong>TC-…</strong> sur Paiement lot).
            </p>
          </div>
        )}

        {history.length > 0 && (
          <div className="card-panel">
            <h2 className="text-lg font-black text-[var(--color-primary)] mb-4">Historique session</h2>
            <ul className="space-y-3">
              {history.map((item) => (
                <li key={item.list_id} className="p-4 rounded-xl bg-gray-50">
                  <p className="font-mono font-bold text-sm break-all">{item.list_id}</p>
                  <p className="text-xs text-gray-500 mt-1 break-words">{item.batch_ids.length} lots · {item.batch_ids.join(', ')}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </RoleLayout>
  )
}
