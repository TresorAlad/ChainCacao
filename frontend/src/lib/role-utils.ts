export type UserRole =
  | 'admin'
  | 'agriculteur'
  | 'cooperative'
  | 'transformateur'
  | 'distributeur'
  | 'exportateur'
  | 'verificateur'

/** Rôle attendu par l’API Go (`exportateur` du mobile → `distributeur`). */
export function mapRoleToApiRole(role: string): string {
  const r = role.trim().toLowerCase()
  if (r === 'exportateur') return 'distributeur'
  return r || 'agriculteur'
}

export function getRoleBasedRedirect(role: UserRole | string | undefined): string {
  if (!role) return '/login'

  switch (role) {
    case 'admin':
      return '/dashboard-admin'
    case 'agriculteur':
      return '/dashboard-agriculteur'
    case 'cooperative':
      return '/dashboard-cooperative'
    case 'transformateur':
      return '/dashboard-transformateur'
    case 'distributeur':
      return '/dashboard-distributeur'
    case 'exportateur':
      return '/dashboard-exportateur'
    case 'verificateur':
      return '/dashboard-verificateur'
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
    case 'distributeur':
      return 'Distributeur'
    case 'exportateur':
      return 'Exportateur'
    case 'verificateur':
      return 'Vérificateur'
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
    case 'distributeur':
      return 'Distribution et export des produits finis'
    case 'exportateur':
      return 'Export et commercialisation à l’international'
    case 'verificateur':
      return 'Inspection et certification de la conformité des lots'
    default:
      return 'Accès utilisateur standard'
  }
}