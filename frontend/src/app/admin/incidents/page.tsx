'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { AdminGate } from '@/components/AdminGate'
import api, { type AdminIncident } from '@/lib/api'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/error-utils'

export default function AdminIncidentsPage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const [incidents, setIncidents] = useState<AdminIncident[]>([])
  const [fetching, setFetching] = useState(true)

  const load = () => {
    setFetching(true)
    api
      .get<{ success: boolean; incidents: AdminIncident[] }>('/admin/incidents')
      .then((res) => setIncidents(res.data.incidents || []))
      .catch((err) => toast.error(getErrorMessage(err, 'Chargement impossible')))
      .finally(() => setFetching(false))
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') load()
  }, [isAuthenticated, user])

  const resolve = async (id: string) => {
    try {
      await api.post(`/admin/incidents/${id}/resolve`)
      toast.success('Incident résolu')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Résolution impossible'))
    }
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  return (
    <AdminGate role={user?.role}>
      <div className="w-full py-6 sm:py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[#33691E] mb-6 hover:underline">
          <ArrowLeftIcon className="w-4 h-4" />
          Retour administration
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">Incidents système</h1>
          <p className="text-[var(--color-muted)] mt-1">
            Erreurs remontées par l&apos;API (paiements, wallet, sync, etc.)
          </p>
        </header>

        <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
          {fetching ? (
            <p className="p-8 text-center text-[var(--color-muted)]">Chargement…</p>
          ) : incidents.length === 0 ? (
            <p className="p-12 text-center text-[var(--color-muted)] font-medium">Aucun incident ouvert.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {incidents.map((inc) => (
                <li key={inc.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-[var(--color-primary)] uppercase text-sm">{inc.type}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {inc.created_at ? new Date(inc.created_at).toLocaleString('fr-FR') : '—'} · {inc.id}
                      </p>
                      {inc.error && (
                        <p className="text-sm text-red-700 mt-2 font-medium">{inc.error}</p>
                      )}
                      {inc.payload && Object.keys(inc.payload).length > 0 && (
                        <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
                          {JSON.stringify(inc.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => resolve(inc.id)}
                      className="shrink-0 px-4 py-2 bg-[#33691E] text-white rounded-xl text-xs font-black"
                    >
                      Marquer résolu
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminGate>
  )
}
