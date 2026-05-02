'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'
  /** Pages sans sidebar : landing, auth, vérification publique */
  const isPublicPage = isAuthPage || pathname === '/' || pathname === '/verify'

  return (
    <AuthProvider>
      {isPublicPage ? (
        <div className="min-h-screen">
          {children}
        </div>
      ) : (
        <div className="flex min-h-screen">
          <Sidebar />
          <Header />
          <main className="main-content">
            {children}
          </main>
        </div>
      )}
    </AuthProvider>
  )
}
