'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '@/components/BrandLogo'
import { getRoleBasedRedirect } from '@/lib/role-utils'
import type { UserRole } from '@/lib/role-utils'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { clearPinSession, markPinUnlocked } from '@/lib/pin-session'
import { getErrorMessage } from '@/lib/error-utils'

export default function PinUnlockPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pin.length !== 4) {
      setError('Saisissez les 4 chiffres de votre code PIN.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/verify-pin', { pin })
      markPinUnlocked()
      const role = (user?.role ?? 'agriculteur') as UserRole
      router.replace(getRoleBasedRedirect(role))
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Code PIN incorrect'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-lg">
        <BrandLogo className="w-14 h-14 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--color-primary)] text-center mb-2">Code PIN</h1>
        <p className="text-[var(--color-muted)] text-center text-sm mb-6">
          Saisissez le code PIN défini à l&apos;inscription pour accéder à ChainCacao.
        </p>

        {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="pin" className="form-label form-label-required">
              Code PIN (4 chiffres)
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="form-input text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="0000"
              autoComplete="off"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-secondary w-full justify-center py-3 text-white"
          >
            {loading ? 'Vérification…' : "Accéder à l'application"}
          </button>
        </form>

        <button
          type="button"
          className="mt-6 w-full text-sm text-[var(--color-muted)] hover:underline"
          onClick={() => {
            clearPinSession()
            logout()
            router.replace('/login')
          }}
        >
          Utiliser un autre compte
        </button>
      </div>
    </div>
  )
}
