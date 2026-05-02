'use client'

import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { useAuth } from '@/contexts/AuthContext'

export default function CompteApplicationMobilePage() {
  const { logout, user } = useAuth()

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center p-8">
      <BrandLogo className="w-16 h-16 mb-6" />
      <div className="max-w-md w-full rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-3">Application mobile</h1>
        <p className="text-[var(--color-earth)] leading-relaxed mb-6">
          Lors de votre inscription, vous avez indiqué utiliser principalement l’application mobile ChainCacao.
          Les écrans de gestion détaillée sur ce site web ne sont pas proposés pour ce profil.
        </p>
        {user?.email && (
          <p className="text-sm text-[var(--color-muted)] mb-6">
            Compte : <span className="font-medium text-[var(--color-earth)]">{user.email}</span>
          </p>
        )}
        <div className="flex flex-col gap-3">
          <button type="button" className="btn btn-secondary w-full justify-center text-white" onClick={() => logout()}>
            Se déconnecter
          </button>
          <Link href="/login" className="btn btn-outline w-full justify-center text-center">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
