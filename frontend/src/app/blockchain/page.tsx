'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const mockBlocks = [
  { height: '#1204532', hash: '0x8f4...2b9a', txCount: 14, validator: 'Node_Lome_1', time: 'il y a 2s' },
  { height: '#1204531', hash: '0x3a1...9c4f', txCount: 8, validator: 'Node_Kpalime_2', time: 'il y a 15s' },
  { height: '#1204530', hash: '0x1d7...5e2b', txCount: 22, validator: 'Node_Lome_1', time: 'il y a 45s' },
  { height: '#1204529', hash: '0x9b2...8f1a', txCount: 5, validator: 'Node_Atakpame_1', time: 'il y a 1m 12s' },
  { height: '#1204528', hash: '0x4c5...1d8e', txCount: 12, validator: 'Node_Sokode_1', time: 'il y a 2m 05s' },
]

export default function BlockchainPage() {
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
            Explorateur Blockchain
          </h1>
          <p className="text-[var(--color-muted)] mt-2">
            Surveillance de l'infrastructure Hyperledger Fabric.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary flex items-center gap-2 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Actualiser
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Blocs Minés</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">1,204,532</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center text-[var(--color-secondary)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-success)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)] mr-2 animate-pulse"></span>
            Dernier: il y a 2s
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Noeuds Actifs</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">24</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-success)]">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            100% santé
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Latence Moy.</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">45ms</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-muted)]">
            Optimal
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Contrats</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">3</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-muted)]">
            Chaincodes actifs
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 mb-8">
        {/* Network Viz Placeholder */}
        <div className="flex-1 card p-6 bg-gradient-to-br from-[var(--color-primary)] to-[#1a365d] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-32 bg-[var(--color-secondary)]/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 p-32 bg-purple-500/20 rounded-full blur-[100px] -ml-20 -mb-20"></div>
          
          <h2 className="text-xl font-bold mb-6 relative z-10">Visualisation du Réseau Hyperledger</h2>
          
          <div className="h-64 flex items-center justify-center relative z-10">
            {/* Very simple mock of a network visualization using flex and borders */}
            <div className="relative w-full max-w-md aspect-video flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-[var(--color-secondary)]/20 border-2 border-[var(--color-secondary)] flex items-center justify-center absolute z-20 shadow-[0_0_30px_rgba(92,201,122,0.4)]">
                <span className="font-bold text-[var(--color-secondary)]">Orderer</span>
              </div>
              
              <div className="absolute w-full h-full border-t-2 border-dashed border-white/20 rounded-full top-1/2 -translate-y-1/2"></div>
              
              <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center absolute top-4 left-4 z-20">
                <span className="text-xs font-semibold text-blue-200">Peer 1</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center absolute top-4 right-4 z-20">
                <span className="text-xs font-semibold text-blue-200">Peer 2</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center absolute bottom-4 left-1/4 z-20">
                <span className="text-xs font-semibold text-blue-200">Peer 3</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center absolute bottom-4 right-1/4 z-20">
                <span className="text-xs font-semibold text-blue-200">Peer 4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Block Details */}
        <div className="w-full xl:w-96 card bg-white">
          <div className="card-header border-b border-[var(--color-border)]">
            <h2 className="text-title-md font-bold text-[var(--color-primary)]">
              Détails du dernier bloc
            </h2>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-[var(--color-border)]">
              <div className="w-16 h-16 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Hauteur</p>
                <p className="text-2xl font-bold text-[var(--color-primary)]">#1204532</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">HASH</p>
                <p className="text-sm font-mono text-[var(--color-earth)] bg-[var(--color-bg)] p-2 rounded truncate border border-[var(--color-border)]">0x8f4d9c7e2b9a...4f1d</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Transactions</p>
                  <p className="text-lg font-bold text-[var(--color-primary)]">14</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Taille</p>
                  <p className="text-lg font-bold text-[var(--color-primary)]">2.4 KB</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Valideur</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-success)]"></div>
                  <p className="text-sm font-semibold text-[var(--color-earth)]">Node_Lome_1</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 btn btn-secondary-outline">Voir tous les détails</button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card overflow-hidden">
        <div className="card-header flex justify-between items-center bg-white border-b border-[var(--color-border)]">
          <h2 className="text-title-md font-bold text-[var(--color-primary)]">
            Derniers Blocs Ajoutés
          </h2>
          <button className="text-sm font-bold text-[var(--color-secondary)] hover:text-[var(--color-primary)]">Voir l'historique complet →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-[var(--color-bg)] text-left">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Hauteur</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Hash</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Transactions</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Valideur</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Temps</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--color-border)]">
              {mockBlocks.map((block, idx) => (
                <tr key={idx} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[var(--color-primary)]">{block.height}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-[var(--color-muted)] bg-[var(--color-bg)] px-2 py-1 rounded border border-[var(--color-border)]">{block.hash}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-6 px-2 rounded-full text-xs font-bold bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
                      {block.txCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--color-earth)]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"></div>
                      {block.validator}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-muted)]">
                    {block.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
