'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowPathIcon, CubeIcon, ServerIcon } from '@heroicons/react/24/outline'
import api from '@/lib/api'

interface DashboardStats {
  total_lots?: number
  total_actors?: number
  total_transfers?: number
  lots_verified?: number
  eudr_compliant?: number
}

export default function BlockchainPage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [fetching, setFetching] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const fetchStats = () => {
    if (!isAuthenticated || !isAdmin) { setFetching(false); return }
    setFetching(true)
    api.get<DashboardStats | { data?: DashboardStats }>('/dashboard/stats')
      .then((res) => {
        const raw = res.data
        setStats((raw as { data?: DashboardStats }).data ?? raw as DashboardStats)
        setLastRefresh(new Date())
      })
      .catch(() => setStats(null))
      .finally(() => setFetching(false))
  }

  useEffect(() => {
    if (isAuthenticated) fetchStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="w-full py-6 sm:py-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
            Explorateur Blockchain
          </h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Surveillance de l&apos;infrastructure décentralisée Hyperledger Fabric.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={fetchStats}
            disabled={fetching}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all disabled:opacity-60"
          >
            <ArrowPathIcon className={`w-5 h-5 ${fetching ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        )}
      </header>

      {!isAdmin && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 font-medium">
          Les données blockchain en temps réel (hauteur de bloc, nœuds, hash) nécessitent
          un accès direct au proxy Fabric et sont réservées à l&apos;administrateur système.
        </div>
      )}

      {isAdmin && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lots enregistrés</p>
            <p className="text-3xl font-black text-[var(--color-primary)]">{stats.total_lots ?? '—'}</p>
            <p className="text-xs font-bold text-green-500 mt-1">transactions blockchain</p>
          </div>
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Acteurs</p>
            <p className="text-3xl font-black text-[#1565C0]">{stats.total_actors ?? '—'}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">identités enregistrées</p>
          </div>
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Transferts</p>
            <p className="text-3xl font-black text-[#33691E]">{stats.total_transfers ?? '—'}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">échanges chaîne de valeur</p>
          </div>
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lots vérifiés</p>
            <p className="text-3xl font-black text-[#6A1B9A]">{stats.lots_verified ?? '—'}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-green-600">Réseau actif</p>
            </div>
          </div>
        </div>
      )}

      {isAdmin && !stats && !fetching && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          Impossible de charger les statistiques. Vérifiez la connexion à l&apos;API.
        </div>
      )}

      {/* Topologie réseau — visuelle uniquement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        <div className="lg:col-span-8 bg-[#1A2E0D] rounded-[2rem] p-10 shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[340px]">
          <div className="absolute top-0 right-0 p-40 bg-[#33691E]/20 rounded-full blur-[100px] -mr-20 -mt-20" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Topologie du Réseau</h3>
            <p className="text-white/60 text-sm mb-10">Visualisation des pairs Hyperledger Fabric.</p>
            <div className="flex items-center justify-center gap-12 flex-wrap">
              <div className="w-32 h-32 rounded-[2rem] bg-white shadow-2xl flex flex-col items-center justify-center border-4 border-[#33691E]">
                <ServerIcon className="w-8 h-8 text-[#1B3A0F] mb-1" />
                <span className="text-[10px] font-black text-gray-400 uppercase">Orderer</span>
              </div>
              <div className="grid grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black text-white/50 uppercase">Peer {i}</span>
                    <span className="text-[10px] font-black text-white">ACTIF</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-6">État du réseau</h3>
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-[var(--color-primary)]">Réseau opérationnel</span>
            </div>
            <div className="text-xs text-gray-500">
              Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-500 leading-relaxed">
              Les métriques détaillées (hauteur de bloc, hash, latence) sont disponibles
              directement via le proxy Hyperledger Fabric (accès serveur uniquement).
            </div>
            {isAdmin && stats && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Lots EUDR conformes</span>
                  <span className="font-bold text-green-700">{stats.eudr_compliant ?? '—'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bloc récent — état vide si non admin */}
      {!isAdmin && (
        <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-[var(--color-border)] flex flex-col items-center gap-4 text-center">
          <CubeIcon className="w-16 h-16 text-gray-200" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Données blockchain non disponibles</p>
          <p className="text-xs text-gray-400 max-w-sm">
            L&apos;accès aux blocs Hyperledger Fabric en temps réel est réservé à l&apos;administrateur système.
          </p>
        </div>
      )}
    </div>
  )
}
