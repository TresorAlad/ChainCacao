'use client'

import { useState } from 'react'
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
} from '@heroicons/react/24/outline'
import { BrandLogo } from '@/components/BrandLogo'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    { icon: HomeIcon, label: 'Accueil', href: '/dashboard' },
    { icon: CubeIcon, label: 'Lots', href: '/lots' },
    { icon: ArrowUpTrayIcon, label: 'Export', href: '/export' },
    { icon: TruckIcon, label: 'Transferts', href: '/transfer' },
    { icon: DocumentCheckIcon, label: 'Conformité', href: '/conformite' },
    { icon: ChartBarIcon, label: 'Transactions', href: '/transactions' },
    { icon: QrCodeIcon, label: 'Blockchain', href: '/blockchain' },
    { icon: UsersIcon, label: 'Acteurs', href: '/actors' },
    { icon: ArrowPathIcon, label: 'Sync', href: '/sync' },
  ]

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  const displayName = user?.email || user?.actor_id || 'Utilisateur'
  const roleLabel = user?.role || '—'

  return (
    <aside className={`sidebar transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}>
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
        aria-label={isCollapsed ? 'Développer le menu' : 'Réduire le menu'}
      >
        {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
      </button>

      <div className="sidebar-header">
        <Link href="/dashboard" className="sidebar-logo hover:opacity-90 transition-opacity">
          <div className="sidebar-logo-icon">
            <BrandLogo className="w-full h-full min-w-[2.5rem] min-h-[2.5rem]" />
          </div>
          {!isCollapsed && <span className="sidebar-logo-text">ChainCacao</span>}
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          {!isCollapsed && <span className="sidebar-section-label">Principal</span>}
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className="w-5 h-5" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        <div className="sidebar-section">
          {!isCollapsed && <span className="sidebar-section-label">Compte</span>}
          <Link
            href="/profile"
            className={`sidebar-nav-item ${pathname === '/profile' ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Profil' : ''}
          >
            <Cog6ToothIcon className="w-5 h-5" />
            {!isCollapsed && <span>Profil</span>}
          </Link>
        </div>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="logout-btn mt-auto" onClick={handleLogout}>
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
