'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

export default function LoginPage() {
  const [actorId, setActorId] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(actorId, pin)
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--color-secondary)]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-[var(--color-accent)]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-[var(--color-primary)]/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-lg shadow-[var(--color-primary)]/30 mb-6 border border-white/10">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-display-md font-bold text-white mb-2 drop-shadow-lg">
              ChainCacao
            </h1>
            <p className="text-body-md text-white/80">
              Plateforme de traçabilité cacao
            </p>
          </div>

          {/* Card */}
          <div className="card p-8 md:p-10 animate-slide-in border border-white/20 bg-white/95 backdrop-blur-sm">
            <h2 className="text-title-lg font-semibold text-[var(--color-primary)] mb-2 text-center">
              Connexion
            </h2>
            <p className="text-body-sm text-[var(--color-muted)] text-center mb-8">
              Accédez à votre espace de gestion
            </p>

            {error && (
              <div className="alert alert-error mb-6 animate-fade-in border border-red-200">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="actorId" className="form-label">
                  Actor ID
                </label>
                <input
                  id="actorId"
                  type="text"
                  value={actorId}
                  onChange={(e) => setActorId(e.target.value)}
                  className="form-input"
                  placeholder="ex: actor-agri-001"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="pin" className="form-label">
                  PIN / Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="form-input pr-12"
                    placeholder="Entrez votre PIN"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-earth)] transition-colors"
                    disabled={isLoading}
                  >
                    {showPin ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full justify-center py-3 text-body-md"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connexion en cours...
                    </>
                  ) : (
                    'Se Connecter'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
              <p className="text-body-sm text-[var(--color-muted)] text-center">
                Besoin d'un compte administrateur ?{' '}
                <a href="/register" className="text-[var(--color-primary)] font-medium hover:underline">
                  Créer un compte
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 animate-fade-in">
            <p className="text-caption text-white/50">
              © 2026 ChainCacao. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}