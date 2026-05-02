'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleTheme } from '@/lib/role-themes'
import api, { type Batch } from '@/lib/api'
import {
  BeakerIcon,
  MapPinIcon,
  CheckCircleIcon,
  PlusIcon,
  CubeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function AgriculteurDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('agriculteur')

  const [searchId, setSearchId] = useState('')
  const [foundLot, setFoundLot] = useState<Batch | null | 'not-found'>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const fetchLot = useCallback(async (id: string) => {
    if (!id.trim()) return
    setSearching(true)
    setFoundLot(null)
    try {
      const res = await api.get<{ batch: Batch }>(`/lot/${id.trim()}`)
      setFoundLot((res.data.batch ?? res.data) as Batch)
    } catch {
      setFoundLot('not-found')
    } finally {
      setSearching(false)
    }
  }, [])

  if (loading) {
    return (
      <div style={{ backgroundColor: theme.surface, minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'agriculteur') return null

  return (
    <RoleLayout role="agriculteur">
      <div className="w-full py-6 sm:py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: theme.primary }}>
              Bonjour, {user?.email?.split('@')[0] || user?.actor_id || 'Kofi'}
            </h1>
            <p className="text-lg mt-2 font-medium opacity-60" style={{ color: theme.text.secondary }}>
              Voici l&apos;état de votre récolte pour la saison actuelle.
            </p>
          </div>
          <Link
            href="/nouveau-lot"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Nouveau Lot
          </Link>
        </header>

        {/* KPI — pas d'endpoint personnel, on affiche — */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                <BeakerIcon className="w-6 h-6 text-[#2E7D32]" />
              </div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Production Totale</span>
            </div>
            <div className="text-4xl font-black text-[var(--color-primary)]">—</div>
            <p className="mt-3 text-xs font-medium text-gray-400">Recherchez un lot par ID ci-dessous</p>
          </div>

          <div className="bg-[#33691E] rounded-[2rem] p-8 shadow-lg relative overflow-hidden">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CubeIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">ID Acteur</span>
              </div>
              <div className="text-2xl font-black break-all">{user?.actor_id || '—'}</div>
              <p className="mt-3 text-sm font-medium text-white/60">Votre identifiant blockchain</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
            <CheckCircleIcon className="w-16 h-16 text-[#33691E]/30 mb-4" />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Statut Compte</p>
            <p className="text-2xl font-black text-[#2E7D32] mt-2">Actif</p>
          </div>
        </div>

        {/* Recherche lot par ID */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] mb-12">
          <h3 className="text-xl font-black text-[var(--color-primary)] mb-6">Rechercher un lot</h3>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLot(searchId)}
                placeholder="Saisissez l'ID d'un lot (ex: LOT-001)"
                className="pl-10 pr-4 py-2.5 w-full border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>
            <button
              onClick={() => fetchLot(searchId)}
              disabled={searching || !searchId.trim()}
              className="px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {searching ? '…' : 'Chercher'}
            </button>
          </div>
          {foundLot === 'not-found' && (
            <p className="text-sm text-red-600">Aucun lot trouvé pour cet identifiant.</p>
          )}
          {foundLot && foundLot !== 'not-found' && (
            <div className="mt-4 p-4 bg-[#F1F8E9] rounded-xl border border-[#C5E1A5]/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-[var(--color-primary)]">Lot : {foundLot.id}</p>
                  <p className="text-xs text-gray-500 mt-1">{foundLot.culture} — {foundLot.quantite} kg — {foundLot.lieu}</p>
                </div>
                <Link
                  href={`/lot-detail?id=${foundLot.id}`}
                  className="px-4 py-2 bg-[#1B3A0F] text-white rounded-xl text-xs font-bold hover:brightness-110"
                >
                  Détails
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Carte GPS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-8 relative rounded-[2rem] overflow-hidden shadow-sm border border-[var(--color-border)] h-[400px]">
            <img
              src="https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-1.28,5.12,14,0/800x400?access_token=pk.eyJ1IjoiY2hhaW5jYWNhbyIsImEiOiJjbHNnd2R2bmwwMWZpMnJvN2x3eGZ3bmM4In0.xxx"
              alt="Vue Satellite des Parcelles"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&q=80&w=800&h=400'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl text-white">
              <MapPinIcon className="w-5 h-5" />
              <span className="text-sm font-bold">Vue des Parcelles • {user?.actor_id || 'Ma parcelle'}</span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#F1F8E9] rounded-[2rem] p-8 border border-[var(--color-secondary-light)]/30 flex flex-col justify-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
              <CheckCircleIcon className="w-6 h-6 text-[#33691E]" />
            </div>
            <h3 className="text-2xl font-black text-[var(--color-primary)] mb-4">Traçabilité Blockchain</h3>
            <p className="text-sm font-medium text-[var(--color-primary)]/60 mb-8">
              Vos lots sont sécurisés et traçables sur la blockchain du réseau ChainCacao.
            </p>
            <div className="space-y-3">
              <Link
                href="/sync"
                className="block w-full py-3 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold text-center hover:brightness-110 transition-all"
              >
                Synchroniser mes lots
              </Link>
              <Link
                href="/lots"
                className="block w-full py-3 bg-white border border-[var(--color-border)] text-[var(--color-primary)] rounded-xl text-sm font-bold text-center hover:bg-gray-50 transition-all"
              >
                Gérer mes lots
              </Link>
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}
