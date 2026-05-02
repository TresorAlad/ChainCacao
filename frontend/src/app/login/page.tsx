'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { getRoleBasedRedirect, getRoleDisplayName } from '@/lib/role-utils'
import type { UserRole } from '@/lib/role-themes'
import { getErrorMessage } from '@/lib/error-utils'

export default function LoginPage() {
  const [useActorLogin, setUseActorLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [actorId, setActorId] = useState('')
  const [pin, setPin] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated, loading: authLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user?.role) return
    router.replace(getRoleBasedRedirect(user.role as UserRole))
  }, [authLoading, isAuthenticated, user?.role, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const user = useActorLogin
        ? await login(actorId.trim(), pin, 'actor')
        : await login(email.trim(), password, 'email')

      // Rediriger vers le dashboard approprié selon le rôle
      const redirectPath = getRoleBasedRedirect(user.role)
      router.replace(redirectPath)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Identifiants invalides'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex w-1/2 relative bg-[var(--color-primary)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
        <img 
          src="https://www.republicoftogo.com/var/site/storage/images/toutes-les-rubriques/eco-finance/des-filieres-cafe-cacao-plus-performantes/2992710-1-fre-FR/des-filieres-cafe-cacao-plus-performantes_i1920.jpg" 
          alt="Plantation Cacao" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
        />
        <div className="relative z-20 flex flex-col justify-end p-12 text-white h-full">
          <BrandLogo className="w-16 h-16 mb-6" priority />
          <h1 className="text-display-md font-bold mb-4">
            {"L'excellence du cacao togolais, certifiée par la blockchain."}
          </h1>
          <p className="text-body-lg text-white/80 max-w-md">
            Plateforme de traçabilité sécurisée pour tous les acteurs de la filière cacao au Togo.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-10">
            <BrandLogo className="w-12 h-12 mb-4" />
            <h1 className="text-2xl font-bold text-[var(--color-primary)]">ChainCacao</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-2">
              Connexion
            </h2>
            <p className="text-[var(--color-muted)]">
              {useActorLogin
                ? 'Saisissez votre ID Acteur et PIN pour continuer.'
                : 'Saisissez vos identifiants pour accéder à votre compte.'}
            </p>
          </div>

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
              Administrateur
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
              Acteur / Agriculteur
            </button>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              <svg className="w-5 h-5 flex-shrink-0 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>
                {error.toLowerCase().includes('not found') || error.toLowerCase().includes('page could not')
                  ? 'Le serveur API est inaccessible. Vérifiez la configuration Vercel (API_REWRITE_TARGET).'
                  : error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {useActorLogin ? (
              <>
                <div className="form-group">
                  <label htmlFor="actorId" className="form-label form-label-required">
                    Identifiant acteur
                  </label>
                  <input
                    id="actorId"
                    type="text"
                    value={actorId}
                    onChange={(e) => setActorId(e.target.value)}
                    className="form-input"
                    placeholder="Ex. A-12345"
                    autoComplete="username"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pin" className="form-label form-label-required">
                    Code PIN
                  </label>
                  <div className="relative">
                    <input
                      id="pin"
                      type={showSecret ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="form-input pr-12"
                      placeholder="••••"
                      autoComplete="current-password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-earth)] transition-colors"
                      disabled={isLoading}
                    >
                      {showSecret ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="email" className="form-label form-label-required">
                    Adresse email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="admin@chaincacao.tg"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="form-label mb-0 form-label-required">
                      Mot de passe
                    </label>
                    <a href="#" className="text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-secondary-dark)]">
                      Mot de passe oublié ?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showSecret ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input pr-12"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-earth)] transition-colors"
                      disabled={isLoading}
                    >
                      {showSecret ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-secondary w-full justify-center py-3 text-base text-white"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : null}
                Se connecter
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-body-sm text-[var(--color-muted)]">
              {"Vous n'avez pas de compte ?"}{' '}
              <Link href="/register" className="text-[var(--color-secondary)] font-semibold hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
