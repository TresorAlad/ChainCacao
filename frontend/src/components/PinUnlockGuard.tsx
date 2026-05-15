'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { hasPinRequired, isPinUnlocked } from '@/lib/pin-session'
import { isWebPinGateExempt } from '@/lib/role-utils'

const PUBLIC_PATHS = /^\/($|login|register|verify|compte-application-mobile|pin-unlock)/

/** Redirige vers /pin-unlock si la session JWT est valide mais le PIN n'a pas été saisi. */
export function PinUnlockGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading || !user) return
    if (pathname && PUBLIC_PATHS.test(pathname)) return
    if (isWebPinGateExempt(user.role)) return
    if (hasPinRequired() && !isPinUnlocked()) {
      router.replace('/pin-unlock')
    }
  }, [loading, user, pathname, router])

  return <>{children}</>
}
