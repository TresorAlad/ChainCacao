'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { WebChannelGuard } from '@/components/WebChannelGuard'
import { PinUnlockGuard } from '@/components/PinUnlockGuard'
import AppShell from '@/components/AppShell'
import { SidebarLayoutProvider } from '@/contexts/SidebarLayoutContext'

export default function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAuthPage =
    pathname === '/login' || pathname === '/register' || pathname === '/pin-unlock'
  /** Pages sans sidebar : landing, auth, vérification publique */
  const isPublicPage =
    pathname == null ||
    isAuthPage ||
    pathname === '/' ||
    pathname === '/verify' ||
    pathname.startsWith('/verify/') ||
    pathname === '/compte-application-mobile'

  return (
    <AuthProvider>
      <PinUnlockGuard>
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
      </PinUnlockGuard>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: { maxWidth: 'min(90vw, 28rem)' },
        }}
      />
    </AuthProvider>
  )
}
