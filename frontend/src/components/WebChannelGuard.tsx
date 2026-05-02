'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getSignupChannel } from '@/lib/signup-channel-storage'

const MOBILE_ONLY_PATH = '/compte-application-mobile'

function isPublicPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === MOBILE_ONLY_PATH) {
    return true
  }
  if (pathname === '/verify' || pathname.startsWith('/verify/')) return true
  return false
}

/** Redirige les comptes marqués « application mobile » hors des écrans applicatifs web. */
export function WebChannelGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (loading || !isAuthenticated || !user?.actor_id) return
    if (isPublicPath(pathname)) return

    const ch = user.clientChannel ?? getSignupChannel(user.actor_id)
    if (ch !== 'mobile') return

    router.replace(MOBILE_ONLY_PATH)
  }, [loading, isAuthenticated, user?.actor_id, user?.clientChannel, pathname, router])

  return <>{children}</>
}
