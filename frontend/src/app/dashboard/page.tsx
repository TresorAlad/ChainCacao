'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  ChartBarIcon, 
  CubeIcon, 
  DocumentCheckIcon, 
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [timeRange, setTimeRange] = useState('week')

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const stats = [
    {
      label: 'Lots Actifs',
      value: '127',
      change: '+12%',
      changePositive: true,
      icon: CubeIcon,
    },
    {
      label: 'Transferts ce mois',
      value: '34',
      change: '+8%',
      changePositive: true,
      icon: TruckIcon,
    },
    {
      label: 'Certificats EUDR',
      value: '23',
      change: '+5%',
      changePositive: true,
      icon: DocumentCheckIcon,
    },
    {
      label: 'Conformité',
      value: '98.7%',
      change: '+2.1%',
      changePositive: true,
      icon: CheckCircleIcon,
    }
  ]

  const recentLots = [
    { id: 'LOT-2024-0892', type: 'Cacao Forastero', quantity: '2,500 kg', status: 'En Transit', statusColor: 'warning', date: '12 Mai 2026' },
    { id: 'LOT-2024-0891', type: 'Cacao Criollo', quantity: '1,800 kg', status: 'Exporté', statusColor: 'success', date: '11 Mai 2026' },
    { id: 'LOT-2024-0890', type: 'Cacao Trinitario', quantity: '3,200 kg', status: 'En Stock', statusColor: 'info', date: '10 Mai 2026' },
    { id: 'LOT-2024-0889', type: 'Cacao Forastero', quantity: '1,500 kg', status: 'En Inspection', statusColor: 'neutral', date: '09 Mai 2026' }
  ]

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

  const badgeClass = (statusColor: string) => {
    return statusColors[statusColor] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">
              Tableau de Bord
            </h1>
            <p className="text-[var(--color-muted)] mt-2">
              Vue d'ensemble de votre activité et de vos indicateurs clés
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse"></span>
              Synchronisé
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid-cols-stats grid gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="stat-card group hover:shadow-lg transition-all duration-300"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-[var(--color-muted)] font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-[var(--color-primary)] mt-2 group-hover:scale-105 transition-transform">
                  {stat.value}
                </p>
                <div className={`flex items-center gap-1 mt-3 text-sm ${
                  stat.changePositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                }`}>
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                  <span>{stat.change} vs mois dernier</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                index === 0 ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' :
                index === 1 ? 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]' :
                index === 2 ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' :
                'bg-[var(--color-success)]/10 text-[var(--color-success)]'
              }`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 card group">
          <div className="card-header border-b border-[var(--color-border)]/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-title-lg font-semibold text-[var(--color-primary)]">
                Évolution des lots
              </h2>
              <div className="flex gap-2">
                <button 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === 'week' 
                      ? 'bg-[var(--color-primary)] text-white shadow-md' 
                      : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-[var(--color-earth)]'
                  }`}
                  onClick={() => setTimeRange('week')}
                >
                  Semaine
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === 'month' 
                      ? 'bg-[var(--color-primary)] text-white shadow-md' 
                      : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-[var(--color-earth)]'
                  }`}
                  onClick={() => setTimeRange('month')}
                >
                  Mois
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === 'year' 
                      ? 'bg-[var(--color-primary)] text-white shadow-md' 
                      : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-[var(--color-earth)]'
                  }`}
                  onClick={() => setTimeRange('year')}
                >
                  Année
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="h-72 flex items-center justify-center bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-surface)] rounded-xl border border-dashed border-[var(--color-border)] group-hover:border-[var(--color-secondary)]/30 transition-all">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <ChartBarIcon className="w-10 h-10 text-[var(--color-primary)]" />
                </div>
                <p className="text-[var(--color-muted)] font-medium">Graphique en cours de chargement...</p>
                <p className="text-body-sm text-[var(--color-muted)] mt-2">Intégration des données de traçabilité en cours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card group">
          <div className="card-header border-b border-[var(--color-border)]/50">
            <h2 className="text-title-lg font-semibold text-[var(--color-primary)]">
              Actions Rapides
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)]/5 to-transparent hover:from-[var(--color-primary)]/10 transition-all text-left group/btn">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-[var(--color-primary)]">Nouveau Lot</p>
                  <p className="text-caption text-[var(--color-muted)]">Créer un lot agricole</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[var(--color-secondary)]/5 to-transparent hover:from-[var(--color-secondary)]/10 transition-all text-left group/btn">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-secondary)]/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-[var(--color-secondary)]">Transférer</p>
                  <p className="text-caption text-[var(--color-muted)]">Effectuer un transfert</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[var(--color-accent)]/5 to-transparent hover:from-[var(--color-accent)]/10 transition-all text-left group/btn">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-[var(--color-accent)]">Rapport EUDR</p>
                  <p className="text-caption text-[var(--color-muted)]">Générer un rapport</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[var(--color-blockchain)]/5 to-transparent hover:from-[var(--color-blockchain)]/10 transition-all text-left group/btn">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-blockchain)]/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <QrCodeIcon className="w-6 h-6 text-[var(--color-blockchain)]" />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-[var(--color-blockchain)]">QR Code</p>
                  <p className="text-caption text-[var(--color-muted)]">Générer un QR</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Lots */}
      <div className="card group">
        <div className="card-header border-b border-[var(--color-border)]/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-title-lg font-semibold text-[var(--color-primary)]">
              Lots Récents
            </h2>
            <button className="text-body-sm text-[var(--color-primary)] font-medium hover:underline flex items-center gap-1 group/btn">
              Voir tous
              <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">ID du Lot</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Type</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Quantité</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Statut</th>
                  <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentLots.map((lot, index) => (
                  <tr 
                    key={lot.id} 
                    className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg)]/50 transition-all"
                    style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                  >
                    <td className="px-6 py-4 font-medium text-[var(--color-primary)]">{lot.id}</td>
                    <td className="px-6 py-4 text-[var(--color-earth)]">{lot.type}</td>
                    <td className="px-6 py-4 text-[var(--color-earth)]">{lot.quantity}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${badgeClass(lot.statusColor)}`}>
                        {lot.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-muted)]">{lot.date}</td>
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

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  )
}

function ArrowRightLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  )
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}