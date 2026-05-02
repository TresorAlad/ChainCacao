'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const mockTransactions = [
  { id: '0x7a2...8b9f', date: '24 Oct 2023, 14:32', sender: 'Coopérative Kpalimé', receiver: 'Exportateur Lomé', amount: '2,500 Kg', value: '1.5M CFA', status: 'VALIDÉ' },
  { id: '0x9b4...2c1e', date: '24 Oct 2023, 11:15', sender: 'Prod. Indép. K. Koffi', receiver: 'Station de Collecte A', amount: '450 Kg', value: '250K CFA', status: 'EN COURS' },
  { id: '0x3c8...9a4d', date: '24 Oct 2023, 09:04', sender: 'Coopérative Sud', receiver: 'Port de Lomé', amount: '12,000 Kg', value: '8.2M CFA', status: 'VALIDÉ' },
  { id: '0x1f5...6e7a', date: '23 Oct 2023, 16:45', sender: 'Station Collecte A', receiver: 'Transformateur Local', amount: '1,200 Kg', value: '700K CFA', status: 'REJETÉ' },
  { id: '0x8d2...3f5b', date: '23 Oct 2023, 11:20', sender: 'Union Agricole Est', receiver: 'Silo National', amount: '5,000 Kg', value: '3.1M CFA', status: 'VALIDÉ' },
]

export default function TransactionsPage() {
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
            Historique des Transactions
          </h1>
          <p className="text-[var(--color-muted)] mt-2">
            Registre immuable de tous les échanges de la filière cacao en temps réel.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary-outline bg-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filtrer par date
          </button>
          <button className="btn btn-secondary flex items-center gap-2 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Exporter CSV
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Total Transactions</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">12,450</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center text-[var(--color-secondary)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-success)]">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            +5% ce mois-ci
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Valeur Totale</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">850M <span className="text-xl">CFA</span></h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-success)]">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            15% croissance
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Taux d&apos;erreur</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">0.02%</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-muted)]">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            Stable
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">État du réseau</p>
              <h3 className="text-3xl font-bold text-[var(--color-primary)]">En ligne</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-[var(--color-success)]">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Opérationnel
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card overflow-hidden">
        <div className="card-header flex justify-between items-center bg-white border-b border-[var(--color-border)]">
          <h2 className="text-title-md font-bold text-[var(--color-primary)]">
            Toutes les transactions
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <button className="w-8 h-8 rounded border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg)]">&lt;</button>
            <span className="text-[var(--color-muted)]">Page 1 sur 1245</span>
            <button className="w-8 h-8 rounded border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg)]">&gt;</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-[var(--color-bg)] text-left">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">ID Transaction</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Date & Heure</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Expéditeur</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Destinataire</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">Montant (CFA)</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b">État</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--color-border)]">
              {mockTransactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-[var(--color-muted)]">{tx.id}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-muted)]">{tx.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--color-earth)]">{tx.sender}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--color-earth)]">{tx.receiver}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-[var(--color-primary)]">{tx.amount}</div>
                    <div className="text-xs text-[var(--color-muted)]">{tx.value}</div>
                  </td>
                  <td className="px-6 py-4">
                    {tx.status === 'VALIDÉ' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        VALIDÉ
                      </span>
                    )}
                    {tx.status === 'EN COURS' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                        EN COURS
                      </span>
                    )}
                    {tx.status === 'REJETÉ' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                        REJETÉ
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--color-border)] text-sm text-[var(--color-muted)] text-center">
          Affichage de 1 à 5 sur 12,450 transactions identifiées sur la blockchain.
        </div>
      </div>
    </div>
  )
}
