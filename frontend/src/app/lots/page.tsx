'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CubeIcon, EyeIcon, FunnelIcon } from '@heroicons/react/24/outline'

export default function LotsPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const statusColors: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
    'En Transit': 'bg-yellow-100 text-yellow-800',
    'Exporté': 'bg-green-100 text-green-800',
    'En Stock': 'bg-blue-100 text-blue-800',
    'En Inspection': 'bg-gray-100 text-gray-800'
  }

  const lots = [
    { id: 'LOT-2024-0892', type: 'Cacao Forastero', variety: 'Nacional', quantity: '2,500 kg', weight: '2.5 tonnes', harvestDate: '15 Mar 2026', farm: 'Finca La Esperanza', region: 'Huila, Colombie', status: 'En Transit', statusColor: 'warning', euDRCompliant: true },
    { id: 'LOT-2024-0891', type: 'Cacao Criollo', variety: 'Porcelana', quantity: '1,800 kg', weight: '1.8 tonnes', harvestDate: '22 Mar 2026', farm: 'Hacienda Cacao', region: 'Tabasco, Mexique', status: 'Exporté', statusColor: 'success', euDRCompliant: true },
    { id: 'LOT-2024-0890', type: 'Cacao Trinitario', variety: 'CCN-51', quantity: '3,200 kg', weight: '3.2 tonnes', harvestDate: '08 Apr 2026', farm: 'Coop Agri Nord', region: 'Sassandra, Côte d\'Ivoire', status: 'En Stock', statusColor: 'info', euDRCompliant: true },
    { id: 'LOT-2024-0889', type: 'Cacao Forastero', variety: 'Amelonado', quantity: '1,500 kg', weight: '1.5 tonnes', harvestDate: '30 Mar 2026', farm: 'Plantation Royale', region: 'Kumasi, Ghana', status: 'En Inspection', statusColor: 'neutral', euDRCompliant: false },
    { id: 'LOT-2024-0888', type: 'Cacao Criollo', variety: 'Chuao', quantity: '900 kg', weight: '0.9 tonnes', harvestDate: '12 Apr 2026', farm: 'Hacienda Carache', region: 'Aragua, Venezuela', status: 'En Stock', statusColor: 'info', euDRCompliant: true },
  ]

  const badgeClass = (statusColor: string) => {
    return statusColors[statusColor] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">
              Mes Lots
            </h1>
            <p className="text-[var(--color-muted)] mt-2">
              Liste de tous vos lots agricoles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/lots/new" className="btn btn-primary flex items-center gap-2">
              <CubeIcon className="w-5 h-5" />
              Nouveau Lot
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid-cols-stats grid gap-6 mb-8">
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-[var(--color-muted)] font-medium">Total des lots</p>
              <p className="text-3xl font-bold text-[var(--color-primary)] mt-2">6</p>
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
              <p className="text-3xl font-bold text-[var(--color-warning)] mt-2">1</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--color-warning)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CubeIcon className="w-6 h-6 text-[var(--color-warning)]" />
            </div>
          </div>
        </div>
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-[var(--color-muted)] font-medium">En stock</p>
              <p className="text-3xl font-bold text-[var(--color-info)] mt-2">2</p>
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
              <p className="text-3xl font-bold text-[var(--color-success)] mt-2">5/6</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Lots Table */}
      <div className="card group">
        <div className="card-header border-b border-[var(--color-border)]/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-title-lg font-semibold text-[var(--color-primary)]">
              Liste des lots
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="form-input pl-10 w-48"
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="btn btn-secondary-outline btn-sm flex items-center gap-2">
                <FunnelIcon className="w-4 h-4" />
                Filtrer
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
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Type & Variété</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Quantité</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Origine</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Statut</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">EUDR</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot, index) => (
                  <tr 
                    key={lot.id} 
                    className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg)]/50 transition-all"
                  >
                    <td className="px-6 py-4 font-medium text-[var(--color-primary)]">{lot.id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[var(--color-earth)]">{lot.type}</p>
                        <p className="text-body-sm text-[var(--color-muted)]">{lot.variety}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-[var(--color-earth)]">{lot.quantity}</span>
                      <br />
                      <span className="text-caption text-[var(--color-muted)]">{lot.weight}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[var(--color-earth)]">{lot.farm}</p>
                      <p className="text-body-sm text-[var(--color-muted)]">{lot.region}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${badgeClass(lot.statusColor)}`}>
                        {lot.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {lot.euDRCompliant ? (
                        <span className="badge badge-success">Conforme</span>
                      ) : (
                        <span className="badge badge-error">Non conforme</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href={`/lot-detail?id=${lot.id}`} className="btn btn-secondary-outline btn-sm flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          Voir
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}