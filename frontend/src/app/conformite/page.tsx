'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DocumentCheckIcon, EyeIcon, UsersIcon } from '@heroicons/react/24/outline'
import api, { type ActorDTO } from '@/lib/api'

interface EudrCompliance {
  percentage?: number
  status?: string
  compliant?: number
  total?: number
}

function conformiteStatus(actor: ActorDTO): { label: string; cls: string } {
  if (['admin', 'verificateur'].includes(actor.role)) {
    return { label: 'Conforme', cls: 'bg-[#E8F5E9] text-[#2E7D32]' }
  }
  return { label: 'À vérifier', cls: 'bg-[#FFF3E0] text-[#E65100]' }
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    agriculteur: 'Agriculteur',
    cooperative: 'Coopérative',
    verificateur: 'Vérificateur',
    transformateur: 'Transformateur',
    distributeur: 'Distributeur',
    exportateur: 'Exportateur',
    admin: 'Administrateur',
  }
  return map[role] ?? role
}

export default function ConformitePage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const [actors, setActors] = useState<ActorDTO[]>([])
  const [eudr, setEudr] = useState<EudrCompliance | null>(null)
  const [fetching, setFetching] = useState(true)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    setFetching(true)
    const reqs: Promise<void>[] = [
      api.get<ActorDTO[] | { actors?: ActorDTO[]; data?: ActorDTO[] }>('/actors')
        .then((res) => {
          const raw = res.data
          const list = Array.isArray(raw) ? raw : (raw as { actors?: ActorDTO[] }).actors ?? (raw as { data?: ActorDTO[] }).data ?? []
          setActors(list)
        })
        .catch(() => setActors([])),
    ]
    if (isAdmin) {
      reqs.push(
        api.get<EudrCompliance | { data?: EudrCompliance }>('/dashboard/eudr-compliance')
          .then((res) => {
            const raw = res.data
            setEudr((raw as { data?: EudrCompliance }).data ?? raw as EudrCompliance)
          })
          .catch(() => setEudr(null))
      )
    }
    Promise.all(reqs).finally(() => setFetching(false))
  }, [isAuthenticated, isAdmin])

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const conformeCount = actors.filter(a => ['admin', 'verificateur'].includes(a.role)).length

  return (
    <div className="w-full py-6 sm:py-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">Conformité EUDR</h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Surveillance et certification contre la déforestation.
          </p>
        </div>
        <Link
          href="/eudr-report"
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
        >
          <DocumentCheckIcon className="w-5 h-5" />
          Rapport EUDR
        </Link>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Score EUDR</p>
          <p className="text-3xl font-black text-[#2E7D32]">
            {isAdmin && eudr?.percentage != null ? `${eudr.percentage}%` : '—'}
          </p>
          <p className="text-xs font-bold text-gray-400 mt-1">
            {isAdmin ? eudr?.status || 'Données admin' : 'Réservé admin'}
          </p>
        </div>
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total acteurs</p>
          <p className="text-3xl font-black text-[var(--color-primary)]">{actors.length}</p>
          <p className="text-xs font-bold text-gray-400 mt-1">enregistrés</p>
        </div>
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Conformes</p>
          <p className="text-3xl font-black text-[#2E7D32]">
            {isAdmin && eudr?.compliant != null ? eudr.compliant : conformeCount}
          </p>
          <p className="text-xs font-bold text-gray-400 mt-1">acteurs vérifiés</p>
        </div>
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">À vérifier</p>
          <p className="text-3xl font-black text-[#E65100]">
            {actors.length - conformeCount}
          </p>
          <p className="text-xs font-bold text-gray-400 mt-1">acteurs en attente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Table acteurs */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] overflow-hidden">
          <h3 className="text-2xl font-black text-[var(--color-primary)] mb-8">Registre de Conformité</h3>
          {actors.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-center">
              <UsersIcon className="w-12 h-12 text-gray-200" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Aucun acteur disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Acteur</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Statut</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {actors.map((actor) => {
                    const st = conformiteStatus(actor)
                    return (
                      <tr key={actor.id} className="group hover:bg-gray-50 transition-all">
                        <td className="py-5">
                          <p className="text-sm font-black text-[var(--color-primary)]">{actor.nom}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{actor.id}</p>
                        </td>
                        <td className="py-5 text-sm text-gray-600">{roleLabel(actor.role)}</td>
                        <td className="py-5 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-5 text-right">
                          <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all">
                            <EyeIcon className="w-5 h-5 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Carte satellite GPS (visuelle) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-[#1A2E0D] rounded-[2rem] p-8 shadow-xl relative overflow-hidden h-[400px] flex flex-col">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white mb-2">Suivi Satellite</h3>
              <p className="text-white/60 text-xs">Analyse radar des parcelles en temps réel.</p>
            </div>
            <div className="flex-1 mt-6 rounded-[1.5rem] bg-black/20 backdrop-blur-sm border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-2 border-green-500/30 rounded-full animate-ping" />
                <div className="w-16 h-16 border-2 border-green-500/50 rounded-full animate-pulse" />
                <div className="absolute top-10 left-10 w-2 h-2 bg-green-400 rounded-full shadow-[0_0_10px_#4ade80]" />
                <div className="absolute bottom-20 right-12 w-2 h-2 bg-red-400 rounded-full shadow-[0_0_10px_#f87171]" />
              </div>
            </div>
            <button className="relative z-10 w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-md border border-white/20 transition-all">
              Agrandir la carte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
