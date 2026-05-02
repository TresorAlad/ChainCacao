'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { EyeIcon, EyeOffIcon, MapPinIcon } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { UserRole, getRoleBasedRedirect } from '@/lib/role-utils'

function orgLabelForRole(role: UserRole): string {
  switch (role) {
    case 'cooperative':
    case 'verificateur':
      return "Nom de l'organisation / Coopérative"
    case 'transformateur':
      return "Nom de l'organisation / Transformateur"
    case 'distributeur':
    case 'exportateur':
      return "Nom de l'organisation / Export"
    default:
      return "Nom de l'organisation"
  }
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('agriculteur')
  const [gpsLocation, setGpsLocation] = useState('')
  const [fieldSurface, setFieldSurface] = useState('')
  const [orgName, setOrgName] = useState('')
  const [usePin, setUsePin] = useState(false)
  const [pinCode, setPinCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const { register } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!error) return
    errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [error])

  const fillGps = () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n’est pas disponible dans ce navigateur.')
      return
    }
    setGeoLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
        setGeoLoading(false)
      },
      () => {
        setError(
          'Impossible d’obtenir la position. Autorisez la localisation ou saisissez les coordonnées (ex. 6.1319, 1.2228).'
        )
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Veuillez remplir le nom, l’email et le mot de passe.')
      return
    }
    const emailNorm = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      setError('Indiquez une adresse email valide (ex. nom@domaine.com).')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (usePin && pinCode.trim().length !== 4) {
      setError('Le code PIN doit contenir 4 chiffres.')
      return
    }
    if (!gpsLocation.trim()) {
      setError('Indiquez une localisation (bouton GPS ou saisie manuelle).')
      return
    }

    setIsLoading(true)
    try {
      const jwtRole = await register(emailNorm, password, name, role, {
        gps_location: gpsLocation.trim(),
        field_surface: role === 'agriculteur' ? fieldSurface.trim() : undefined,
        org_name: role !== 'agriculteur' ? orgName.trim() : undefined,
        pin_code: usePin ? pinCode.trim() : undefined,
        preferred_client: 'web',
      })
      router.replace(getRoleBasedRedirect(jwtRole))
    } catch (err: unknown) {
      let message = 'Erreur lors de la création du compte'
      if (err instanceof Error && err.message) {
        message = err.message
      } else if (typeof err === 'string' && err.trim()) {
        message = err
      }
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <div className="hidden lg:flex w-1/2 relative bg-[var(--color-primary)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        <img
          src="https://www.republicoftogo.com/var/site/storage/images/toutes-les-rubriques/eco-finance/des-filieres-cafe-cacao-plus-performantes/2992710-1-fre-FR/des-filieres-cafe-cacao-plus-performantes_i1920.jpg"
          alt="Plantation Cacao"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
        />
        <div className="relative z-20 flex flex-col justify-end p-12 text-white h-full">
          <BrandLogo className="w-16 h-16 mb-6" priority />
          <h1 className="text-display-md font-bold mb-4">Rejoignez la révolution de la traçabilité.</h1>
          <p className="text-body-lg text-white/80 max-w-md">
            Inscrivez-vous pour participer à la filière cacao transparente et certifiée du Togo.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col lg:max-h-screen lg:overflow-y-auto p-8 sm:p-12 pt-8 sm:pt-12 pb-16">
        <div className="w-full max-w-lg mx-auto animate-fade-in shrink-0">
          <div className="lg:hidden mb-8">
            <BrandLogo className="w-12 h-12 mb-4" />
            <h1 className="text-2xl font-bold text-[var(--color-primary)]">ChainCacao</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-2">Créer un compte</h2>
            <p className="text-[var(--color-muted)]">Inscription pour accéder au site web ChainCacao.</p>
          </div>

          {error && (
            <div ref={errorRef} className="alert alert-error mb-6 scroll-mt-4 lg:sticky lg:top-0 lg:z-20 lg:shadow-md rounded-xl">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label htmlFor="name" className="form-label form-label-required">
                Nom complet
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Nom et prénom"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group scroll-mt-6 rounded-xl ring-2 ring-[var(--color-primary)]/15 bg-[var(--color-bg)]/40 p-3 sm:p-4">
              <label htmlFor="email" className="form-label form-label-required">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input border-[var(--color-primary)]/25 focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/30"
                placeholder="nom@exemple.com"
                autoComplete="email"
                aria-required="true"
                disabled={isLoading}
              />
              <p className="form-hint mt-1">Ce champ est en haut du formulaire : vérifiez-le avant de valider.</p>
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label form-label-required">
                Votre rôle
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="form-input"
                required
                disabled={isLoading}
              >
                <option value="agriculteur">Agriculteur</option>
                <option value="cooperative">Coopérative</option>
                <option value="verificateur">Vérificateur (Coopérative)</option>
                <option value="transformateur">Transformateur</option>
                <option value="exportateur">Exportateur</option>
                <option value="distributeur">Distributeur</option>
              </select>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-4 space-y-4">
              {role === 'agriculteur' ? (
                <div className="form-group mb-0">
                  <label htmlFor="surface" className="form-label">
                    Surface du champ (hectares)
                  </label>
                  <input
                    id="surface"
                    type="text"
                    inputMode="decimal"
                    value={fieldSurface}
                    onChange={(e) => setFieldSurface(e.target.value)}
                    className="form-input"
                    placeholder="Ex. 2.5"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="form-group mb-0">
                  <label htmlFor="orgName" className="form-label">
                    {orgLabelForRole(role)}
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="form-input"
                    placeholder="Nom officiel"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="form-group mb-0">
                <label htmlFor="gps" className="form-label form-label-required">
                  {role === 'agriculteur' ? 'Localisation du champ' : 'Localisation du siège'}
                </label>
                <div className="flex gap-2">
                  <input
                    id="gps"
                    type="text"
                    value={gpsLocation}
                    onChange={(e) => setGpsLocation(e.target.value)}
                    className="form-input flex-1"
                    placeholder="Latitude, longitude"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={fillGps}
                    disabled={isLoading || geoLoading}
                    className="btn btn-outline flex-shrink-0 px-3"
                    title="Utiliser ma position"
                  >
                    {geoLoading ? (
                      <span className="animate-pulse text-sm">…</span>
                    ) : (
                      <MapPinIcon className="w-5 h-5 text-[var(--color-primary)]" />
                    )}
                  </button>
                </div>
                <p className="form-hint">Comme sur mobile : GPS ou coordonnées au format décimal.</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label form-label-required">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pr-12"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-earth)] transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <p className="form-hint">Minimum 8 caractères</p>
            </div>

            <div className="form-group">
              <label htmlFor="confirm" className="form-label form-label-required">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input pr-12"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-earth)] transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-primary)]/5 p-4 space-y-3">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Sécurisation du compte</p>
              <p className="text-body-sm text-[var(--color-muted)]">
                La connexion par empreinte sur l’appareil est disponible dans l’application mobile ChainCacao.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePin}
                  onChange={(e) => setUsePin(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="text-sm text-[var(--color-earth)]">Définir un code PIN (connexion acteur / app)</span>
              </label>
              {usePin && (
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    className="form-input pr-12 text-center tracking-widest font-mono"
                    placeholder="0000"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                    disabled={isLoading}
                  >
                    {showPin ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-secondary w-full justify-center py-3 text-base text-white"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  'Créer mon compte'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-body-sm text-[var(--color-muted)]">
              Déjà inscrit ?{' '}
              <Link href="/login" className="text-[var(--color-secondary)] font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
