'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import api from '@/lib/api'
import { WalletIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

type WalletTx = {
  id: string
  type: 'depot' | 'retrait' | 'paiement'
  montant: number
  date: string
  reference?: string
}

export default function PortefeuillePage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const [balance, setBalance] = useState<number | null>(null)
  const [currency, setCurrency] = useState('FCFA')
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [montant, setMontant] = useState('')
  const [pin, setPin] = useState('')
  const [operateur, setOperateur] = useState<'flooz' | 'tmoney'>('flooz')
  const [submitting, setSubmitting] = useState(false)
  const [transactions, setTransactions] = useState<WalletTx[]>([])

  const allowedRoles: string[] = ['agriculteur', 'cooperative', 'transformateur', 'exportateur', 'ministere', 'admin']

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  const fetchBalance = () => {
    setBalanceLoading(true)
    api
      .get<{ success: boolean; balance: number; currency?: string }>('/portefeuille/solde')
      .then((res) => {
        setBalance(res.data.balance)
        setCurrency(res.data.currency || 'FCFA')
      })
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false))
  }

  const fetchHistorique = () => {
    api
      .get<{
        success: boolean
        transactions: {
          id: number
          kind: string
          amount: number
          lot_id?: string
          list_id?: string
          created_at: string
        }[]
      }>('/portefeuille/historique')
      .then((res) => {
        const rows = (res.data.transactions || []).map((t) => ({
          id: String(t.id),
          type: (t.amount >= 0 ? 'depot' : 'retrait') as WalletTx['type'],
          montant: Math.abs(t.amount),
          date: t.created_at,
          reference: t.lot_id || t.list_id || t.kind,
        }))
        setTransactions(rows)
      })
      .catch(() => setTransactions([]))
  }

  useEffect(() => {
    if (!isAuthenticated || !user?.role || !allowedRoles.includes(user.role)) return
    fetchBalance()
    fetchHistorique()
    const welcome = sessionStorage.getItem('chaincacao_wallet_welcome')
    if (welcome) {
      sessionStorage.removeItem('chaincacao_wallet_welcome')
      toast.success(welcome, { duration: 6000 })
    }
  }, [isAuthenticated, user])

  const handleDepot = async () => {
    const m = parseFloat(montant)
    if (!m || m <= 0) {
      toast.error('Montant invalide')
      return
    }
    if (!pin || pin.length !== 4) {
      toast.error('PIN à 4 chiffres requis')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post<{ success: boolean; tx_hash?: string; message?: string }>('/portefeuille/depot', {
        montant: m,
        pin,
      })
      toast.success(res.data.message || 'Dépôt effectué')
      setTransactions((t) => [
        { id: res.data.tx_hash || Date.now().toString(), type: 'depot', montant: m, date: new Date().toISOString(), reference: operateur },
        ...t,
      ])
      setMontant('')
      setPin('')
      fetchBalance()
      fetchHistorique()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Échec du dépôt')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetrait = async () => {
    const m = parseFloat(montant)
    if (!m || m <= 0) {
      toast.error('Montant invalide')
      return
    }
    if (!pin || pin.length !== 4) {
      toast.error('PIN à 4 chiffres requis')
      return
    }
    if (balance != null && m > balance) {
      toast.error('Solde insuffisant — rechargez votre portefeuille')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post<{ success: boolean; tx_hash?: string; message?: string }>('/portefeuille/retrait', {
        montant: m,
        pin,
      })
      toast.success(res.data.message || 'Retrait effectué')
      setTransactions((t) => [
        { id: res.data.tx_hash || Date.now().toString(), type: 'retrait', montant: m, date: new Date().toISOString(), reference: operateur },
        ...t,
      ])
      setMontant('')
      setPin('')
      fetchBalance()
      fetchHistorique()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Échec du retrait')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#33691E] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user?.role || !allowedRoles.includes(user.role)) return null

  return (
    <RoleLayout
      role={
        user.role === 'admin'
          ? 'admin'
          : user.role === 'ministere'
            ? 'ministere'
            : user.role === 'agriculteur'
              ? 'agriculteur'
              : user.role === 'exportateur'
                ? 'exportateur'
                : user.role === 'transformateur'
                  ? 'transformateur'
                  : 'cooperative'
      }
    >
      <div className="w-full py-6 sm:py-8 max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)] flex items-center gap-3">
            <WalletIcon className="w-10 h-10 text-[#33691E]" />
            Portefeuille
          </h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Solde, dépôt et retrait Mobile Money (Flooz / T-Money).
          </p>
        </header>

        <div className="bg-gradient-to-br from-[#1B3A0F] to-[#33691E] rounded-[2rem] p-8 text-white shadow-xl mb-8">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Solde disponible</p>
          <p className="text-4xl font-black mt-2">
            {balanceLoading ? '—' : balance != null ? balance.toLocaleString('fr-FR') : '—'}{' '}
            <span className="text-lg opacity-80">{currency}</span>
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] mb-8 space-y-6">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Opérateur</label>
            <select
              value={operateur}
              onChange={(e) => setOperateur(e.target.value as 'flooz' | 'tmoney')}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-sm"
            >
              <option value="flooz">Flooz (Moov)</option>
              <option value="tmoney">T-Money (Togocel)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Montant (FCFA)</label>
            <input
              type="number"
              min="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-sm"
              placeholder="Ex: 50000"
            />
          </div>
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Code PIN (4 chiffres)</label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-sm tracking-widest"
              placeholder="••••"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleDepot}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#33691E] text-white rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Dépôt
            </button>
            <button
              type="button"
              onClick={handleRetrait}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#33691E] text-[#33691E] rounded-xl font-bold text-sm hover:bg-[#F1F8E9] disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
              Retrait
            </button>
          </div>
        </div>

        {transactions.length > 0 && (
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
            <h2 className="text-lg font-black text-[var(--color-primary)] mb-4">Historique (session)</h2>
            <ul className="space-y-3">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex justify-between items-center p-4 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-sm font-bold capitalize">{tx.type}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleString('fr-FR')}</p>
                  </div>
                  <p className={`font-black ${tx.type === 'retrait' ? 'text-red-600' : 'text-green-700'}`}>
                    {tx.type === 'retrait' ? '-' : '+'}
                    {tx.montant.toLocaleString('fr-FR')} FCFA
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </RoleLayout>
  )
}
