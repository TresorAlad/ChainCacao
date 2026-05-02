'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { KPICard, Badge, Button } from '@/components/ui'
import { getRoleTheme } from '@/lib/role-themes'
import {
  ArchiveBoxIcon,
  CheckCircleIcon,
  EyeIcon,
  TruckIcon,
  UserGroupIcon,
  CubeIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'

export default function CooperativeDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('cooperative')

  const [stats, setStats] = useState({
    productionTotale: 1240,
    membresActifs: 482,
    lotsCollectes: 86,
    scoreQualite: 'A+'
  })

  const [collectedLots] = useState([
    { id: 'LOT-001', producer: 'Jean Dupont', product: 'Arabica Premium', weight: 150, quality: 'A+', status: 'validé' },
    { id: 'LOT-002', producer: 'Marie Claire', product: 'Robusta', weight: 200, quality: 'A', status: 'en_cours' },
    { id: 'LOT-003', producer: 'Pierre Martin', product: 'Arabica', weight: 180, quality: 'B', status: 'rejeté' }
  ])

  const [qualityData] = useState([
    { grade: 'A+', percentage: 75, count: 65, color: '#4CAF50' },
    { grade: 'A', percentage: 15, count: 13, color: '#8BC34A' },
    { grade: 'B', percentage: 8, count: 7, color: '#FFC107' },
    { grade: 'Rejeté', percentage: 2, count: 2, color: '#F44336' }
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

  if (!isAuthenticated || user?.role !== 'cooperative') return null

  const getQualityBadge = (grade: string) => {
    const colors = {
      'A+': { bg: '#E8F5E9', text: '#2D5016' },
      'A': { bg: '#F1F8E9', text: '#33691E' },
      'B': { bg: '#FFF8E1', text: '#F57F17' },
      'Rejeté': { bg: '#FFEBEE', text: '#B71C1C' }
    }
    const color = colors[grade as keyof typeof colors] || colors['A']

    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {grade}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validé':
        return <Badge variant="success" role="cooperative">VALIDÉ</Badge>
      case 'en_cours':
        return <Badge variant="warning" role="cooperative">EN COURS</Badge>
      case 'rejeté':
        return <Badge variant="error" role="cooperative">REJETÉ</Badge>
      default:
        return <Badge variant="info" role="cooperative">{status.toUpperCase()}</Badge>
    }
  }

  return (
    <RoleLayout role="cooperative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.primary }}>
              Coopérative Dashboard
            </h1>
            <p className="mt-1" style={{ color: theme.text.secondary }}>
              Coordination des agriculteurs et gestion des collectes
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" role="cooperative">
              Filtrer
            </Button>
            <Button variant="primary" role="cooperative">
              Enrôler agriculteur
            </Button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Production totale"
            value={`${stats.productionTotale} T`}
            trend="+15% ce mois"
            icon={<ScaleIcon className="w-6 h-6" />}
            role="cooperative"
          />

          <KPICard
            title="Membres actifs"
            value={stats.membresActifs.toString()}
            trend="+12 nouveaux"
            icon={<UserGroupIcon className="w-6 h-6" />}
            color="#2196F3"
            role="cooperative"
          />

          <KPICard
            title="Lots collectés"
            value={stats.lotsCollectes.toString()}
            trend="+8 cette semaine"
            icon={<ArchiveBoxIcon className="w-6 h-6" />}
            color={theme.accent}
            role="cooperative"
          />

          <div className="rounded-xl p-6" style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: theme.text.muted }}>Score qualité</p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#F59E0B' }}>{stats.scoreQualite}</p>
                <p className="text-sm font-medium mt-1" style={{ color: theme.secondary }}>Confirmé</p>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: '#F59E0B' }}
              >
                {stats.scoreQualite}
              </div>
            </div>
          </div>
        </div>

        {/* Quality Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}
          >
            <h3 className="text-lg font-semibold mb-6" style={{ color: theme.primary }}>
              Répartition de la qualité
            </h3>
            <div className="space-y-4">
              {qualityData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium" style={{ color: theme.text.primary }}>
                      {item.grade}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right" style={{ color: theme.text.secondary }}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}
          >
            <h3 className="text-lg font-semibold mb-6" style={{ color: theme.primary }}>
              Zones de collecte actives
            </h3>
            <div className="space-y-3">
              {[
                { region: 'Région Nord', lots: 34, status: 'active' },
                { region: 'Région Sud', lots: 28, status: 'active' },
                { region: 'Région Est', lots: 15, status: 'maintenance' },
                { region: 'Région Ouest', lots: 9, status: 'inactive' }
              ].map((region, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.surface }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.text.primary }}>{region.region}</p>
                    <p className="text-xs" style={{ color: theme.text.secondary }}>{region.lots} lots</p>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      region.status === 'active' ? 'bg-green-500' :
                      region.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collected Lots Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}
        >
          <div className="p-6 border-b" style={{ borderColor: theme.card.border }}>
            <h2 className="text-xl font-bold" style={{ color: theme.primary }}>
              Lots collectés
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: theme.surface }}>
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: theme.text.muted }}>
                    Producteur
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: theme.text.muted }}>
                    Produit
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: theme.text.muted }}>
                    Qualité
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: theme.text.muted }}>
                    Statut
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: theme.text.muted }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: theme.card.border }}>
                {collectedLots.map((lot, index) => (
                  <tr key={index} className="hover:opacity-75 transition-opacity">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-700">
                            {lot.producer.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: theme.text.primary }}>{lot.producer}</p>
                          <p className="text-xs" style={{ color: theme.text.muted }}>{lot.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium" style={{ color: theme.text.primary }}>{lot.product}</p>
                        <p className="text-xs" style={{ color: theme.text.muted }}>{lot.weight} kg</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getQualityBadge(lot.quality)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lot.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="p-1 rounded hover:bg-gray-100" style={{ color: theme.secondary }}>
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-100" style={{ color: theme.text.muted }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t" style={{ borderColor: theme.card.border }}>
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: theme.text.muted }}>
                Affichage de 1 à 3 sur 86 lots
              </p>
              <div className="flex space-x-1">
                {[1, 2, 3, '...', 12].map((page, index) => (
                  <button
                    key={index}
                    className={`px-3 py-1 rounded text-sm ${
                      page === 1 ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}