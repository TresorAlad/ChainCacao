'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { KPICard, Badge, Button } from '@/components/ui'
import { getRoleTheme } from '@/lib/role-themes'
import {
  DocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function VerificateurDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('verificateur')

  const [stats, setStats] = useState({
    lotsVerifies: 136,
    conformes: 98,
    nonConformes: 24,
    scoreConformite: 72
  })

  const [recentVerifications] = useState([
    { id: 'LOT-001', producteur: 'Jean Dupont', date: '2026-05-01', status: 'conforme' },
    { id: 'LOT-002', producteur: 'Marie Claire', date: '2026-04-30', status: 'non-conforme' },
    { id: 'LOT-003', producteur: 'Pierre Martin', date: '2026-04-29', status: 'conforme' },
    { id: 'LOT-004', producteur: 'Sophie Leroy', date: '2026-04-28', status: 'en-cours' }
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

  if (!isAuthenticated || user?.role !== 'verificateur') return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'conforme':
        return <CheckCircleIcon className="w-5 h-5" style={{ color: theme.secondary }} />
      case 'non-conforme':
        return <XCircleIcon className="w-5 h-5" style={{ color: '#F44336' }} />
      case 'en-cours':
        return <ClockIcon className="w-5 h-5" style={{ color: '#FF9800' }} />
      default:
        return <ClockIcon className="w-5 h-5" style={{ color: theme.text.muted }} />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'conforme':
        return <Badge variant="success" role="verificateur">CONFORME</Badge>
      case 'non-conforme':
        return <Badge variant="error" role="verificateur">NON CONFORME</Badge>
      case 'en-cours':
        return <Badge variant="warning" role="verificateur">EN COURS</Badge>
      default:
        return <Badge variant="info" role="verificateur">{status.toUpperCase()}</Badge>
    }
  }

  return (
    <RoleLayout role="verificateur">
      <div className="max-w-7xl mx-auto">
        {/* Topbar */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
              Tableau de Bord
            </h1>
            <span className="text-sm" style={{ color: theme.text.secondary }}>
              Vérificateur
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg" style={{ backgroundColor: theme.surface, color: theme.text.secondary }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 0112 21c7.962 0 12.21-7.962 7.498-14.004l-.5.866a16.93 16.93 0 001.5 13.138A17.925 17.925 0 0112 21c-7.962 0-12.21 7.962-7.498 14.004l.5-.866a16.93 16.93 0 01-1.5-13.138z" />
              </svg>
            </button>
            <button className="p-2 rounded-lg" style={{ backgroundColor: theme.surface, color: theme.text.secondary }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">V</span>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un lot, producteur..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.sidebar.border,
                  color: theme.text.primary
                }}
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5" style={{ color: theme.text.muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Lots vérifiés"
            value={stats.lotsVerifies.toString()}
            icon={<DocumentCheckIcon className="w-6 h-6" />}
            role="verificateur"
          />

          <KPICard
            title="Conformes"
            value={stats.conformes.toString()}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color="#4CAF50"
            role="verificateur"
          />

          <KPICard
            title="Non conformes"
            value={stats.nonConformes.toString()}
            icon={<XCircleIcon className="w-6 h-6" />}
            color="#F44336"
            role="verificateur"
          />

          <div className="rounded-xl p-6" style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: theme.text.muted }}>Score conformité</p>
                <p className="text-3xl font-bold mt-1" style={{ color: theme.primary }}>{stats.scoreConformite}%</p>
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center relative"
                style={{ backgroundColor: theme.secondary + '20' }}
              >
                <svg className="w-8 h-8" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={theme.secondary + '40'}
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={theme.secondary}
                    strokeWidth="3"
                    strokeDasharray={`${stats.scoreConformite}, 100`}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Conseil Conformité */}
        <div
          className="rounded-xl p-6 mb-8 border-l-4"
          style={{
            backgroundColor: '#FFF8E1',
            borderColor: '#F59E0B',
            color: '#92400E'
          }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Conseil de conformité</h3>
              <p className="mt-1 text-sm">
                Les lots de café Arabica présentent actuellement un taux de conformité de 88%.
                Concentrez vos vérifications sur les critères de qualité et de traçabilité.
              </p>
              <div className="mt-3">
                <Button variant="primary" size="sm" role="verificateur">
                  Analyser les tendances →
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Liste Vérifications Récentes */}
        <div className="rounded-xl" style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}>
          <div className="p-6 border-b" style={{ borderColor: theme.card.border }}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold" style={{ color: theme.primary }}>
                Vérifications récentes
              </h2>
              <Button variant="outline" size="sm" role="verificateur">
                Voir tout
              </Button>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: theme.card.border }}>
            {recentVerifications.map((verification, index) => (
              <div key={index} className="p-6 flex items-center justify-between hover:opacity-75 transition-opacity">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(verification.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.primary }}>
                      {verification.id}
                    </p>
                    <p className="text-sm" style={{ color: theme.text.secondary }}>
                      {verification.producteur}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm" style={{ color: theme.text.muted }}>
                    {verification.date}
                  </span>
                  {getStatusBadge(verification.status)}
                  <button className="p-1 rounded" style={{ color: theme.text.muted }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
          <Button variant="primary" size="lg" role="verificateur" className="rounded-full w-14 h-14 p-0 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>
      </div>
    </RoleLayout>
  )
}