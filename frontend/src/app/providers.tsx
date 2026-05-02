'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/contexts/AuthContext'
import { WebChannelGuard } from '@/components/WebChannelGuard'
import AppShell from '@/components/AppShell'
import { SidebarLayoutProvider } from '@/contexts/SidebarLayoutContext'

export default function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'
  /** Pages sans sidebar : landing, auth, vérification publique */
  const isPublicPage =
    isAuthPage ||
    pathname === '/' ||
    pathname === '/verify' ||
    pathname.startsWith('/verify/') ||
    pathname === '/compte-application-mobile'

  return (
    <AuthProvider>
      <WebChannelGuard>
        {isPublicPage ? (
          <div className="min-h-screen">
            {children}
          </div>
        ) : (
          <SidebarLayoutProvider>
            <AppShell>{children}</AppShell>
          </SidebarLayoutProvider>
        )}
      </WebChannelGuard>
    </AuthProvider>
  )
}
