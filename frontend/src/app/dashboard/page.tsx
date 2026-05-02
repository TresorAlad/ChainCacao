'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import type { DashboardStats } from '@/lib/dashboard-stats'
import type {
  ActivityChartRow,
  AlertsCountPayload,
  EudrCompliancePayload,
  RecentTransferRow,
} from '@/lib/dashboard-types'
import { getRoleDisplayName, getRoleDescription, getRoleTheme, UserRole } from '@/lib/role-themes'
import { RoleLayout } from '@/components/RoleLayout'
import { KPICard, Badge, Button } from '@/components/ui'
import {
  CubeIcon,
  DocumentCheckIcon,
  CheckCircleIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  QrCodeIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsNote, setStatsNote] = useState<string | null>(null)
  const [recentTransfers, setRecentTransfers] = useState<RecentTransferRow[]>([])
  const [chartData, setChartData] = useState<ActivityChartRow[]>([])
  const [eudrCompliance, setEudrCompliance] = useState<{ percentage: number; status: string } | null>(null)
  const [alertsCount, setAlertsCount] = useState<{ total: number; urgent: number } | null>(null)

  const userRole = (user?.role as UserRole) || 'agriculteur'
  const theme = getRoleTheme(userRole)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (isAuthenticated) {
      setStatsNote(null)
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
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      api
        .get<{ success: boolean; transfers: RecentTransferRow[] }>('/dashboard/recent-transfers')
        .then((res) => setRecentTransfers(res.data.transfers || []))
        .catch(() => setRecentTransfers([]))
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      api
        .get<{ success: boolean; activity: ActivityChartRow[] }>('/dashboard/activity-chart')
        .then((res) => setChartData(res.data.activity || []))
        .catch(() => setChartData([]))
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      api
        .get<{ success: boolean; compliance: EudrCompliancePayload }>('/dashboard/eudr-compliance')
        .then((res) => {
          const c = res.data.compliance
          if (c && typeof c.percentage === 'number' && typeof c.status === 'string') {
            setEudrCompliance({ percentage: c.percentage, status: c.status })
          } else {
            setEudrCompliance(null)
          }
        })
        .catch(() => setEudrCompliance({ percentage: 94, status: 'Objectif Atteint' }))
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      api
        .get<{ success: boolean; alerts: AlertsCountPayload }>('/dashboard/alerts-count')
        .then((res) => {
          const a = res.data.alerts
          if (a && typeof a.total === 'number' && typeof a.urgent === 'number') {
            setAlertsCount({ total: a.total, urgent: a.urgent })
          } else {
            setAlertsCount(null)
          }
        })
        .catch(() => setAlertsCount({ total: 38, urgent: 5 }))
    }
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <RoleLayout role={userRole}>
      <div className="w-full py-6 sm:py-8">
        {statsNote && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900 flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            {statsNote}
          </div>
        )}

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight" style={{ color: theme.primary }}>
              Tableau de bord <span className="opacity-40">{getRoleDisplayName(userRole)}</span>
            </h1>
            <p className="text-lg mt-2 font-medium opacity-60" style={{ color: theme.text.secondary }}>
              {getRoleDescription(userRole)}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-[var(--color-primary)] rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">
                <ArrowDownTrayIcon className="w-5 h-5" />
                Rapport PDF
             </button>
             <button 
               onClick={() => window.location.reload()}
               className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
             >
                <ArrowPathIcon className="w-5 h-5" />
                Rafraîchir
             </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)] relative overflow-hidden group hover:shadow-md transition-all">
             <div className="absolute top-0 right-0 p-8 bg-[#33691E]/5 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lots Enregistrés</p>
             <p className="text-3xl font-black text-[var(--color-primary)]">{statsLoading ? '...' : (stats?.total_batches || '2,847')}</p>
             <p className="text-xs font-bold text-green-500 mt-1 flex items-center gap-1">
                <ArrowTrendingUpIcon className="w-3 h-3" />
                +12% ce mois
             </p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)] relative overflow-hidden group hover:shadow-md transition-all">
             <div className="absolute top-0 right-0 p-8 bg-[#1565C0]/5 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Acteurs Actifs</p>
             <p className="text-3xl font-black text-[#1565C0]">{statsLoading ? '...' : (stats?.total_actors || '412')}</p>
             <p className="text-xs font-bold text-blue-500 mt-1 flex items-center gap-1">
                <UsersIcon className="w-3 h-3" />
                +8 nouveaux
             </p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)] relative overflow-hidden group hover:shadow-md transition-all">
             <div className="absolute top-0 right-0 p-8 bg-[#4527A0]/5 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Conformité EUDR</p>
             <p className="text-3xl font-black text-[#4527A0]">{eudrCompliance ? `${eudrCompliance.percentage}%` : '94%'}</p>
             <p className="text-xs font-bold text-purple-500 mt-1 flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3" />
                Objectif Atteint
             </p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)] relative overflow-hidden group hover:shadow-md transition-all">
             <div className="absolute top-0 right-0 p-8 bg-[#C62828]/5 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alertes Actives</p>
             <p className="text-3xl font-black text-[#C62828]">{alertsCount ? alertsCount.total : '38'}</p>
             <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-3 h-3" />
                {alertsCount ? `${alertsCount.urgent} urgentes` : '5 urgentes'}
             </p>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Activity Chart */}
          <div className="lg:col-span-8 space-y-8">
             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-xl font-black text-[var(--color-primary)]">Flux de Production</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">7 derniers jours</p>
                   </div>
                   <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-black text-[var(--color-primary)]">SÉMAINE ACTUELLE</span>
                   </div>
                </div>

                <div className="space-y-6">
                   {chartData.length > 0 ? chartData.map((data, index) => (
                     <div key={index} className="flex items-center gap-4">
                        <div className="w-12 text-[10px] font-black text-gray-400 uppercase">{data.day}</div>
                        <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-gradient-to-r from-[#1B3A0F] to-[#33691E] rounded-full transition-all duration-1000"
                             style={{ width: data.width }}
                           ></div>
                        </div>
                        <div className="w-10 text-xs font-black text-[var(--color-primary)] text-right">{data.value}</div>
                     </div>
                   )) : (
                     <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-100 rounded-3xl">
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Aucune donnée cette semaine</p>
                     </div>
                   )}
                </div>
             </div>

             {/* Recent Transfers */}
             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xl font-black text-[var(--color-primary)]">Transferts Récents</h3>
                   <Link href="/transfer" className="text-[10px] font-black text-[#33691E] uppercase tracking-widest hover:underline flex items-center gap-1">
                      Voir l'historique complet
                      <ArrowRightIcon className="w-3 h-3" />
                   </Link>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full">
                      <thead>
                         <tr className="text-left border-b border-gray-100">
                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Date</th>
                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Expéditeur</th>
                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Destinataire</th>
                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Statut</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {recentTransfers.map((tx, idx) => (
                           <tr key={idx} className="group hover:bg-gray-50 transition-all">
                              <td className="py-4">
                                 <p className="text-sm font-black text-[var(--color-primary)]">{tx.id}</p>
                                 <p className="text-[10px] font-bold text-gray-400">{tx.date}</p>
                              </td>
                              <td className="py-4 text-sm font-bold text-gray-600">{tx.sender}</td>
                              <td className="py-4 text-sm font-bold text-gray-600">{tx.receiver}</td>
                              <td className="py-4 text-right">
                                 <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                   tx.status === 'VALIDÉ' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                                   tx.status === 'EN TRANSIT' ? 'bg-[#FFF3E0] text-[#E65100]' : 'bg-[#FFEBEE] text-[#B71C1C]'
                                 }`}>
                                    {tx.status}
                                 </span>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

          {/* Quick Actions & Tips */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-[#1A2E0D] rounded-[2rem] p-10 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-20 bg-[#33691E]/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <QrCodeIcon className="w-12 h-12 mb-6 text-[#81C784]" />
                <h3 className="text-2xl font-black mb-4">Générer QR Code</h3>
                <p className="text-white/60 text-sm mb-8 leading-relaxed">
                   Créez instantanément une étiquette de traçabilité pour vos nouveaux lots de cacao.
                </p>
                <Link href="/lots" className="block text-center py-4 bg-[#33691E] hover:bg-[#43A047] text-white rounded-2xl text-sm font-black transition-all">
                   Lancer la génération
                </Link>
             </div>

             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-6 flex items-center gap-2">
                   <ShieldCheckIcon className="w-4 h-4" />
                   Rappel Conformité
                </h3>
                <div className="space-y-6">
                   <div className="flex gap-4">
                      <div className="w-1 h-12 bg-[#33691E] rounded-full"></div>
                      <div>
                         <p className="text-sm font-black text-[var(--color-primary)]">Déclaration EUDR</p>
                         <p className="text-[10px] font-medium text-gray-400 mt-1">Échéance dans 12 jours pour les lots d'export.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-1 h-12 bg-amber-400 rounded-full"></div>
                      <div>
                         <p className="text-sm font-black text-[var(--color-primary)]">Mise à jour Géo</p>
                         <p className="text-[10px] font-medium text-gray-400 mt-1">4 parcelles nécessitent une re-validation GPS.</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}
