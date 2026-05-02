'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import type { DashboardStats } from '@/lib/dashboard-stats'
import { 
  CubeIcon, 
  DocumentCheckIcon, 
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsNote, setStatsNote] = useState<string | null>(null)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const recentTransfers = [
    { id: 'TR-2026-0047', date: '02 Mai 2026', sender: 'Coopérative N\'zérékoré', receiver: 'Exportateur Lomé', status: 'VALIDÉ' },
    { id: 'TR-2026-0046', date: '01 Mai 2026', sender: 'Agriculteur K. Koffi', receiver: 'Coopérative Nord', status: 'EN TRANSIT' },
    { id: 'TR-2026-0045', date: '30 Avr 2026', sender: 'Transformateur CACAOTG', receiver: 'Exportateur Lomé', status: 'VALIDÉ' },
    { id: 'TR-2026-0044', date: '29 Avr 2026', sender: 'Coopérative Sud', receiver: 'Transformateur CACAOTG', status: 'REJETÉ' },
  ]

  const chartData = [
    { day: 'Lun', value: 142, width: '85%' },
    { day: 'Mar', value: 176, width: '100%' },
    { day: 'Mer', value: 124, width: '70%' },
    { day: 'Jeu', value: 188, width: '95%' },
    { day: 'Ven', value: 156, width: '90%' },
    { day: 'Sam', value: 87, width: '50%' },
    { day: 'Dim', value: 55, width: '35%' },
  ]

  return (
    <div className="page-container">
      {statsNote && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {statsNote}
        </div>
      )}

      {/* Page Header */}
      <header className="page-header animate-fade-in flex justify-between items-start">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">
            Tableau de bord
          </h1>
          <p className="text-[var(--color-muted)] mt-2">
            Surveillance en temps réel de la filière cacao du Togo.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary-outline bg-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Exporter
          </button>
          <button className="btn btn-secondary flex items-center gap-2 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Rafraîchir
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Lots Enregistrés</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">{statsLoading ? '—' : (stats?.total_batches || '2,847')}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center text-[var(--color-secondary)]">
              <CubeIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-success)]">
            <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
            +12% ce mois
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Agriculteurs Actifs</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">{statsLoading ? '—' : (stats?.total_actors || '412')}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <UsersIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-success)]">
            <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
            +8 nouveaux
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Conformité EUDR</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">94%</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <DocumentCheckIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-success)]">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Objectif Atteint
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Alertes en Attente</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">38</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-orange-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            5 urgentes
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 mb-8">
        {/* Chart Section */}
        <div className="card p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-title-md font-bold text-[var(--color-primary)]">
              Activité de la chaîne — 7 derniers jours
            </h2>
            <button className="btn btn-sm btn-primary-outline bg-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Cette semaine
            </button>
          </div>
          
          <div className="space-y-4">
            {chartData.map((data, index) => (
              <div key={index} className="flex items-center">
                <div className="w-12 text-sm font-medium text-[var(--color-muted)]">{data.day}</div>
                <div className="flex-1 ml-4 mr-4">
                  <div className="h-4 bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--color-secondary)] rounded-full" 
                      style={{ width: data.width }}
                    ></div>
                  </div>
                </div>
                <div className="w-8 text-right text-sm font-bold text-[var(--color-primary)]">{data.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transfers Table */}
        <div className="card overflow-hidden">
          <div className="card-header flex justify-between items-center bg-white">
            <h2 className="text-title-md font-bold text-[var(--color-primary)]">
              Transferts récents
            </h2>
            <Link href="/transfer" className="text-sm font-semibold text-[var(--color-secondary)] hover:text-[var(--color-primary)]">
              Voir tout →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-[var(--color-bg)] text-left">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">ID Transfert</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Date & Heure</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Expéditeur</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Destinataire</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">État</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[var(--color-border)]">
                {recentTransfers.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-[var(--color-primary)]">{tx.id}</td>
                    <td className="px-6 py-4 text-sm text-[var(--color-muted)]">{tx.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--color-earth)]">{tx.sender}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--color-earth)]">{tx.receiver}</td>
                    <td className="px-6 py-4">
                      {tx.status === 'VALIDÉ' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                          VALIDÉ
                        </span>
                      )}
                      {tx.status === 'EN TRANSIT' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                          EN TRANSIT
                        </span>
                      )}
                      {tx.status === 'REJETÉ' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                          REJETÉ
                        </span>
                      )}
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
