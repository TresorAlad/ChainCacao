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
        <h1 className="page-title">Tableau de Bord</h1>
        <p className="page-description">Vue d'ensemble de votre activité et de vos indicateurs clés</p>
      </header>

      {/* Stats Grid */}
      <div className="grid-cols-stats grid gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="stat-card animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value mt-1">{stat.value}</p>
                <div className={`stat-change ${stat.changePositive ? 'positive' : 'negative'}`}>
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                  <span>{stat.change} vs mois dernier</span>
                </div>
              </div>
              <div className={`stat-card-icon-bg-${['primary', 'secondary', 'accent', 'success'][index]} w-12 h-12 rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Évolution des lots</h2>
              <div className="flex gap-2">
                <button 
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    timeRange === 'week' 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-[var(--color-earth)]'
                  }`}
                  onClick={() => setTimeRange('week')}
                >
                  Semaine
                </button>
                <button 
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    timeRange === 'month' 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-[var(--color-earth)]'
                  }`}
                  onClick={() => setTimeRange('month')}
                >
                  Mois
                </button>
                <button 
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    timeRange === 'year' 
                      ? 'bg-[var(--color-primary)] text-white' 
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
            <div className="h-64 flex items-center justify-center bg-[var(--color-bg)] rounded-lg">
              <div className="text-center">
                <ChartBarIcon className="w-16 h-16 text-[var(--color-border)] mx-auto mb-4" />
                <p className="text-[var(--color-muted)]">Graphique en cours de chargement...</p>
                <p className="text-body-sm text-[var(--color-muted)] mt-1">Intégration des données de traçabilité en cours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="card-header">
            <h2 className="card-title">Actions Rapides</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 transition-all text-left">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <PlusIcon className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="text-body-sm font-medium text-[var(--color-primary)]">Nouveau Lot</p>
                  <p className="text-caption">Créer un lot agricole</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--color-secondary)]/10 hover:bg-[var(--color-secondary)]/20 transition-all text-left">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-secondary)]/10 flex items-center justify-center">
                  <ArrowRightLeftIcon className="w-5 h-5 text-[var(--color-secondary)]" />
                </div>
                <div>
                  <p className="text-body-sm font-medium text-[var(--color-secondary)]">Transférer</p>
                  <p className="text-caption">Effectuer un transfert</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 transition-all text-left">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                  <FileTextIcon className="w-5 h-5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-body-sm font-medium text-[var(--color-accent)]">Rapport EUDR</p>
                  <p className="text-caption">Générer un rapport</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--color-blockchain)]/10 hover:bg-[var(--color-blockchain)]/20 transition-all text-left">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-blockchain)]/10 flex items-center justify-center">
                  <QrCodeIcon className="w-5 h-5 text-[var(--color-blockchain)]" />
                </div>
                <div>
                  <p className="text-body-sm font-medium text-[var(--color-blockchain)]">QR Code</p>
                  <p className="text-caption">Générer un QR</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Lots */}
      <div className="card animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Lots Récents</h2>
            <button className="text-body-sm text-[var(--color-primary)] font-medium hover:underline">
              Voir tous
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID du Lot</th>
                  <th>Type</th>
                  <th>Quantité</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentLots.map((lot, index) => (
                  <tr key={lot.id} className="animate-fade-in" style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
                    <td className="font-medium text-[var(--color-primary)]">{lot.id}</td>
                    <td>{lot.type}</td>
                    <td>{lot.quantity}</td>
                     <td>
                       <span className={`badge ${badgeClass(lot.statusColor)}`}>
                         {lot.status}
                       </span>
                     </td>
                    <td className="text-[var(--color-muted)]">{lot.date}</td>
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
