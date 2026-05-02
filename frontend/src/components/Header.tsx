'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useResponsiveShell, useSidebarLayout } from '@/contexts/SidebarLayoutContext'

const LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  'dashboard-agriculteur': 'Dashboard Agriculteur',
  'dashboard-cooperative': 'Dashboard Coopérative',
  'dashboard-admin': 'Dashboard Admin',
  'dashboard-exportateur': 'Dashboard Exportateur',
  'dashboard-transformateur': 'Dashboard Transformateur',
  'dashboard-distributeur': 'Dashboard Distributeur',
  'dashboard-verificateur': 'Dashboard Vérificateur',
  lots: 'Mes lots',
  transfer: 'Transferts',
  conformite: 'Conformité',
  transactions: 'Transactions',
  blockchain: 'Blockchain',
  actors: 'Acteurs',
  sync: 'Synchronisation',
  export: 'Export',
  profile: 'Profil',
  'nouveau-lot': 'Nouveau lot',
  'lot-detail': 'Détail du lot',
  'update-weight': 'Mise à jour du poids',
  'upload-photo': 'Photo du lot',
  qrcode: 'QR code',
  verify: 'Vérification',
  'eudr-report': 'Rapport EUDR',
  'full-history': 'Historique',
}

function titleFromPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return 'Accueil'
  const segment = parts[0]
  if (LABELS[segment]) return LABELS[segment]
  if (segment === 'dashboard' && parts[1]) {
    const key = `dashboard-${parts[1]}`
    return LABELS[key] ?? LABELS.dashboard
  }
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function Header() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { headerLeft } = useResponsiveShell()
  const { openMobile } = useSidebarLayout()
  const title = titleFromPath(pathname || '')
  const subtitle = user?.email || user?.actor_id || ''

  return (
    <header
      style={{ left: headerLeft }}
      className="fixed top-0 right-0 z-40 flex h-20 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 pl-3 pr-4 backdrop-blur-md sm:pl-4 sm:pr-6 md:px-8"
      role="banner"
    >
      <button
        type="button"
        onClick={openMobile}
        className="flex shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-[var(--color-primary)] transition-colors hover:bg-gray-50 lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Bars3Icon className="h-6 w-6" aria-hidden />
      </button>
      <div className="min-w-0 flex-1 py-1">
        <h1 className="truncate text-lg font-bold leading-tight text-[var(--color-primary)] md:text-xl">{title}</h1>
        {subtitle ? (
          <p className="truncate text-xs leading-snug text-[var(--color-muted)] md:text-sm">{subtitle}</p>
        ) : null}
      </div>
      <Link
        href="/profile"
        className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-border)]/30"
      >
        <UserCircleIcon className="h-6 w-6 text-[var(--color-secondary-dark)]" aria-hidden />
        <span className="hidden sm:inline">Profil</span>
      </Link>
    </header>
  )
}
