'use client'

import type { ReactNode } from 'react'
import { isAdminRole } from '@/lib/role-nav'

type AdminGateProps = {
  role: string | undefined
  children: ReactNode
}

export function AdminGate({ role, children }: AdminGateProps) {
  if (!isAdminRole(role)) {
    return (
      <div className="w-full py-6 sm:py-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-700 font-bold text-lg">Accès réservé à l&apos;administrateur</p>
          <p className="text-red-600 mt-2 text-sm">
            Cette section permet de gérer les utilisateurs, les marges coopératives et la configuration du système.
          </p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
