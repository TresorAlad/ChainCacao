'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
