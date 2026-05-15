import type { ComponentType, SVGProps } from 'react'
import {
  HomeIcon,
  CubeIcon,
  TruckIcon,
  ChartBarIcon,
  QrCodeIcon,
  UsersIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  BuildingLibraryIcon,
  RectangleStackIcon,
  DocumentCheckIcon,
  WalletIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ShieldExclamationIcon,
  AdjustmentsHorizontalIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { getRoleBasedRedirect, type UserRole } from '@/lib/role-utils'

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>

export type NavItemDef = {
  id: string
  icon: NavIcon
  label: string
  href: string | ((role: UserRole | string | undefined) => string)
  roles: UserRole[]
  /** Groupe affiché dans la sidebar (administration vs opérations) */
  section?: 'admin' | 'ops'
}

/** Aligné sur tracabilite-api/internal/httpapi/router.go */
export const NAV_ITEMS: NavItemDef[] = [
  {
    id: 'home',
    icon: HomeIcon,
    label: 'Accueil',
    href: (role) => getRoleBasedRedirect(role),
    roles: ['admin', 'agriculteur', 'cooperative', 'exportateur', 'transformateur', 'ministere'],
    section: 'ops',
  },
  {
    id: 'admin-hub',
    icon: Cog6ToothIcon,
    label: 'Administration',
    href: '/admin',
    roles: ['admin'],
    section: 'admin',
  },
  {
    id: 'admin-users',
    icon: UsersIcon,
    label: 'Utilisateurs',
    href: '/admin/utilisateurs',
    roles: ['admin'],
    section: 'admin',
  },
  {
    id: 'admin-marges',
    icon: CurrencyDollarIcon,
    label: 'Marges coopératives',
    href: '/admin/marges',
    roles: ['admin'],
    section: 'admin',
  },
  {
    id: 'admin-config',
    icon: AdjustmentsHorizontalIcon,
    label: 'Configuration',
    href: '/admin/config',
    roles: ['admin'],
    section: 'admin',
  },
  {
    id: 'admin-incidents',
    icon: ShieldExclamationIcon,
    label: 'Incidents',
    href: '/admin/incidents',
    roles: ['admin'],
    section: 'admin',
  },
  {
    id: 'supervision',
    icon: BuildingLibraryIcon,
    label: 'Supervision',
    href: '/dashboard-ministere',
    roles: ['ministere', 'admin'],
    section: 'ops',
  },
  {
    id: 'lots',
    icon: CubeIcon,
    label: 'Mes Lots',
    href: '/lots',
    roles: ['agriculteur', 'cooperative', 'transformateur', 'exportateur', 'admin'],
    section: 'ops',
  },
  {
    id: 'liste-groupee',
    icon: RectangleStackIcon,
    label: 'Liste groupée',
    href: '/liste-groupee',
    roles: ['cooperative', 'admin'],
    section: 'ops',
  },
  {
    id: 'reception-lot',
    icon: TruckIcon,
    label: 'Réception lot',
    href: '/reception-lot',
    roles: ['cooperative', 'transformateur', 'exportateur', 'admin'],
    section: 'ops',
  },
  {
    id: 'paiement-lot',
    icon: BanknotesIcon,
    label: 'Paiement lot',
    href: '/paiement-lot',
    roles: ['transformateur', 'exportateur', 'admin'],
    section: 'ops',
  },
  {
    id: 'paiement-liste',
    icon: RectangleStackIcon,
    label: 'Payer liste groupée',
    href: '/paiement-liste',
    roles: ['transformateur', 'exportateur', 'admin'],
    section: 'ops',
  },
  {
    id: 'export',
    icon: ArrowUpTrayIcon,
    label: 'Export',
    href: '/export',
    roles: ['exportateur', 'admin'],
    section: 'ops',
  },
  {
    id: 'eudr-report',
    icon: DocumentCheckIcon,
    label: 'Rapport EUDR',
    href: '/eudr-report',
    roles: ['exportateur', 'admin'],
    section: 'ops',
  },
  {
    id: 'transfer',
    icon: TruckIcon,
    label: 'Transferts',
    href: '/transfer',
    roles: ['agriculteur', 'cooperative', 'exportateur', 'transformateur', 'admin'],
    section: 'ops',
  },
  {
    id: 'transactions',
    icon: ChartBarIcon,
    label: 'Transactions',
    href: '/transactions',
    roles: ['admin'],
    section: 'ops',
  },
  {
    id: 'blockchain',
    icon: QrCodeIcon,
    label: 'Blockchain',
    href: '/blockchain',
    roles: ['admin', 'ministere'],
    section: 'ops',
  },
  {
    id: 'actors',
    icon: UsersIcon,
    label: 'Annuaire acteurs',
    href: '/actors',
    roles: ['cooperative', 'ministere'],
    section: 'ops',
  },
  {
    id: 'sync',
    icon: ArrowPathIcon,
    label: 'Sync',
    href: '/sync',
    roles: ['admin', 'agriculteur'],
    section: 'ops',
  },
  {
    id: 'portefeuille',
    icon: WalletIcon,
    label: 'Portefeuille',
    href: '/portefeuille',
    roles: ['cooperative', 'transformateur', 'exportateur', 'admin'],
    section: 'ops',
  },
]

const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/nouveau-lot': ['agriculteur', 'admin'],
  '/sync': ['agriculteur', 'admin'],
  '/transactions': ['admin'],
  '/export': ['exportateur', 'admin'],
  '/reception-lot': ['cooperative', 'transformateur', 'exportateur', 'admin'],
  '/paiement-lot': ['transformateur', 'exportateur', 'admin'],
  '/eudr-report': ['exportateur', 'admin'],
  '/paiement-liste': ['transformateur', 'exportateur', 'admin'],
  '/transfer': ['agriculteur', 'cooperative', 'transformateur', 'exportateur', 'admin'],
  '/liste-groupee': ['cooperative', 'admin'],
  '/lots': ['agriculteur', 'cooperative', 'transformateur', 'exportateur', 'admin'],
  '/dashboard-ministere': ['ministere', 'admin'],
  '/blockchain': ['admin', 'ministere'],
  '/actors': ['cooperative', 'ministere'],
  '/portefeuille': ['cooperative', 'transformateur', 'exportateur', 'admin'],
  '/admin': ['admin'],
  '/admin/utilisateurs': ['admin'],
  '/admin/marges': ['admin'],
  '/admin/config': ['admin'],
  '/admin/incidents': ['admin'],
}

function normalizeRole(role: string | undefined): UserRole | undefined {
  if (!role) return undefined
  const r = role.trim().toLowerCase()
  const allowed: UserRole[] = [
    'admin',
    'agriculteur',
    'cooperative',
    'transformateur',
    'exportateur',
    'ministere',
  ]
  return allowed.includes(r as UserRole) ? (r as UserRole) : undefined
}

export function isAdminRole(role: UserRole | string | undefined): boolean {
  return normalizeRole(role) === 'admin'
}

export function resolveNavHref(item: NavItemDef, role: UserRole | string | undefined): string {
  return typeof item.href === 'function' ? item.href(role) : item.href
}

export function getNavItemsForRole(role: UserRole | string | undefined): Array<NavItemDef & { href: string }> {
  const r = normalizeRole(role)
  if (!r) return []
  return NAV_ITEMS.filter((item) => item.roles.includes(r)).map((item) => ({
    ...item,
    href: resolveNavHref(item, r),
  }))
}

export function getNavSectionsForRole(role: UserRole | string | undefined): {
  admin: Array<NavItemDef & { href: string }>
  ops: Array<NavItemDef & { href: string }>
} {
  const items = getNavItemsForRole(role)
  return {
    admin: items.filter((i) => i.section === 'admin'),
    ops: items.filter((i) => i.section !== 'admin'),
  }
}

export function canCreateLot(role: UserRole | string | undefined): boolean {
  const r = normalizeRole(role)
  return r === 'agriculteur' || r === 'admin'
}

export function canUseSync(role: UserRole | string | undefined): boolean {
  const r = normalizeRole(role)
  return r === 'agriculteur' || r === 'admin'
}

export function canAccessRoute(role: UserRole | string | undefined, path: string): boolean {
  const r = normalizeRole(role)
  if (!r) return false
  const base = path.split('?')[0]
  if (base.startsWith('/admin')) {
    return r === 'admin'
  }
  const rules = ROUTE_ACCESS[base]
  if (!rules) return true
  return rules.includes(r)
}

export function canViewActorsMap(role: UserRole | string | undefined): boolean {
  const r = normalizeRole(role)
  return r === 'admin' || r === 'cooperative' || r === 'ministere'
}
