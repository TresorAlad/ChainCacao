export type UserRole =
  | 'admin'
  | 'agriculteur'
  | 'cooperative'
  | 'transformateur'
  | 'exportateur'
  | 'ministere'

const USER_ROLES: UserRole[] = [
  'admin',
  'agriculteur',
  'cooperative',
  'transformateur',
  'exportateur',
  'ministere',
]

/** Rôle attendu par l'API Go (aligné sur pkg/models). */
export function mapRoleToApiRole(role: string): string {
  const r = role.trim().toLowerCase()
  return r || 'agriculteur'
}

/** Normalise un rôle JWT / API vers un `UserRole` connu. */
export function normalizeUserRole(role: string | undefined): UserRole | undefined {
  if (!role) return undefined
  const r = role.trim().toLowerCase()
  return USER_ROLES.includes(r as UserRole) ? (r as UserRole) : undefined
}

export function isMinistereRole(role: string | undefined): boolean {
  return normalizeUserRole(role) === 'ministere'
}

export function isAdminRole(role: string | undefined): boolean {
  return normalizeUserRole(role) === 'admin'
}

export function getRoleBasedRedirect(role: UserRole | string | undefined): string {
  if (!role) return '/login'
  const r = normalizeUserRole(role) ?? role

  switch (r) {
    case 'admin':
      return '/dashboard-admin'
    case 'agriculteur':
      return '/dashboard-agriculteur'
    case 'cooperative':
      return '/dashboard-cooperative'
    case 'transformateur':
      return '/dashboard-transformateur'
    case 'exportateur':
      return '/dashboard-exportateur'
    case 'ministere':
      return '/dashboard-ministere'
    default:
      return '/dashboard'
  }
}

export function getRoleDisplayName(role: UserRole | string | undefined): string {
  if (!role) return 'Utilisateur'

  switch (role) {
    case 'admin':
      return 'Administrateur'
    case 'agriculteur':
      return 'Agriculteur'
    case 'cooperative':
      return 'Coopérative'
    case 'transformateur':
      return 'Transformateur'
    case 'exportateur':
      return 'Exportateur'
    case 'ministere':
      return 'Ministère'
    default:
      return 'Utilisateur'
  }
}

export function getRoleDescription(role: UserRole | string | undefined): string {
  if (!role) return 'Accès utilisateur standard'

  switch (role) {
    case 'admin':
      return 'Accès complet à toutes les fonctionnalités administratives'
    case 'agriculteur':
      return 'Gestion des lots de cacao et suivi de production'
    case 'cooperative':
      return 'Coordination des agriculteurs et gestion des collectes'
    case 'transformateur':
      return 'Transformation et traitement des fèves de cacao'
    case 'exportateur':
      return "Export et commercialisation à l'international"
    case 'ministere':
      return 'Supervision nationale et audit de la filière'
    default:
      return 'Accès utilisateur standard'
  }
}
