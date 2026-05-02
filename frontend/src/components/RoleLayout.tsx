'use client'

import { ReactNode } from 'react'

interface RoleLayoutProps {
  children: ReactNode
  /** Rôle du tableau de bord (attribut `data-dashboard-role`, SEO / tests). */
  role: string
}

/** Enveloppe visuelle des dashboards ; la sidebar est fournie par `Providers`. */
export function RoleLayout({ children, role }: RoleLayoutProps) {
  return (
    <div
      className="relative min-h-[calc(100vh-5rem)] flex flex-col bg-[var(--color-bg)]"
      data-dashboard-role={role}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-[-10%] right-[-5%] h-[40%] w-[40%] rounded-full bg-[var(--color-primary)]/5 blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] h-[30%] w-[30%] rounded-full bg-[var(--color-secondary)]/5 blur-[100px]" />
      </div>
      <div className="relative z-10 flex-1">{children}</div>
    </div>
  )
}
