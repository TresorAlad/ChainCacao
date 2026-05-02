'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import type { DashboardStats } from '@/lib/dashboard-stats'
import { 
  ChartBarIcon, 
  CubeIcon, 
  DocumentCheckIcon, 
  TruckIcon,
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

  const statCards = [
    {
      label: 'Lots Actifs',
      value: statsLoading ? '—' : String(stats?.total_batches ?? stats?.total_lots ?? '—'),
      icon: CubeIcon,
      colorIdx: 0,
    },
    {
      label: 'En Transit',
      value: statsLoading ? '—' : String(stats?.en_transit ?? '—'),
      icon: TruckIcon,
      colorIdx: 1,
    },
    {
      label: 'Conformes EUDR',
      value: statsLoading ? '—' : String(stats?.eudr_conformes ?? '—'),
      icon: DocumentCheckIcon,
      colorIdx: 2,
    },
    {
      label: 'Acteurs',
      value: statsLoading ? '—' : String(stats?.total_actors ?? '—'),
      icon: CheckCircleIcon,
      colorIdx: 3,
    },
  ]

  const colorClasses = [
    'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
    'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]',
    'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
    'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  ]

  return (
    <div className="page-container">
      {statsNote && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {statsNote}
        </div>
      )}
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
        {statCards.map((stat, index) => (
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
                <div className="flex items-center gap-1 mt-3 text-sm text-[var(--color-success)]">
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                  <span>Données en temps réel</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${colorClasses[index]}`}>
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
            <h2 className="text-title-lg font-semibold text-[var(--color-primary)]">
              Vue d’ensemble
            </h2>
          </div>
          <div className="card-body">
            <div className="h-72 flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 px-6 text-center">
              <ChartBarIcon className="w-12 h-12 text-[var(--color-primary)]/40 mb-4" />
              <p className="text-[var(--color-earth)] font-medium max-w-md">
                Aucune série temporelle n’est exposée par l’API pour le moment. Les indicateurs agrégés ci-dessus proviennent de{' '}
                <code className="text-xs bg-[var(--color-surface)] px-1 py-0.5 rounded border border-[var(--color-border)]">GET /dashboard/stats</code>.
              </p>
              <Link href="/lots" className="btn btn-secondary-outline btn-sm mt-6">
                Voir mes lots (chargement par ID)
              </Link>
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
              <Link href="/nouveau-lot" className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)]/5 to-transparent hover:from-[var(--color-primary)]/10 transition-all text-left group/btn">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-[var(--color-primary)]">Nouveau Lot</p>
                  <p className="text-caption text-[var(--color-muted)]">Créer un lot agricole</p>
                </div>
              </Link>
              <Link href="/transfer" className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[var(--color-secondary)]/5 to-transparent hover:from-[var(--color-secondary)]/10 transition-all text-left group/btn">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-secondary)]/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-[var(--color-secondary)]">Transférer</p>
                  <p className="text-caption text-[var(--color-muted)]">Effectuer un transfert</p>
                </div>
              </Link>
              <Link href="/eudr-report" className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[var(--color-accent)]/5 to-transparent hover:from-[var(--color-accent)]/10 transition-all text-left group/btn">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-[var(--color-accent)]">Rapport EUDR</p>
                  <p className="text-caption text-[var(--color-muted)]">Générer un rapport</p>
                </div>
              </Link>
              <Link href="/qrcode" className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[var(--color-blockchain)]/5 to-transparent hover:from-[var(--color-blockchain)]/10 transition-all text-left group/btn">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-blockchain)]/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <QrCodeIcon className="w-6 h-6 text-[var(--color-blockchain)]" />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-[var(--color-blockchain)]">QR Code</p>
                  <p className="text-caption text-[var(--color-muted)]">Générer un QR</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats supplémentaires */}
      {stats && (
        <div className="card group">
          <div className="card-header border-b border-[var(--color-border)]/50">
            <h2 className="text-title-lg font-semibold text-[var(--color-primary)]">
              Statistiques détaillées
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats).map(([key, value]) => (
                value !== null && value !== undefined && (
                  <div key={key} className="p-4 rounded-xl bg-[var(--color-bg)]/50 border border-[var(--color-border)]/30">
                    <p className="text-body-sm text-[var(--color-muted)] capitalize mb-1">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xl font-bold text-[var(--color-primary)]">
                      {String(value)}
                    </p>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
