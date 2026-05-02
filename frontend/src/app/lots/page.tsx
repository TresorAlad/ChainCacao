'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CubeIcon, EyeIcon, FunnelIcon } from '@heroicons/react/24/outline'
import api, { Batch } from '@/lib/api'
import type { DashboardStats } from '@/lib/dashboard-stats'
import toast from 'react-hot-toast'

export default function LotsPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [lots, setLots] = useState<Batch[]>([])
  const [batchIdsInput, setBatchIdsInput] = useState('')
  const [loadingLots, setLoadingLots] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (isAuthenticated) {
      api
        .get<{ success: boolean; stats: DashboardStats }>('/dashboard/stats')
        .then((res) => setStats(res.data.stats || {}))
        .catch(() => setStats({}))
    }
  }, [isAuthenticated])

  const loadLotsFromIds = async () => {
    const ids = batchIdsInput.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
    if (ids.length === 0) {
      toast.error('Saisissez au moins un identifiant de lot')
      return
    }
    setLoadingLots(true)
    const loaded: Batch[] = []
    for (const id of ids) {
      try {
        const res = await api.get<Batch>(`/lot/${id}`)
        loaded.push(res.data)
      } catch {
        toast.error(`Lot introuvable : ${id}`)
      }
    }
    setLots(loaded)
    setLoadingLots(false)
    if (loaded.length > 0) {
      toast.success(`${loaded.length} lot(s) chargé(s)`)
    }
  }

  const filteredLots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return lots
    return lots.filter(
      (lot) =>
        lot.id.toLowerCase().includes(q) ||
        lot.culture?.toLowerCase().includes(q) ||
        lot.variete?.toLowerCase().includes(q) ||
        lot.lieu?.toLowerCase().includes(q) ||
        lot.region?.toLowerCase().includes(q) ||
        lot.village?.toLowerCase().includes(q)
    )
  }, [lots, searchQuery])

  const badgeClass = (statut?: string) => {
    const s = (statut || '').toLowerCase()
    if (s.includes('transit')) return 'bg-yellow-100 text-yellow-800'
    if (s.includes('export')) return 'bg-green-100 text-green-800'
    if (s.includes('stock')) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
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
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">
              Mes Lots
            </h1>
            <p className="text-[var(--color-muted)] mt-2">
              Chargez les lots par identifiant (l&apos;API ne fournit pas de liste globale).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/nouveau-lot" className="btn btn-primary flex items-center gap-2">
              <CubeIcon className="w-5 h-5" />
              Nouveau Lot
            </Link>
          </div>
        </div>
      </header>

      <div className="grid-cols-stats grid gap-6 mb-8">
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-[var(--color-muted)] font-medium">Total des lots</p>
              <p className="text-3xl font-bold text-[var(--color-primary)] mt-2">
                {stats ? String(stats.total_batches ?? stats.total_lots ?? '—') : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CubeIcon className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </div>
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-[var(--color-muted)] font-medium">En transit</p>
              <p className="text-3xl font-bold text-[var(--color-warning)] mt-2">
                {stats ? String(stats.en_transit ?? '—') : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--color-warning)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CubeIcon className="w-6 h-6 text-[var(--color-warning)]" />
            </div>
          </div>
        </div>
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-[var(--color-muted)] font-medium">Exportés</p>
              <p className="text-3xl font-bold text-[var(--color-info)] mt-2">
                {stats ? String(stats.exportes ?? '—') : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--color-info)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CubeIcon className="w-6 h-6 text-[var(--color-info)]" />
            </div>
          </div>
        </div>
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-[var(--color-muted)] font-medium">Conformes EUDR</p>
              <p className="text-3xl font-bold text-[var(--color-success)] mt-2">
                {stats ? String(stats.eudr_conformes ?? '—') : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="card group mb-6">
        <div className="card-header border-b border-[var(--color-border)]/50">
          <h2 className="text-title-lg font-semibold text-[var(--color-primary)]">
            Charger des lots
          </h2>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Identifiants de lots (virgule, point-virgule ou ligne)</label>
            <textarea
              className="form-input font-mono text-sm"
              rows={3}
              value={batchIdsInput}
              onChange={(e) => setBatchIdsInput(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={loadLotsFromIds}
            disabled={loadingLots || !batchIdsInput.trim()}
            className="btn btn-secondary"
          >
            {loadingLots ? 'Chargement…' : 'Charger depuis l’API'}
          </button>
        </div>
      </div>

      <div className="card group">
        <div className="card-header border-b border-[var(--color-border)]/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-title-lg font-semibold text-[var(--color-primary)]">
              Liste des lots chargés ({filteredLots.length})
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filtrer la liste chargée…"
                  className="form-input pl-10 w-56 md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button type="button" className="btn btn-secondary-outline btn-sm flex items-center gap-2" disabled>
                <FunnelIcon className="w-4 h-4" />
                Filtres avancés
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">ID Lot</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Culture & variété</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Quantité</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Origine</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Statut</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">EUDR</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[var(--color-muted)]">
                      {lots.length === 0
                        ? 'Aucun lot chargé. Saisissez des identifiants ci-dessus puis cliquez sur « Charger depuis l’API ».'
                        : 'Aucun lot ne correspond au filtre.'}
                    </td>
                  </tr>
                ) : (
                  filteredLots.map((lot) => (
                    <tr
                      key={lot.id}
                      className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg)]/50 transition-all"
                    >
                      <td className="px-6 py-4 font-medium text-[var(--color-primary)]">{lot.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[var(--color-earth)]">{lot.culture}</p>
                          <p className="text-body-sm text-[var(--color-muted)]">{lot.variete}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-[var(--color-earth)]">{lot.quantite} kg</span>
                        <br />
                        <span className="text-caption text-[var(--color-muted)]">
                          Récolte : {lot.date_recolte || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[var(--color-earth)]">{lot.lieu || '—'}</p>
                        <p className="text-body-sm text-[var(--color-muted)]">
                          {[lot.region, lot.village].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${badgeClass(lot.statut)}`}>
                          {lot.statut || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {lot.eudr_conforme ? (
                          <span className="badge badge-success">Conforme</span>
                        ) : (
                          <span className="badge badge-error">Non conforme</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/lot-detail?id=${encodeURIComponent(lot.id)}`} className="btn btn-secondary-outline btn-sm flex items-center gap-1 w-fit">
                          <EyeIcon className="w-4 h-4" />
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
