'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RoleLayout } from '@/components/RoleLayout'
import api, { type Batch } from '@/lib/api'
import { fetchGroupedListQrDataUrl } from '@/lib/grouped-list-qr'
import { loadGroupedListSession, saveGroupedListSession } from '@/lib/grouped-list-session'
import {
  groupedListPartialSuccessMessage,
  isGroupedListPartialSuccess,
} from '@/lib/grouped-list-error'
import { canIncludeInGroupedList } from '@/lib/lot-workflow'
import { RectangleStackIcon, QrCodeIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
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
  const [createFeedback, setCreateFeedback] = useState<{ type: 'error' | 'info'; text: string } | null>(null)
  const [lastListId, setLastListId] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [history, setHistory] = useState<{ list_id: string; batch_ids: string[] }[]>([])
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = loadGroupedListSession()
    if (saved.last) {
      setLastListId(saved.last.list_id)
      setHistory(saved.history.map((h) => ({ list_id: h.list_id, batch_ids: h.batch_ids })))
      void fetchGroupedListQrDataUrl(saved.last.list_id).then(setQrUrl)
    }
  }, [])

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const copyListId = useCallback(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id)
      toast.success('Identifiant copié')
    } catch {
      toast.error('Copie impossible — sélectionnez le texte manuellement')
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    if (user?.role !== 'cooperative' && user?.role !== 'admin') return
    setLotsLoading(true)
    api
      .get<{ success: boolean; lots: Batch[] }>('/actors/me/lots')
      .then((res) =>
        setLots((res.data.lots || []).filter((lot) => canIncludeInGroupedList(lot.statut)))
      )
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
      const msg = 'Sélectionnez au moins 2 lots'
      setCreateFeedback({ type: 'error', text: msg })
      toast.error(msg)
      return
    }
    const listId = generateListId()
    const batchIds = Array.from(selected)
    setCreating(true)
    setCreateFeedback({ type: 'info', text: 'Création en cours sur le serveur (blockchain)…' })
    const applySuccess = async (id: string, toastMsg: string) => {
      setLastListId(id)
      const entry = { list_id: id, batch_ids: batchIds, created_at: new Date().toISOString() }
      saveGroupedListSession(entry)
      setHistory((h) => [{ list_id: id, batch_ids: batchIds }, ...h.filter((x) => x.list_id !== id)])
      setSelected(new Set())
      setCreateFeedback(null)
      toast.success(toastMsg, { duration: 8000 })
      try {
        setQrUrl(await fetchGroupedListQrDataUrl(id))
      } catch {
        setQrUrl(null)
      }
      requestAnimationFrame(() => {
        successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
    try {
      const res = await api.post<{ success: boolean; list_id: string; tx_hash?: string }>('/liste-groupee', {
        list_id: listId,
        batch_ids: batchIds,
      })
      const id = res.data.list_id || listId
      await applySuccess(id, `Liste créée : ${id}`)
    } catch (err: unknown) {
      if (isGroupedListPartialSuccess(err)) {
        await applySuccess(listId, groupedListPartialSuccessMessage(listId))
        return
      }
      const msg = err instanceof Error ? err.message : 'Échec de création'
      setCreateFeedback({ type: 'error', text: msg })
      toast.error(msg)
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

        {createFeedback && (
          <div
            role="alert"
            className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
              createFeedback.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}
          >
            {createFeedback.text}
          </div>
        )}

        {lastListId && (
          <div
            ref={successRef}
            className="card-panel border-2 border-[#33691E] bg-[#F1F8E9] mb-6 sm:mb-8 shadow-md"
          >
            <h2 className="text-lg font-black text-[var(--color-primary)] mb-2 flex items-center gap-2">
              <QrCodeIcon className="w-6 h-6 text-[#33691E]" />
              Liste créée — conservez cet identifiant
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Utilisez cet identifiant <strong>LIST-…</strong> ou le QR pour le paiement.
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <p className="font-mono text-base sm:text-lg font-bold text-[#1B5E20] break-all flex-1 min-w-[200px]">
                {lastListId}
              </p>
              <button
                type="button"
                onClick={() => void copyListId(lastListId)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#33691E] text-[#33691E] text-sm font-bold hover:bg-white"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
                Copier
              </button>
            </div>
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`QR ${lastListId}`}
                className="w-52 h-52 mx-auto border rounded-xl bg-white p-2 mb-4"
              />
            ) : (
              <p className="text-center text-sm text-amber-800 mb-4">QR en chargement…</p>
            )}
            <Link
              href={`/paiement-liste?list=${encodeURIComponent(lastListId)}`}
              className="block w-full py-3.5 text-center bg-[#33691E] text-white rounded-xl text-sm font-bold hover:brightness-110"
            >
              Payer cette liste groupée
            </Link>
          </div>
        )}

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
            <p className="text-center py-8 text-gray-400">
              Aucun lot éligible. Confirmez d’abord la réception des lots en transit, puis revenez ici (minimum 2
              lots au statut reçu).
            </p>
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


        {history.length > 0 && (
          <div className="card-panel">
            <h2 className="text-lg font-black text-[var(--color-primary)] mb-4">Historique session</h2>
            <ul className="space-y-3">
              {history.map((item) => (
                <li key={item.list_id} className="p-4 rounded-xl bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-mono font-bold text-sm break-all">{item.list_id}</p>
                    <p className="text-xs text-gray-500 mt-1 break-words">
                      {item.batch_ids.length} lots · {item.batch_ids.join(', ')}
                    </p>
                  </div>
                  <Link
                    href={`/paiement-liste?list=${encodeURIComponent(item.list_id)}`}
                    className="text-sm font-bold text-[#33691E] hover:underline shrink-0"
                  >
                    Payer →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </RoleLayout>
  )
}
