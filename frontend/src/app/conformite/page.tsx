'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const mockConformite = [
  { actor: "Coopérative N'Zérékoré", type: 'Producteur', score: '98%', status: 'Conforme' },
  { actor: "K. Koffi", type: 'Agriculteur', score: '95%', status: 'Conforme' },
  { actor: "Exportateur Lomé", type: 'Exportateur', score: '82%', status: 'À vérifier' },
  { actor: "Coopérative Sud", type: 'Producteur', score: '91%', status: 'Conforme' },
  { actor: "Transformateur Local", type: 'Transformateur', score: '65%', status: 'Non conforme' },
]

export default function ConformitePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

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
      <header className="page-header animate-fade-in flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">
            Conformité EUDR
          </h1>
          <p className="text-[var(--color-muted)] mt-2">
            Suivi du respect des réglementations européennes contre la déforestation.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Générer Rapport
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Taux de Conformité</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">94%</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center text-[var(--color-secondary)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-success)]">
            Objectif: 100%
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Certificats Valides</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">342</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-muted)]">
            23 en attente
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Zones à Risque</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">12</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-orange-500">
            Niveau d'alerte moyen
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Inspections</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">45</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-muted)]">
            Ce trimestre
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Table */}
        <div className="flex-1 card overflow-hidden flex flex-col">
          <div className="card-header border-b border-[var(--color-border)]">
            <h2 className="text-title-md font-bold text-[var(--color-primary)]">
              Statut des acteurs
            </h2>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-[var(--color-bg)] text-left">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Acteur</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Score EUDR</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Statut</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b text-right">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[var(--color-border)]">
                {mockConformite.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-[var(--color-primary)]">{item.actor}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-muted)]">{item.type}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[var(--color-earth)]">{item.score}</td>
                    <td className="px-6 py-4">
                      {item.status === 'Conforme' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {item.status}
                        </span>
                      )}
                      {item.status === 'À vérifier' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                          {item.status}
                        </span>
                      )}
                      {item.status === 'Non conforme' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm font-bold text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors">
                        Examiner
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Map */}
        <div className="w-full xl:w-1/3 card p-6 bg-white flex flex-col">
          <h2 className="text-title-md font-bold text-[var(--color-primary)] mb-2">Cartographie des risques</h2>
          <p className="text-sm text-[var(--color-muted)] mb-6">Vue satellite des zones de production.</p>
          
          <div className="flex-1 min-h-[300px] w-full bg-[var(--color-bg)] rounded-xl relative overflow-hidden border border-[var(--color-border)] flex flex-col">
            {/* Mock Map Image */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 opacity-50"></div>
            
            {/* Map Grid Pattern */}
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* Mock Map Points */}
            <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-[var(--color-success)] shadow-[0_0_10px_rgba(34,197,94,0.8)] border-2 border-white"></div>
            <div className="absolute top-1/3 left-1/2 w-4 h-4 rounded-full bg-[var(--color-warning)] shadow-[0_0_10px_rgba(245,158,11,0.8)] border-2 border-white"></div>
            <div className="absolute top-1/2 left-1/3 w-3 h-3 rounded-full bg-[var(--color-success)] shadow-[0_0_10px_rgba(34,197,94,0.8)] border-2 border-white"></div>
            <div className="absolute bottom-1/3 right-1/4 w-5 h-5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] border-2 border-white animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/2 w-3 h-3 rounded-full bg-[var(--color-success)] shadow-[0_0_10px_rgba(34,197,94,0.8)] border-2 border-white"></div>

            {/* Map UI Overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-[var(--color-border)] shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]"></span>
                  <span className="text-[var(--color-earth)]">Zone sûre</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]"></span>
                  <span className="text-[var(--color-earth)]">À surveiller</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-[var(--color-earth)]">Risque élevé</span>
                </div>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-6 btn btn-secondary-outline text-sm">
            Ouvrir la carte détaillée
          </button>
        </div>
      </div>
    </div>
  )
}
