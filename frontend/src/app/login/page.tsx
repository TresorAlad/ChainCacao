'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

export default function LoginPage() {
  const [useActorLogin, setUseActorLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [actorId, setActorId] = useState('')
  const [pin, setPin] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (useActorLogin) {
        await login(actorId.trim(), pin, 'actor')
      } else {
        await login(email.trim(), password, 'email')
      }
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--color-secondary)]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-[var(--color-accent)]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-[var(--color-primary)]/20 rounded-full blur-2xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex mb-6 rounded-2xl overflow-hidden shadow-xl shadow-black/20 ring-2 ring-white/15">
              <BrandLogo className="w-20 h-20" priority />
            </div>
            <h1 className="text-display-md font-bold text-white mb-2 drop-shadow-lg">
              ChainCacao
            </h1>
            <p className="text-body-md text-white/80">
              Plateforme de traçabilité cacao
            </p>
          </div>

          <div className="card p-8 md:p-10 animate-slide-in border border-white/20 bg-white/95 backdrop-blur-sm shadow-xl">
            <h2 className="text-title-lg font-semibold text-[var(--color-primary)] mb-2 text-center">
              Connexion
            </h2>
            <p className="text-body-sm text-[var(--color-muted)] text-center mb-6">
              {useActorLogin
                ? 'Identifiant acteur et PIN (comptes existants)'
                : 'Email et mot de passe (compte créé à l’inscription)'}
            </p>

            <div className="flex rounded-xl bg-[var(--color-bg)] p-1 mb-8 border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => {
                  setUseActorLogin(false)
                  setError('')
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  !useActorLogin
                    ? 'bg-white text-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-earth)]'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseActorLogin(true)
                  setError('')
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  useActorLogin
                    ? 'bg-white text-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-earth)]'
                }`}
              >
                Acteur + PIN
              </button>
            </div>

            {error && (
              <div className="alert alert-error mb-6 animate-fade-in border border-red-200">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {useActorLogin ? (
                <>
                  <div>
                    <label htmlFor="actorId" className="form-label">
                      Identifiant acteur
                    </label>
                    <input
                      id="actorId"
                      type="text"
                      value={actorId}
                      onChange={(e) => setActorId(e.target.value)}
                      className="form-input"
                      placeholder="Ex. ID attribué par l’administrateur"
                      autoComplete="username"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="pin" className="form-label">
                      PIN
                    </label>
                    <div className="relative">
                      <input
                        id="pin"
                        type={showSecret ? 'text' : 'password'}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="form-input pr-12"
                        placeholder="Votre PIN"
                        autoComplete="current-password"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-earth)] transition-colors"
                        disabled={isLoading}
                        aria-label={showSecret ? 'Masquer' : 'Afficher'}
                      >
                        {showSecret ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="email" className="form-label">
                      Adresse email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      placeholder="votre.adresse@email"
                      autoComplete="email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="form-label">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showSecret ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input pr-12"
                        placeholder="Votre mot de passe"
                        autoComplete="current-password"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-earth)] transition-colors"
                        disabled={isLoading}
                        aria-label={showSecret ? 'Masquer' : 'Afficher'}
                      >
                        {showSecret ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full justify-center py-3 text-body-md"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connexion…
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
              <p className="text-body-sm text-[var(--color-muted)] text-center">
                Pas encore de compte ?{' '}
                <Link href="/register" className="text-[var(--color-primary)] font-medium hover:underline">
                  Créer un compte agriculteur
                </Link>
              </p>
            </div>
          </div>

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
