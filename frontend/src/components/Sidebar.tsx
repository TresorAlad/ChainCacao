'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon,
  CubeIcon,
  TruckIcon,
  DocumentCheckIcon,
  ChartBarIcon,
  QrCodeIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UsersIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { BrandLogo } from '@/components/BrandLogo'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleBasedRedirect } from '@/lib/role-utils'
import {
  useSidebarLayout,
  useResponsiveShell,
  SIDEBAR_COLLAPSED_PX,
  SIDEBAR_EXPANDED_PX,
} from '@/contexts/SidebarLayoutContext'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile } = useSidebarLayout()
  const { isLg } = useResponsiveShell()

  const allNavItems = [
    {
      icon: HomeIcon,
      label: 'Accueil',
      href: getRoleBasedRedirect(user?.role),
      roles: ['admin', 'agriculteur', 'cooperative', 'verificateur', 'exportateur', 'transformateur', 'distributeur'],
    },
    { icon: CubeIcon, label: 'Mes Lots', href: '/lots', roles: ['agriculteur', 'cooperative', 'admin'] },
    { icon: ArrowUpTrayIcon, label: 'Export', href: '/export', roles: ['exportateur', 'admin'] },
    {
      icon: TruckIcon,
      label: 'Transferts',
      href: '/transfer',
      roles: ['agriculteur', 'cooperative', 'verificateur', 'exportateur', 'admin'],
    },
    {
      icon: DocumentCheckIcon,
      label: 'Conformité',
      href: '/conformite',
      roles: ['verificateur', 'admin', 'cooperative'],
    },
    { icon: ChartBarIcon, label: 'Transactions', href: '/transactions', roles: ['admin', 'exportateur'] },
    { icon: QrCodeIcon, label: 'Blockchain', href: '/blockchain', roles: ['admin', 'verificateur'] },
    { icon: UsersIcon, label: 'Acteurs', href: '/actors', roles: ['admin', 'cooperative'] },
    { icon: ArrowPathIcon, label: 'Sync', href: '/sync', roles: ['admin', 'agriculteur'] },
  ]

  const navItems = allNavItems.filter((item) => !user?.role || item.roles.includes(user.role))

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  const desktopWidthPx = collapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX

  return (
    <aside
      style={{ width: isLg ? desktopWidthPx : undefined }}
      className={[
        'relative z-50 flex flex-col shrink-0 border-r border-gray-100 bg-white shadow-[4px_0_24px_-12px_rgba(0,0,0,0.08)]',
        'h-[100dvh] max-h-[100dvh]',
        'fixed lg:sticky lg:top-0',
        'transition-[transform,width] duration-300 ease-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        !isLg ? 'w-[min(280px,85vw)]' : '',
      ].join(' ')}
    >
      {/* Mobile fermer */}
      {!isLg ? (
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0" onClick={closeMobile}>
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#1B3A0F] to-[#33691E] p-2 shadow-md">
              <BrandLogo className="w-full h-full text-white" />
            </div>
            <span className="truncate text-lg font-black uppercase text-[var(--color-primary)]">
              Chain<span className="text-[#33691E]">Cacao</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Fermer le menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      ) : null}

      {/* Toggle desktop */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="absolute -right-4 top-10 z-50 hidden h-8 w-8 items-center justify-center rounded-full border border-gray-100 bg-white text-[var(--color-primary)] shadow-lg transition-transform hover:scale-110 lg:flex"
        aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
      >
        {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
      </button>

      {/* Logo desktop */}
      <div className={`${isLg ? '' : 'hidden'} ${collapsed ? 'flex justify-center px-4 pt-6 pb-2' : 'p-8 pb-4'}`}>
        <Link href="/dashboard" className={`flex items-center gap-4 group ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B3A0F] to-[#33691E] p-2.5 shadow-lg transition-transform group-hover:rotate-6">
            <BrandLogo className="h-full w-full text-white" />
          </div>
          {!collapsed ? (
            <span className="text-2xl font-black uppercase tracking-tight text-[var(--color-primary)]">
              Chain<span className="text-[#33691E]">Cacao</span>
            </span>
          ) : null}
        </Link>
      </div>

      <nav className="sidebar-scroll flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-6">
        <div>
          {isLg ? (
            !collapsed ? (
              <p className="mb-4 ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Navigation</p>
            ) : null
          ) : (
            <p className="mb-4 ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Menu</p>
          )}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => !isLg && closeMobile()}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all group ${
                    isActive
                      ? 'bg-[#1B3A0F] text-white shadow-xl shadow-[#1B3A0F]/20'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-[var(--color-primary)]'
                  } ${collapsed && isLg ? 'justify-center px-2' : ''}`}
                >
                  <item.icon className={`h-6 w-6 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                  {(!collapsed || !isLg) && <span className="text-sm font-bold">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          {(isLg && !collapsed) || !isLg ? (
            <p className="mb-4 ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Système</p>
          ) : null}
          <Link
            href="/profile"
            onClick={() => !isLg && closeMobile()}
            className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all group ${
              pathname === '/profile'
                ? 'bg-[#1B3A0F] text-white shadow-xl shadow-[#1B3A0F]/20'
                : 'text-gray-400 hover:bg-gray-50 hover:text-[var(--color-primary)]'
            } ${collapsed && isLg ? 'justify-center px-2' : ''}`}
          >
            <Cog6ToothIcon className="h-6 w-6 shrink-0 transition-transform group-hover:rotate-45" />
            {(!collapsed || !isLg) && <span className="text-sm font-bold">Mon Profil</span>}
          </Link>
        </div>
      </nav>

      <div className="space-y-4 border-t border-gray-50 p-4 sm:p-6">
        {!collapsed || !isLg ? (
          <button
            type="button"
            onClick={() => {
              router.push('/lots')
              closeMobile()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F1F8E9] py-4 text-xs font-black uppercase tracking-widest text-[#33691E] transition-all hover:brightness-95"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau Lot
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push('/lots')}
            className="flex aspect-square w-full items-center justify-center rounded-2xl bg-[#F1F8E9] text-[#33691E] transition-all hover:brightness-95"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-red-400 transition-all hover:bg-red-50 hover:text-red-600 ${collapsed && isLg ? 'justify-center' : ''}`}
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6 shrink-0" />
          {(!collapsed || !isLg) && <span className="text-sm font-bold">Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
