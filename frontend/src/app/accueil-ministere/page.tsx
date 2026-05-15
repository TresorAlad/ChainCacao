'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleBasedRedirect, isMinistereRole, isAdminRole } from '@/lib/role-utils'
import api from '@/lib/api'
import type { DashboardStats } from '@/lib/dashboard-stats'
import {
  BuildingLibraryIcon,
  UsersIcon,
  QrCodeIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  GlobeAmericasIcon,
} from '@heroicons/react/24/outline'

export default function AccueilMinisterePage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alertsCount, setAlertsCount] = useState<number | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const canAccess = isMinistereRole(user?.role) || isAdminRole(user?.role)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!loading && isAuthenticated && !canAccess) {
      router.replace(getRoleBasedRedirect(user?.role))
    }
  }, [loading, isAuthenticated, canAccess, user?.role, router])

  useEffect(() => {
    if (!isAuthenticated || !canAccess) return
    setStatsLoading(true)
    Promise.all([
      api.get<{ success: boolean; stats: DashboardStats }>('/dashboard/stats').catch(() => ({ data: { stats: {} } })),
      api.get<{ success: boolean; alerts: Record<string, unknown> }>('/dashboard/alerts-count').catch(() => null),
    ])
      .then(([statsRes, alertsRes]) => {
        setStats(statsRes.data.stats || {})
        const alerts = alertsRes?.data?.alerts as { total?: number; count?: number } | undefined
        setAlertsCount(alerts?.total ?? alerts?.count ?? null)
      })
      .finally(() => setStatsLoading(false))
  }, [isAuthenticated, canAccess])

  if (loading || !isAuthenticated || !canAccess) {
    return (
      <div className="page-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#33691E] border-t-transparent" />
      </div>
    )
  }

  const totalLots = stats?.total_batches ?? stats?.total_lots
  const totalWeight = stats?.total_weight

  const quickLinks = [
    {
      href: '/dashboard-ministere',
      icon: BuildingLibraryIcon,
      title: 'Supervision',
      desc: 'Audit des lots, alertes fraude et cartographie nationale.',
      color: 'from-[#1B3A0F] to-[#33691E]',
    },
    {
      href: '/actors',
      icon: UsersIcon,
      title: 'Annuaire acteurs',
      desc: 'Consulter les statistiques par agriculteur, coopérative ou exportateur.',
      color: 'from-[#1565C0] to-[#1976D2]',
    },
    {
      href: '/blockchain',
      icon: QrCodeIcon,
      title: 'Blockchain',
      desc: 'Indicateurs agrégés et traçabilité sur le registre.',
      color: 'from-[#6A1B9A] to-[#8E24AA]',
    },
  ]

  return (
    <RoleLayout role="ministere">
      <div className="page-container py-6 sm:py-8">
        <header className="page-header mb-8">
          <h1 className="page-heading">Accueil — Ministère</h1>
          <p className="page-subtitle">
            Vue d&apos;ensemble de la filière cacao et accès rapide aux outils de supervision.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="card p-5">
            <ScaleIcon className="w-8 h-8 text-[#2E7D32] mb-3" />
            <p className="text-xs font-bold text-gray-400 uppercase">Volume tracé</p>
            <p className="text-2xl font-black text-[var(--color-primary)] mt-1">
              {statsLoading ? '—' : totalWeight != null ? `${totalWeight.toLocaleString('fr-FR')} kg` : totalLots ?? '—'}
            </p>
          </div>
          <div className="card p-5">
            <GlobeAmericasIcon className="w-8 h-8 text-[#1565C0] mb-3" />
            <p className="text-xs font-bold text-gray-400 uppercase">Lots actifs</p>
            <p className="text-2xl font-black text-[var(--color-primary)] mt-1">{statsLoading ? '—' : totalLots ?? '—'}</p>
          </div>
          <div className="card p-5">
            <ExclamationTriangleIcon className="w-8 h-8 text-[#E65100] mb-3" />
            <p className="text-xs font-bold text-gray-400 uppercase">En transit</p>
            <p className="text-2xl font-black text-[#E65100] mt-1">{statsLoading ? '—' : stats?.en_transit ?? '—'}</p>
          </div>
          <div className="card p-5">
            <ExclamationTriangleIcon className="w-8 h-8 text-[#B71C1C] mb-3" />
            <p className="text-xs font-bold text-gray-400 uppercase">Alertes</p>
            <p className="text-2xl font-black text-[#B71C1C] mt-1">{statsLoading ? '—' : alertsCount ?? '—'}</p>
          </div>
        </div>

        <h2 className="text-lg font-black text-[var(--color-primary)] mb-4">Accès rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card p-6 hover:shadow-lg transition-shadow group block"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
              >
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-black text-[var(--color-primary)] mb-2">{item.title}</h3>
              <p className="text-sm text-[var(--color-muted)]">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </RoleLayout>
  )
}
