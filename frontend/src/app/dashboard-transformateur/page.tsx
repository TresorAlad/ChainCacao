'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { getRoleTheme } from '@/lib/role-themes'
import api, { type Batch } from '@/lib/api'
import {
  BeakerIcon,
  ArchiveBoxIcon,
  CheckBadgeIcon,
  ScaleIcon,
  ArrowPathIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function TransformateurDashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const theme = getRoleTheme('transformateur')

  const [searchId, setSearchId] = useState('')
  const [foundLot, setFoundLot] = useState<Batch | null | 'not-found'>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const fetchLot = async (id: string) => {
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
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFDF7]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#33691E] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'transformateur') return null

  return (
    <RoleLayout role="transformateur">
      <div className="w-full py-6 sm:py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">Unité de Transformation</h1>
            <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
              Suivi des procédés de traitement et contrôle qualité.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/update-weight"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Mettre à jour poids
            </Link>
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center mb-4">
              <BeakerIcon className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lots Transformés</p>
            <p className="text-3xl font-black text-[var(--color-primary)] mt-1">—</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#FFF3E0] rounded-xl flex items-center justify-center mb-4">
              <ScaleIcon className="w-6 h-6 text-[#E65100]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rendement Moyen</p>
            <p className="text-3xl font-black text-[#E65100] mt-1">—</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center mb-4">
              <ArchiveBoxIcon className="w-6 h-6 text-[#1565C0]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stock Masse (kg)</p>
            <p className="text-3xl font-black text-[var(--color-primary)] mt-1">—</p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-[#F3E5F5] rounded-xl flex items-center justify-center mb-4">
              <CheckBadgeIcon className="w-6 h-6 text-[#7B1FA2]" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID Acteur</p>
            <p className="text-sm font-black text-[#2E7D32] mt-1 break-all">{user?.actor_id || '—'}</p>
          </div>
        </div>

        {/* Recherche lot pour mise à jour poids */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] mb-10">
          <h3 className="text-xl font-black text-[var(--color-primary)] mb-6">Rechercher un lot à transformer</h3>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLot(searchId)}
                placeholder="ID du lot (ex: LOT-001)"
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
            <p className="text-sm text-red-600">Aucun lot trouvé.</p>
          )}
          {foundLot && foundLot !== 'not-found' && (
            <div className="mt-4 p-4 bg-[#F1F8E9] rounded-xl border border-[#C5E1A5]/30 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-[var(--color-primary)]">{foundLot.id} — {foundLot.culture}</p>
                <p className="text-xs text-gray-500 mt-1">{foundLot.quantite} kg — {foundLot.lieu}</p>
              </div>
              <Link
                href={`/update-weight?id=${foundLot.id}`}
                className="px-4 py-2 bg-[#1B3A0F] text-white rounded-xl text-xs font-bold hover:brightness-110"
              >
                Mettre à jour poids
              </Link>
            </div>
          )}
        </div>

        {/* Optimisation industrielle banner */}
        <div className="bg-[#1A2E0D] rounded-[2rem] p-10 mb-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="relative z-10 max-w-lg text-center md:text-left">
            <h3 className="text-3xl font-black text-white mb-4">Optimisation Industrielle</h3>
            <p className="text-white/70 text-lg">Suivez vos étapes de torréfaction, concassage et pressage avec précision sur la blockchain.</p>
          </div>
          <div className="relative z-10 flex flex-col items-center bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 min-w-[200px]">
            <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-2">Réseau ChainCacao</p>
            <p className="text-white text-4xl font-black">Actif</p>
          </div>
        </div>

        {/* Liens rapides */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
          <h3 className="text-xl font-black text-[var(--color-primary)] mb-6">Actions disponibles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/update-weight" className="flex flex-col items-center gap-3 p-6 bg-[#F1F8E9] rounded-2xl hover:brightness-95 transition-all text-center">
              <ScaleIcon className="w-8 h-8 text-[#2E7D32]" />
              <span className="text-sm font-bold text-[var(--color-primary)]">Mettre à jour poids</span>
            </Link>
            <Link href="/transfer" className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-2xl hover:brightness-95 transition-all text-center">
              <ArrowPathIcon className="w-8 h-8 text-[#1565C0]" />
              <span className="text-sm font-bold text-[var(--color-primary)]">Transférer un lot</span>
            </Link>
            <Link href="/upload-photo" className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-2xl hover:brightness-95 transition-all text-center">
              <EyeIcon className="w-8 h-8 text-[#7B1FA2]" />
              <span className="text-sm font-bold text-[var(--color-primary)]">Photo d&apos;un lot</span>
            </Link>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}
