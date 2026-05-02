'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CubeIcon } from '@heroicons/react/24/outline'
import type { DashboardStats } from '@/lib/dashboard-stats'

const mockLots = [
  { id: '4CB-3409-A45', agriculteur: 'Koffi Mensah', poids: '430.00', date: '12/05/2024', statut: 'VÉRIFIÉ', eudr: true },
  { id: '4CB-3409-A46', agriculteur: 'Adjoa Lawson', poids: '520.50', date: '11/05/2024', statut: 'EN COURS', eudr: false },
  { id: '4CB-3409-A47', agriculteur: 'Kossi Azan', poids: '810.25', date: '10/05/2024', statut: 'VÉRIFIÉ', eudr: true },
  { id: '4CB-3409-A48', agriculteur: 'Yaozi Osei', poids: '210.00', date: '09/05/2024', statut: 'REJETÉ', eudr: false },
  { id: '4CB-3409-A49', agriculteur: 'Amet Sado', poids: '410.00', date: '08/05/2024', statut: 'VÉRIFIÉ', eudr: true },
]

export default function LotsPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [selectedLot, setSelectedLot] = useState(mockLots[0])

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header animate-fade-in flex justify-between items-start mb-6">
        <div>
          <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Pages / Lots de cacao</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">
            Gestion des lots
          </h1>
        </div>
        <div className="flex gap-3">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Rechercher un lot..."
              className="form-input pl-10 w-64 rounded-full border-[var(--color-border)]"
            />
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center bg-white text-[var(--color-primary)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          </button>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main List Section */}
        <div className="flex-1 card p-6">
          <div className="flex justify-between items-start mb-6 border-b border-[var(--color-border)] pb-6">
            <div>
              <h2 className="text-title-lg font-bold text-[var(--color-primary)]">Inventaire des récoltes</h2>
              <p className="text-sm text-[var(--color-muted)] mt-1">128 lots enregistrés ce mois-ci.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Tonnage Total</p>
                <div className="flex items-baseline gap-2 justify-end">
                  <h3 className="text-3xl font-bold text-[var(--color-primary)]">1,248.5</h3>
                  <span className="text-sm font-medium text-[var(--color-primary)]">Tonnes</span>
                </div>
                <div className="flex items-center justify-end text-xs font-medium text-[var(--color-success)] mt-1">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  +8% depuis le mois dernier
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center text-[var(--color-secondary)] hidden md:flex">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button className="btn btn-sm btn-primary-outline bg-white text-[var(--color-primary)] border-[var(--color-border)]">Tous les statuts</button>
              <button className="btn btn-sm btn-primary-outline bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border-transparent font-semibold">Vérifiés</button>
            </div>
            <Link href="/nouveau-lot" className="btn btn-secondary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Nouveau Lot
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full border-collapse">
              <thead className="bg-white text-left border-b-2 border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Lot ID</th>
                  <th className="px-4 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Agriculteur</th>
                  <th className="px-4 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Poids (kg)</th>
                  <th className="px-4 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Date Récolte</th>
                  <th className="px-4 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[var(--color-border)]">
                {mockLots.map((lot, idx) => (
                  <tr 
                    key={idx} 
                    className={`hover:bg-[var(--color-bg)]/50 transition-colors cursor-pointer ${selectedLot.id === lot.id ? 'bg-[var(--color-secondary)]/5' : ''}`}
                    onClick={() => setSelectedLot(lot)}
                  >
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-[var(--color-primary)]">{lot.id.split('-')[0]}</div>
                      <div className="text-xs font-medium text-[var(--color-muted)]">{lot.id.substring(4)}</div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-[var(--color-earth)]">
                      {lot.agriculteur}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-[var(--color-primary)]">
                      {lot.poids}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-muted)]">
                      {lot.date}
                    </td>
                    <td className="px-4 py-4">
                      {lot.statut === 'VÉRIFIÉ' && (
                        <span className="inline-flex items-center justify-center w-24 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                          {lot.statut}
                        </span>
                      )}
                      {lot.statut === 'EN COURS' && (
                        <span className="inline-flex items-center justify-center w-24 px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                          {lot.statut}
                        </span>
                      )}
                      {lot.statut === 'REJETÉ' && (
                        <span className="inline-flex items-center justify-center w-24 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          {lot.statut}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="text-sm font-bold text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors">
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--color-border)]">
            <span className="text-sm font-medium text-[var(--color-muted)]">Page 1 sur 29</span>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--color-border)] text-[var(--color-muted)]">&lt;</button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-secondary)] text-white font-bold">1</button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--color-border)] text-[var(--color-primary)] font-bold">2</button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--color-border)] text-[var(--color-primary)] font-bold">3</button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--color-border)] text-[var(--color-primary)] font-bold">&gt;</button>
            </div>
          </div>
        </div>

        {/* Right Drawer - Details */}
        <div className="w-full xl:w-[400px] flex-shrink-0 card p-6 bg-white relative">
          <button className="absolute top-4 right-4 text-[var(--color-muted)] hover:text-[var(--color-primary)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">Détails du Lot</h2>
          
          <div className="p-4 rounded-xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/5 flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase mb-1">Identifiant Unique</p>
              <p className="text-lg font-bold text-[var(--color-primary)]">{selectedLot.id}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white border border-[var(--color-border)] flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2z" />
              </svg>
            </div>
          </div>

          <h3 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-6">Parcours de traçabilité</h3>
          
          <div className="relative pl-6 border-l-2 border-[var(--color-border)] space-y-8 mb-10">
            <div className="relative">
              <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full border-4 border-white bg-[var(--color-secondary)] shadow"></div>
              <h4 className="text-sm font-bold text-[var(--color-primary)]">Traitement usine</h4>
              <p className="text-xs text-[var(--color-muted)] mt-1">14/05/2024</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full border-4 border-white bg-[var(--color-secondary)] shadow"></div>
              <h4 className="text-sm font-bold text-[var(--color-primary)]">Transport vers Port Lome</h4>
              <p className="text-xs font-medium text-[var(--color-earth)] mt-1">Logistique Rapide SARL</p>
              <p className="text-xs text-[var(--color-muted)] mt-1">13/05/2024</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full border-4 border-white bg-[var(--color-secondary)] shadow"></div>
              <h4 className="text-sm font-bold text-[var(--color-primary)]">Récolte enregistrée</h4>
              <p className="text-xs font-medium text-[var(--color-earth)] mt-1">{selectedLot.agriculteur}</p>
              <p className="text-xs text-[var(--color-muted)] mt-1">{selectedLot.date}</p>
            </div>
          </div>

          <button className="w-full btn btn-primary flex items-center justify-center gap-2 py-3 shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Télécharger le Manifeste PDF
          </button>
        </div>
      </div>
    </div>
  )
}
