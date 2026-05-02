'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleTheme } from '@/lib/role-themes'
import api, { type ActorDTO } from '@/lib/api'
import {
  DocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  DocumentMagnifyingGlassIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function VerificateurDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('verificateur')

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

  if (!isAuthenticated || user?.role !== 'verificateur') return null

  return (
    <RoleLayout role="verificateur">
      <div className="w-full py-6 sm:py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">Contrôle & Conformité</h1>
            <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
              Système de vérification et de validation des lots de cacao.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm font-bold text-[var(--color-primary)] hover:bg-gray-50 transition-all"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              Nouvelle Vérification
            </Link>
            <Link
              href="/eudr-report"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
            >
              <ShieldCheckIcon className="w-5 h-5" />
              Rapport EUDR
            </Link>
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center mb-4">
              <DocumentCheckIcon className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lots Vérifiés</p>
            <p className="text-3xl font-black text-[var(--color-primary)] mt-1">—</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-6 h-6 text-[#1565C0]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Acteurs réseau</p>
            <p className="text-3xl font-black text-[#2E7D32] mt-1">{actors.length}</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#FFEBEE] rounded-xl flex items-center justify-center mb-4">
              <XCircleIcon className="w-6 h-6 text-[#B71C1C]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Non Conformes</p>
            <p className="text-3xl font-black text-[#B71C1C] mt-1">—</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#F1F8E9] rounded-xl flex items-center justify-center mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-[#33691E]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Score Conformité</p>
            <p className="text-3xl font-black text-[var(--color-primary)] mt-1">—</p>
          </div>
        </div>

        {/* EUDR Banner */}
        <div className="bg-[#F1F8E9] rounded-[1.5rem] p-6 mb-10 border border-[#C5E1A5]/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <ShieldCheckIcon className="w-6 h-6 text-[#33691E]" />
            </div>
            <div>
              <p className="text-sm font-black text-[var(--color-primary)]">Mise à jour EUDR</p>
              <p className="text-xs font-medium text-gray-500">Critères de déforestation actifs — vérifiez les lots entrants.</p>
            </div>
          </div>
          <Link
            href="/eudr-report"
            className="flex-shrink-0 px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all"
          >
            Voir le rapport
          </Link>
        </div>

        {/* Acteurs list (pour vérifier leur conformité) */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-[var(--color-primary)]">Acteurs à vérifier</h3>
            <Link href="/conformite" className="text-sm font-bold text-[#33691E] hover:underline">Registre de conformité</Link>
          </div>
          {actors.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-center">
              <DocumentMagnifyingGlassIcon className="w-12 h-12 text-gray-200" />
              <p className="text-sm text-gray-400">Aucun acteur disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actors.slice(0, 5).map((actor) => (
                <div key={actor.id} className="flex items-center justify-between group p-4 hover:bg-gray-50 rounded-2xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-[#E8F5E9]">
                      <DocumentMagnifyingGlassIcon className="w-6 h-6 text-[#2E7D32]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[var(--color-primary)]">{actor.nom}</p>
                      <p className="text-xs font-medium text-gray-400 capitalize">{actor.role} — {actor.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#E8F5E9] text-[#2E7D32]">
                      Enregistré
                    </span>
                    <Link href="/verify" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                      <EyeIcon className="w-5 h-5 text-gray-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  )
}
