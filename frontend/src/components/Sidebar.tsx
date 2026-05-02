'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  UsersIcon
} from '@heroicons/react/24/outline'

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    { icon: HomeIcon, label: 'Accueil', href: '/dashboard' },
    { icon: CubeIcon, label: 'Lots', href: '/lots' },
    { icon: TruckIcon, label: 'Transferts', href: '/transfers' },
    { icon: DocumentCheckIcon, label: 'EUDR', href: '/eudr' },
    { icon: ChartBarIcon, label: 'Analytiques', href: '/analytics' },
    { icon: QrCodeIcon, label: 'QR Codes', href: '/qr-codes' },
    { icon: UsersIcon, label: 'Acteurs', href: '/actors' },
  ]

  return (
    <aside className={`sidebar transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="w-4 h-4" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4" />
        )}
      </button>

      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="sidebar-logo-text">ChainCacao</span>
          )}
        </div>
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
                className={`sidebar-nav-item ${
                  isActive ? 'active' : ''
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className="w-5 h-5" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        <div className="sidebar-section">
          {!isCollapsed && <span className="sidebar-section-label">Configuration</span>}
          <Link
            href="/settings"
            className={`sidebar-nav-item ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Paramètres' : ''}
          >
            <Cog6ToothIcon className="w-5 h-5" />
            {!isCollapsed && <span>Paramètres</span>}
          </Link>
        </div>
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed ? (
          <div className="user-profile">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <div className="user-name">Administrateur</div>
              <div className="user-role">Gestionnaire</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
              A
            </div>
          </div>
        )}
        <button className="logout-btn mt-3">
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}