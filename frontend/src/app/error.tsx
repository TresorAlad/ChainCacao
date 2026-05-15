'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Une erreur est survenue</h1>
        <p className="text-[var(--color-muted)]">
          Le chargement de cette page a échoué. Vous pouvez réessayer ou retourner à l&apos;accueil.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button type="button" onClick={() => reset()} className="btn btn-secondary text-white">
            Réessayer
          </button>
          <Link href="/" className="btn btn-outline">
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
