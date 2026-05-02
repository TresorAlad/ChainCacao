'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { KPICard, Badge, Button } from '@/components/ui'
import { getRoleTheme } from '@/lib/role-themes'
import api from '@/lib/api'
import type { DashboardStats } from '@/lib/dashboard-stats'
import type { ActivityChartRow, RecentTransferRow } from '@/lib/dashboard-types'
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
  const [recentTransfers, setRecentTransfers] = useState<RecentTransferRow[]>([])
  const [chartData, setChartData] = useState<ActivityChartRow[]>([])

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
      api
        .get<{ success: boolean; transfers: RecentTransferRow[] }>('/dashboard/recent-transfers')
        .then((res) => setRecentTransfers(res.data.transfers || []))
        .catch(() => setRecentTransfers([]))

      // Fetch activity chart data
      api
        .get<{ success: boolean; activity: ActivityChartRow[] }>('/dashboard/activity-chart')
        .then((res) => setChartData(res.data.activity || []))
        .catch(() => setChartData([]))
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
      <div className="w-full py-6 sm:py-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
              Console d'Administration
            </h1>
            <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
              Gestion globale de la plateforme ChainCacao et supervision des flux.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm font-bold text-[var(--color-muted)] hover:bg-gray-50 transition-colors">
              Paramètres Système
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all">
              <UsersIcon className="w-5 h-5" />
              Gérer les Acteurs
            </button>
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center mb-4">
              <CubeIcon className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lots Enregistrés</p>
            <p className="text-3xl font-black text-[var(--color-primary)] mt-1">{statsLoading ? '—' : (stats?.total_batches || '2,847')}</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center mb-4">
              <UsersIcon className="w-6 h-6 text-[#1565C0]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Acteurs Actifs</p>
            <p className="text-3xl font-black text-[var(--color-primary)] mt-1">{statsLoading ? '—' : (stats?.total_actors || '412')}</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#F3E5F5] rounded-xl flex items-center justify-center mb-4">
              <DocumentCheckIcon className="w-6 h-6 text-[#7B1FA2]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Conformité EUDR</p>
            <p className="text-3xl font-black text-[#2E7D32] mt-1">94%</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#FFEBEE] rounded-xl flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-[#B71C1C]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alertes Système</p>
            <p className="text-3xl font-black text-[#B71C1C] mt-1">38</p>
          </div>
        </div>

        {/* Activity Chart Section */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] mb-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-[var(--color-primary)]">Activité du Réseau</h3>
              <p className="text-sm font-medium text-gray-400 mt-1">Volume de transactions sur les 7 derniers jours</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
              <SignalIcon className="w-4 h-4 text-green-500 animate-pulse" />
              <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest">Blockchain Live</span>
            </div>
          </div>
          <div className="space-y-6">
            {chartData.map((data, index) => (
              <div key={index} className="flex items-center group">
                <div className="w-12 text-xs font-black text-gray-400 uppercase">{data.day}</div>
                <div className="flex-1 ml-6 mr-6">
                  <div className="h-6 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <div 
                      className="h-full bg-gradient-to-r from-[#C5E1A5] to-[#33691E] rounded-full transition-all duration-1000 group-hover:brightness-110" 
                      style={{ width: data.width }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 text-right text-sm font-black text-[var(--color-primary)]">{data.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transfers Table */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-[var(--color-primary)]">Flux de Transferts Récents</h3>
            <button className="text-sm font-bold text-[#33691E] hover:underline">Voir l'explorateur blockchain</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Expéditeur</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Destinataire</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTransfers.map((tx, idx) => (
                  <tr key={idx} className="group hover:bg-gray-50 transition-all">
                    <td className="py-4 text-xs font-black text-[var(--color-primary)]">{tx.id}</td>
                    <td className="py-4 text-xs font-medium text-gray-400">{tx.date}</td>
                    <td className="py-4 text-xs font-bold text-[var(--color-primary)]">{tx.sender}</td>
                    <td className="py-4 text-xs font-bold text-[var(--color-primary)]">{tx.receiver}</td>
                    <td className="py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        tx.status === 'VALIDÉ' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                        tx.status === 'EN_TRANSIT' ? 'bg-[#FFF3E0] text-[#E65100]' : 'bg-[#FFEBEE] text-[#B71C1C]'
                      }`}>
                        {tx.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}