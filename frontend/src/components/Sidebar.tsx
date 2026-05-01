'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useState } from 'react'
import {
  ChartBarIcon,
  CubeIcon,
  TruckIcon,
  DocumentCheckIcon,
  PhotoIcon,
  QrCodeIcon,
  ClockIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HomeIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline'

  const menuItems = [
  { view: 'dashboard', label: 'Tableau de bord', icon: ChartBarIcon, section: 'main' },
  { view: 'lots', label: 'Lots', icon: CubeIcon, section: 'main' },
  { view: 'nouveau-lot', label: 'Nouveau Lot', icon: PlusIcon, section: 'main' },
  { view: 'transfer', label: 'Transferts', icon: TruckIcon, section: 'main' },
  { view: 'update-weight', label: 'Mise à jour poids', icon: ScaleIcon, section: 'main' },
  { view: 'export', label: 'Export', icon: DocumentCheckIcon, section: 'operations' },
  { view: 'upload-photo', label: 'Photos', icon: PhotoIcon, section: 'operations' },
  { view: 'eudr-report', label: 'Rapport EUDR', icon: FileTextIcon, section: 'compliance' },
  { view: 'qrcode', label: 'QR Code', icon: QrCodeIcon, section: 'tools' },
  { view: 'verify', label: 'Vérification', icon: ShieldCheckIcon, section: 'tools' },
  { view: 'sync', label: 'Sync Ledger', icon: ArrowsRightLeftIcon, section: 'tools' },
  { view: 'full-history', label: 'Historique', icon: ClockIcon, section: 'tools' },
  { view: 'actors', label: 'Acteurs', icon: UsersIcon, section: 'admin' },
  { view: 'about', label: 'À propos', icon: BuildingStorefrontIcon, section: 'other' },
]

const sections = {
  main: 'Principal',
  operations: 'Opérations',
  compliance: 'Conformité',
  tools: 'Outils',
  admin: 'Administration',
  other: 'Autre'
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState(['main', 'operations', 'tools'])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, typeof menuItems>)

  if (!isAuthenticated) return null

  return (
    <aside className={`sidebar ${collapsed ? 'w-[72px]' : 'w-[280px]'} transition-all duration-300`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          {!collapsed && <span className="sidebar-logo-text">ChainCacao</span>}
        </div>
        {!collapsed && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          >
            <ChevronDownIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {Object.entries(sections).map(([sectionKey, sectionLabel]) => {
          const items = groupedItems[sectionKey]
          if (!items) return null

          return (
            <div key={sectionKey} className="sidebar-section">
              {!collapsed && (
                <div className="sidebar-section-label">
                  {sectionLabel}
                </div>
              )}
              {items.map((item) => {
                const isActive = pathname === `/${item.view}`
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.view}
                    href={`/${item.view}`}
                    className={`sidebar-nav-item ${
                      isActive ? 'active' : ''
                    } ${collapsed ? 'justify-center px-3' : ''}`}
                    title={collapsed ? item.label : ''}
                  >
                    <Icon className="w-5 h-5" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User Profile */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.actor_id?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.actor_id || 'Utilisateur'}</div>
              <div className="user-role">{user?.role || 'Rôle'}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="logout-btn"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      )}

      {collapsed && (
        <div className="sidebar-footer">
          <button 
            onClick={() => setCollapsed(false)}
            className="w-full p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all flex items-center justify-center"
            title="Développer"
          >
            <ChevronUpIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </aside>
  )
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  )
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  )
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
