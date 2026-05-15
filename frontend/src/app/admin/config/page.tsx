'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { AdminGate } from '@/components/AdminGate'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/error-utils'

export default function AdminConfigPage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const [jsonText, setJsonText] = useState('{}')
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return
    setFetching(true)
    api
      .get<{ success: boolean; config: Record<string, unknown> }>('/admin/config')
      .then((res) => {
        setJsonText(JSON.stringify(res.data.config || {}, null, 2))
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Chargement config impossible')))
      .finally(() => setFetching(false))
  }, [isAuthenticated, user])

  const handleSave = async () => {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>
    } catch {
      toast.error('JSON invalide')
      return
    }
    setSaving(true)
    try {
      await api.put('/admin/config', parsed)
      toast.success('Configuration enregistrée')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Enregistrement impossible'))
    } finally {
      setSaving(false)
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
      <div className="w-full py-6 sm:py-8 max-w-3xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[#33691E] mb-6 hover:underline">
          <ArrowLeftIcon className="w-4 h-4" />
          Retour administration
        </Link>

        <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">Configuration système</h1>
        <p className="text-[var(--color-muted)] mb-8">
          Paramètres globaux stockés côté serveur (seuils, feature flags, textes légaux, etc.).
        </p>

        <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)]">
          {fetching ? (
            <p className="text-center text-[var(--color-muted)] py-12">Chargement…</p>
          ) : (
            <>
              <textarea
                className="w-full min-h-[320px] font-mono text-sm form-input"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                spellCheck={false}
              />
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    try {
                      setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2))
                      toast.success('JSON formaté')
                    } catch {
                      toast.error('JSON invalide')
                    }
                  }}
                >
                  Formater
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminGate>
  )
}
