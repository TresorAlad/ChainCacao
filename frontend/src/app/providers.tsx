'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'

export default function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isPublicPage = isAuthPage || pathname === '/'

  return (
    <AuthProvider>
      {isPublicPage ? (
        <div className="min-h-screen">
          {children}
        </div>
      ) : (
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      )}
    </AuthProvider>
  )
}
