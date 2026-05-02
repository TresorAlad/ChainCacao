'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  useSyncExternalStore,
} from 'react'
import { usePathname } from 'next/navigation'

/** Aligné sur `lg:` Tailwind (1024px). */
export const LG_MEDIA_QUERY = '(min-width: 1024px)'
export const SIDEBAR_EXPANDED_PX = 320
export const SIDEBAR_COLLAPSED_PX = 100

function subscribeMediaLg(onChange: () => void) {
  const mq = window.matchMedia(LG_MEDIA_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getMediaLgSnapshot() {
  return window.matchMedia(LG_MEDIA_QUERY).matches
}

/** true = viewport desktop ; false côté SSR (mobile-first). */
function getMediaLgServerSnapshot() {
  return false
}

export function useMediaQueryLg(): boolean {
  return useSyncExternalStore(subscribeMediaLg, getMediaLgSnapshot, getMediaLgServerSnapshot)
}

type SidebarLayoutValue = {
  collapsed: boolean
  toggleCollapsed: () => void
  mobileOpen: boolean
  openMobile: () => void
  closeMobile: () => void
}

const SidebarLayoutContext = createContext<SidebarLayoutValue | null>(null)

export function SidebarLayoutProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), [])
  const openMobile = useCallback(() => setMobileOpen(true), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const value = useMemo(
    () => ({
      collapsed,
      toggleCollapsed,
      mobileOpen,
      openMobile,
      closeMobile,
    }),
    [collapsed, toggleCollapsed, mobileOpen, openMobile, closeMobile]
  )

  return <SidebarLayoutContext.Provider value={value}>{children}</SidebarLayoutContext.Provider>
}

export function useSidebarLayout(): SidebarLayoutValue {
  const ctx = useContext(SidebarLayoutContext)
  if (!ctx) throw new Error('useSidebarLayout doit être utilisé sous SidebarLayoutProvider')
  return ctx
}

export function useResponsiveShell() {
  const { collapsed, mobileOpen, closeMobile } = useSidebarLayout()
  const isLg = useMediaQueryLg()
  const sidebarWidthPx = collapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX
  /** La sidebar est dans le flux flex (sticky desktop) ou en overlay (mobile) : pas de marge sur `<main>`. */
  const headerLeft = isLg ? sidebarWidthPx : 0

  return {
    isLg,
    headerLeft,
    mobileOpen,
    closeMobile,
    sidebarWidthPx,
    collapsed,
  }
}
