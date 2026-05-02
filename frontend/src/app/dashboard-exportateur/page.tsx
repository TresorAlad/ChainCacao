'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleTheme } from '@/lib/role-themes'
import api, { type ActorDTO } from '@/lib/api'
import {
  GlobeAmericasIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ExportateurDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('exportateur')

  const [actors, setActors] = useState<ActorDTO[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    api.get<ActorDTO[] | { actors?: ActorDTO[]; data?: ActorDTO[] }>('/actors')
      .then((res) => {
        const raw = res.data
        const list = Array.isArray(raw) ? raw : (raw as { actors?: ActorDTO[] }).actors ?? (raw as { data?: ActorDTO[] }).data ?? []
        setActors(list)
      })
      .catch(() => setActors([]))
      .finally(() => setFetching(false))
  }, [isAuthenticated])

  if (loading || fetching) {
    return (
      <div style={{ backgroundColor: theme.surface, minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  // Le rôle 'exportateur' (mobile) est mappé en 'distributeur' côté API; les deux accèdent à ce tableau de bord.
  const role = user?.role
  if (!isAuthenticated || (role !== 'exportateur' && role !== 'distributeur' && role !== 'admin')) return null

  return (
    <RoleLayout role="exportateur">
      <div className="w-full py-6 sm:py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">Gestion des Exportations</h1>
            <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
              Suivi logistique et conformité internationale des lots.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/eudr-report"
              className="px-6 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm font-bold text-[var(--color-muted)] hover:bg-gray-50 transition-colors"
            >
              Rapports EUDR
            </Link>
            <Link
              href="/export"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              Nouvelle Exportation
            </Link>
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center mb-4">
              <GlobeAmericasIcon className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expéditions Totales</p>
            <p className="text-3xl font-black text-[var(--color-primary)] mt-1">—</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#FFF3E0] rounded-xl flex items-center justify-center mb-4">
              <TruckIcon className="w-6 h-6 text-[#E65100]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">En Transit</p>
            <p className="text-3xl font-black text-[#E65100] mt-1">—</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-6 h-6 text-[#1565C0]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Partenaires réseau</p>
            <p className="text-3xl font-black text-[#2E7D32] mt-1">{actors.length}</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#F3E5F5] rounded-xl flex items-center justify-center mb-4">
              <CurrencyDollarIcon className="w-6 h-6 text-[#7B1FA2]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chiffre d&apos;affaires</p>
            <p className="text-3xl font-black text-[var(--color-primary)] mt-1">—</p>
          </div>
        </div>

        {/* Flux logistiques visuels (GPS) */}
        <div className="bg-[#1A2E0D] rounded-[2rem] p-8 mb-10 shadow-xl relative overflow-hidden h-[340px]">
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white mb-2">Flux Logistiques Mondiaux</h3>
            <p className="text-white/60 text-sm">Suivi de vos expéditions à travers le monde.</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <GlobeAmericasIcon className="w-[600px] h-[600px] text-white" />
          </div>
          <div className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Système de tracking actif</span>
            </div>
          </div>
        </div>

        {/* Liens rapides */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
          <h3 className="text-2xl font-black text-[var(--color-primary)] mb-6">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/export" className="flex flex-col items-center gap-3 p-6 bg-[#F1F8E9] rounded-2xl hover:brightness-95 transition-all text-center">
              <TruckIcon className="w-8 h-8 text-[#2E7D32]" />
              <span className="text-sm font-bold text-[var(--color-primary)]">Marquer un lot exporté</span>
            </Link>
            <Link href="/lots" className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-2xl hover:brightness-95 transition-all text-center">
              <GlobeAmericasIcon className="w-8 h-8 text-[#1565C0]" />
              <span className="text-sm font-bold text-[var(--color-primary)]">Gérer les lots</span>
            </Link>
            <Link href="/eudr-report" className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-2xl hover:brightness-95 transition-all text-center">
              <CheckCircleIcon className="w-8 h-8 text-[#7B1FA2]" />
              <span className="text-sm font-bold text-[var(--color-primary)]">Rapport EUDR</span>
            </Link>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}
