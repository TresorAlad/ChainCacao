'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { KPICard, Badge, Button } from '@/components/ui'
import { getRoleTheme } from '@/lib/role-themes'
import {
  HomeIcon,
  BanknotesIcon,
  BeakerIcon,
  UserCircleIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function AgriculteurDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('agriculteur')

  const [stats, setStats] = useState({
    productionTotale: 1000,
    revenusEstimés: 200000,
    objectifAnnuel: 67,
    parcelles: 12
  })

  const [recentLots] = useState([
    { id: 'LOT-001', product: 'Cacao Arabica', weight: 150, status: 'termine', date: '2026-05-01' },
    { id: 'LOT-002', product: 'Cacao Robusta', weight: 200, status: 'fermentation', date: '2026-04-28' },
    { id: 'LOT-003', product: 'Cacao Forastero', weight: 180, status: 'en_attente', date: '2026-04-25' }
  ])

  const [revenueData] = useState([
    { month: 'Jan', value: 15000 },
    { month: 'Fév', value: 18000 },
    { month: 'Mar', value: 22000 },
    { month: 'Avr', value: 25000 },
    { month: 'Mai', value: 28000 },
    { month: 'Jun', value: 32000 }
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

  if (!isAuthenticated || user?.role !== 'agriculteur') return null

  const getLotStatusIcon = (status: string) => {
    switch (status) {
      case 'termine':
        return <CheckCircleIcon className="w-5 h-5" style={{ color: theme.secondary }} />
      case 'fermentation':
        return <ClockIcon className="w-5 h-5" style={{ color: '#FF9800' }} />
      case 'en_attente':
        return <ClockIcon className="w-5 h-5" style={{ color: theme.text.muted }} />
      default:
        return <BeakerIcon className="w-5 h-5" style={{ color: theme.text.muted }} />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'termine':
        return <Badge variant="success" role="agriculteur">TERMINÉ</Badge>
      case 'fermentation':
        return <Badge variant="warning" role="agriculteur">FERMENTATION</Badge>
      case 'en_attente':
        return <Badge variant="info" role="agriculteur">EN ATTENTE</Badge>
      default:
        return <Badge variant="info" role="agriculteur">{status.toUpperCase()}</Badge>
    }
  }

  const maxRevenue = Math.max(...revenueData.map(d => d.value))

  return (
    <RoleLayout role="agriculteur">
      <div className="max-w-7xl mx-auto">
        {/* Topbar */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
                Dashboard
              </h1>
              <span className="text-sm block mt-1" style={{ color: theme.text.secondary }}>
                Agriculteur
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg" style={{ backgroundColor: theme.surface, color: theme.text.secondary }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 rounded-lg" style={{ backgroundColor: theme.surface, color: theme.text.secondary }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 0112 21c7.962 0 12.21-7.962 7.498-14.004l-.5.866a16.93 16.93 0 001.5 13.138A17.925 17.925 0 0112 21c-7.962 0-12.21 7.962-7.498-14.004l.5-.866a16.93 16.93 0 01-1.5-13.138z" />
                </svg>
              </button>
              <button className="p-2 rounded-lg" style={{ backgroundColor: theme.surface, color: theme.text.secondary }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center ml-4">
                <span className="text-xs font-medium text-gray-700">K</span>
              </div>
            </div>
          </div>
        </header>

        {/* Period Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: theme.primary }}>
                Bonjour, Kofi
              </h2>
              <p className="text-sm mt-1" style={{ color: theme.text.secondary }}>
                Période sélectionnée
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.sidebar.border,
                  color: theme.text.primary
                }}
              >
                <option>Octobre 2023 – Mars 2024</option>
                <option>Avril 2024 – Septembre 2024</option>
                <option>Octobre 2024 – Mars 2025</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Production totale"
            value={`${stats.productionTotale} kg`}
            trend="+5%"
            icon={<BeakerIcon className="w-6 h-6" />}
            role="agriculteur"
          />

          <KPICard
            title="Revenus estimés"
            value={`${stats.revenusEstimés} FCFA`}
            trend="+16%"
            icon={<BanknotesIcon className="w-6 h-6" />}
            color="#F59E0B"
            role="agriculteur"
          />

          <KPICard
            title="Objectif annuel"
            value={`${stats.objectifAnnuel}%`}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color={theme.secondary}
            role="agriculteur"
          />

          <div className="rounded-xl p-6" style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: theme.text.muted }}>Parcelles</p>
                <p className="text-3xl font-bold mt-1" style={{ color: theme.primary }}>{stats.parcelles}</p>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.secondary + '20', color: theme.secondary }}
              >
                <MapPinIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold" style={{ color: theme.primary }}>
              Évolution des Revenus
            </h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm rounded-lg" style={{ backgroundColor: theme.secondary, color: 'white' }}>
                Mois
              </button>
              <button className="px-3 py-1 text-sm rounded-lg" style={{ backgroundColor: theme.surface, color: theme.text.secondary }}>
                Semaine
              </button>
            </div>
          </div>

          <div className="flex items-end space-x-4 h-48">
            {revenueData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${(data.value / maxRevenue) * 100}%`,
                    backgroundColor: theme.secondary,
                    minHeight: '20px'
                  }}
                ></div>
                <span className="text-xs mt-2" style={{ color: theme.text.muted }}>{data.month}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4 text-xs" style={{ color: theme.text.muted }}>
            <span>0 FCFA</span>
            <span>{maxRevenue.toLocaleString()} FCFA</span>
          </div>
        </div>

        {/* Recent Lots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div
            className="rounded-xl"
            style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}
          >
            <div className="p-6 border-b" style={{ borderColor: theme.card.border }}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" style={{ color: theme.primary }}>
                  Lots Récents
                </h3>
                <Button variant="outline" size="sm" role="agriculteur">
                  Voir tout
                </Button>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: theme.card.border }}>
              {recentLots.map((lot, index) => (
                <div key={index} className="p-6 flex items-center justify-between hover:opacity-75 transition-opacity">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getLotStatusIcon(lot.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: theme.primary }}>
                        {lot.product}
                      </p>
                      <p className="text-xs" style={{ color: theme.text.muted }}>
                        {lot.id} • {lot.weight} kg
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm" style={{ color: theme.text.muted }}>
                      {lot.date}
                    </span>
                    {getStatusBadge(lot.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Field View Card */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.primary }}>
              Vue des Parcelles
            </h3>

            <div
              className="h-48 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #8BC34A 0%, #4CAF50 100%)',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="text-center text-white">
                  <MapPinIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">12 Parcelles actives</p>
                  <p className="text-xs opacity-80">Traçabilité Blockchain : Actif</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: theme.text.secondary }}>Parcelle Nord</span>
                <span className="text-sm font-medium" style={{ color: theme.primary }}>Bio • 2.3 ha</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: theme.text.secondary }}>Parcelle Sud</span>
                <span className="text-sm font-medium" style={{ color: theme.primary }}>Conventionnel • 1.8 ha</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: theme.text.secondary }}>Parcelle Est</span>
                <span className="text-sm font-medium" style={{ color: theme.primary }}>Bio • 3.1 ha</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
          <Button variant="primary" size="lg" role="agriculteur" className="rounded-full w-14 h-14 p-0 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>
      </div>
    </RoleLayout>
  )
}