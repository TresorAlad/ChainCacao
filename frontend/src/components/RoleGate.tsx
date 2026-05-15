'use client'

import type { ReactNode } from 'react'
import { canAccessRoute } from '@/lib/role-nav'

type RoleGateProps = {
  role: string | undefined
  path: string
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGate({ role, path, children, fallback }: RoleGateProps) {
  if (!canAccessRoute(role, path)) {
    return (
      fallback ?? (
        <div className="w-full py-6 sm:py-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-700 font-bold text-lg">Accès non autorisé</p>
            <p className="text-red-600 mt-2 text-sm">
              Votre rôle ({role || '—'}) n&apos;a pas accès à cette page.
            </p>
          </div>
        </div>
      )
    )
  }
  return <>{children}</>
}
