'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { KPICard, Badge, Button } from '@/components/ui'
import { getRoleTheme } from '@/lib/role-themes'
import api from '@/lib/api'
import type { DashboardStats } from '@/lib/dashboard-stats'
import {
  CubeIcon,
  DocumentCheckIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  CpuChipIcon,
  SignalIcon,
  ServerStackIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function AdminDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('admin')

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsNote, setStatsNote] = useState<string | null>(null)
  const [recentTransfers, setRecentTransfers] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [blockchainStats, setBlockchainStats] = useState<any>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      // Fetch general stats
      api
        .get<{ success: boolean; stats: DashboardStats }>('/dashboard/stats')
        .then((res) => {
          setStats(res.data.stats || {})
        })
        .catch((err: Error & { status?: number }) => {
          setStats({})
          const msg = err.message || ''
          const forbidden =
            err.status === 403 ||
            msg.includes('403') ||
            msg.toLowerCase().includes('interdit') ||
            msg.toLowerCase().includes('forbidden')
          if (forbidden) {
            setStatsNote(
              'Les statistiques agrégées sont réservées aux administrateurs. Les autres fonctionnalités (lots, transferts, etc.) restent disponibles selon votre rôle.'
            )
          } else {
            setStatsNote(msg || 'Impossible de charger les statistiques.')
          }
        })
        .finally(() => setStatsLoading(false))

      // Fetch recent transfers
      api.get<{ success: boolean; transfers: any[] }>('/dashboard/recent-transfers')
        .then((res) => setRecentTransfers(res.data.transfers || []))
        .catch(() => setRecentTransfers([]))

      // Fetch activity chart data
      api.get<{ success: boolean; activity: any[] }>('/dashboard/activity-chart')
        .then((res) => setChartData(res.data.activity || []))
        .catch(() => setChartData([]))

      // Mock blockchain stats for now
      setBlockchainStats({
        nodes: 5,
        totalNodes: 5,
        latency: '0.1s',
        blocks: 480017,
        successRate: 99.8
      })
    }
  }, [isAuthenticated, user])

  if (loading) {
    return (
      <div style={{ backgroundColor: theme.surface, minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-current border-t-transparent" style={{ color: theme.primary }}></div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALIDÉ':
        return <Badge variant="success" role="admin">VALIDÉ</Badge>
      case 'EN_TRANSIT':
        return <Badge variant="warning" role="admin">EN TRANSIT</Badge>
      case 'REJETÉ':
        return <Badge variant="error" role="admin">REJETÉ</Badge>
      default:
        return <Badge variant="info" role="admin">{status}</Badge>
    }
  }

  return (
    <RoleLayout role="admin">
      <div className="max-w-7xl mx-auto">
        {statsNote && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {statsNote}
          </div>
        )}

        {/* Page Header */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold" style={{ color: theme.primary }}>
              Tableau de bord Administrateur
            </h1>
            <p className="mt-2" style={{ color: theme.text.secondary }}>
              Accès complet à toutes les fonctionnalités administratives
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" role="admin">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Exporter
            </Button>
            <Button variant="primary" role="admin">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Rafraîchir
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Lots de cacao"
            value={statsLoading ? '—' : (stats?.total_batches || '2,847')}
            trend="+12% ce mois"
            icon={<CubeIcon className="w-6 h-6" />}
            role="admin"
          />

          <KPICard
            title="Agriculteurs actifs"
            value={statsLoading ? '—' : (stats?.total_actors || '412')}
            trend="+8 nouveaux"
            icon={<UsersIcon className="w-6 h-6" />}
            color="#2196F3"
            role="admin"
          />

          <KPICard
            title="Conformité EUDR"
            value="94%"
            trend="Objectif Atteint"
            icon={<DocumentCheckIcon className="w-6 h-6" />}
            color="#9C27B0"
            role="admin"
          />

          <KPICard
            title="Alertes en attente"
            value="38"
            trend="5 urgentes"
            icon={<ExclamationTriangleIcon className="w-6 h-6" />}
            color="#FF5722"
            role="admin"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 mb-8">
          {/* Chart Section */}
          <div
            className="rounded-xl p-6 mb-8"
            style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: theme.primary }}>
                Activité de la chaîne — 7 derniers jours
              </h2>
              <Button variant="outline" size="sm" role="admin">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Cette semaine
              </Button>
            </div>

            <div className="space-y-4">
              {chartData.map((data, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-12 text-sm font-medium" style={{ color: theme.text.secondary }}>{data.day}</div>
                  <div className="flex-1 ml-4 mr-4">
                    <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: theme.surface }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: data.width,
                          backgroundColor: theme.secondary
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-8 text-right text-sm font-bold" style={{ color: theme.primary }}>{data.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transfers Table */}
          <div className="overflow-hidden rounded-xl" style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}>
            <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: theme.card.border }}>
              <h2 className="text-xl font-bold" style={{ color: theme.primary }}>
                Transferts récents
              </h2>
              <Button variant="outline" size="sm" role="admin">
                Voir tout →
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: theme.surface }}>
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: theme.text.muted }}>ID Transfert</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: theme.text.muted }}>Date & Heure</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: theme.text.muted }}>Expéditeur</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: theme.text.muted }}>Destinataire</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: theme.text.muted }}>État</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme.card.border }}>
                  {recentTransfers.map((tx, idx) => (
                    <tr key={idx} className="hover:opacity-75 transition-opacity">
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: theme.primary }}>{tx.id}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: theme.text.secondary }}>{tx.date}</td>
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: theme.text.primary }}>{tx.sender}</td>
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: theme.text.primary }}>{tx.receiver}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(tx.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}