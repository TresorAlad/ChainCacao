'use client'

import type { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useResponsiveShell } from '@/contexts/SidebarLayoutContext'

export default function AppShell({ children }: { children: ReactNode }) {
  const { isLg, mobileOpen, closeMobile } = useResponsiveShell()

  return (
    <div className="flex h-screen overflow-hidden w-full max-w-[100vw] flex-row bg-[var(--color-bg)]">
      <Sidebar />
      {!isLg && mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
          aria-label="Fermer le menu"
          onClick={closeMobile}
        />
      ) : null}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto pt-20 pb-6 sm:pb-10 px-4 sm:px-6 xl:px-10 box-border">
          {children}
        </main>
      </div>
    </div>
  )
}
