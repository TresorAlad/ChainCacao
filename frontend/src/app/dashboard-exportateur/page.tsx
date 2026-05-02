'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { KPICard, Badge, Button } from '@/components/ui'
import { getRoleTheme } from '@/lib/role-themes'
import {
  GlobeAmericasIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function ExportateurDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('exportateur')

  const [stats, setStats] = useState({
    totalShipments: 15,
    inTransit: 8,
    completed: 7,
    revenue: 2450000
  })

  const [recentActivities] = useState([
    { id: 'EXP-2026-001', destination: 'Europe', status: 'in-transit', date: '2026-05-01' },
    { id: 'EXP-2026-002', destination: 'Asie', status: 'completed', date: '2026-04-28' },
    { id: 'EXP-2026-003', destination: 'Amérique', status: 'preparation', date: '2026-04-30' }
  ])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div style={{ backgroundColor: theme.surface, minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-current border-t-transparent" style={{ color: theme.primary }}></div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'exportateur') return null

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'in-transit':
        return <TruckIcon className="w-5 h-5" style={{ color: theme.accent }} />
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5" style={{ color: theme.secondary }} />
      case 'preparation':
        return <ClockIcon className="w-5 h-5" style={{ color: '#FF9800' }} />
      default:
        return <GlobeAmericasIcon className="w-5 h-5" style={{ color: theme.text.muted }} />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-transit':
        return <Badge variant="warning" role="exportateur">EN TRANSIT</Badge>
      case 'completed':
        return <Badge variant="success" role="exportateur">LIVRÉ</Badge>
      case 'preparation':
        return <Badge variant="info" role="exportateur">EN PRÉPARATION</Badge>
      default:
        return <Badge variant="info" role="exportateur">{status.toUpperCase()}</Badge>
    }
  }

  return (
    <RoleLayout role="exportateur">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
              Bonjour, Exportateur
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.text.secondary }}>
              Période: Octobre 2023 – Mars 2024
            </p>
          </div>
          <Button variant="primary" role="exportateur">
            + Nouvelle Exportation
          </Button>
        </header>

        {/* Alert Banner */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            color: 'white'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Nouvelle Exportation</h3>
              <p className="text-white/80 text-sm mb-4">
                Préparez votre prochaine expédition avec nos outils de traçabilité intégrés.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span>EN LIGNE</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span>Expéditions: {stats.totalShipments}</span>
                  <span>En transit: {stats.inTransit}</span>
                  <span>Complétées: {stats.completed}</span>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              role="exportateur"
              className="bg-white text-gray-900 hover:bg-gray-50"
            >
              Démarrer maintenant →
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Expéditions totales"
            value={stats.totalShipments.toString()}
            icon={<GlobeAmericasIcon className="w-6 h-6" />}
            role="exportateur"
          />

          <KPICard
            title="En transit"
            value={stats.inTransit.toString()}
            icon={<TruckIcon className="w-6 h-6" />}
            color={theme.accent}
            role="exportateur"
          />

          <KPICard
            title="Complétées"
            value={stats.completed.toString()}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color={theme.secondary}
            role="exportateur"
          />

          <KPICard
            title="Chiffre d'affaires"
            value={`${(stats.revenue / 1000000).toFixed(1)}M €`}
            icon={<CurrencyDollarIcon className="w-6 h-6" />}
            color="#F59E0B"
            role="exportateur"
          />
        </div>

        {/* World Map Placeholder */}
        <div
          className="rounded-xl p-6 mb-8 h-96 flex items-center justify-center"
          style={{
            backgroundColor: theme.card.background,
            boxShadow: theme.card.shadow,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          }}
        >
          <div className="text-center">
            <GlobeAmericasIcon className="w-16 h-16 mx-auto mb-4 text-white/50" />
            <h3 className="text-xl font-semibold text-white mb-2">Carte des Destinations</h3>
            <p className="text-white/70">Visualisez vos exportations mondiales en temps réel</p>
          </div>
        </div>

        {/* Recent Activities */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}
        >
          <div className="p-6 border-b" style={{ borderColor: theme.card.border }}>
            <h2 className="text-xl font-bold" style={{ color: theme.primary }}>
              Activités Récentes
            </h2>
          </div>

          <div className="divide-y" style={{ borderColor: theme.card.border }}>
            {recentActivities.map((activity, index) => (
              <div key={index} className="p-6 flex items-center justify-between hover:opacity-75 transition-opacity">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.primary }}>
                      {activity.id}
                    </p>
                    <p className="text-sm" style={{ color: theme.text.secondary }}>
                      Destination: {activity.destination}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm" style={{ color: theme.text.muted }}>
                    {activity.date}
                  </span>
                  {getStatusBadge(activity.status)}
                  <button className="p-1 rounded hover:bg-gray-100" style={{ color: theme.text.muted }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}