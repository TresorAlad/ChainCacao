export type UserRole = 'admin' | 'agriculteur' | 'cooperative' | 'transformateur' | 'distributeur'

export function getRoleBasedRedirect(role: UserRole | string | undefined): string {
  if (!role) return '/login'

  switch (role) {
    case 'admin':
      return '/dashboard'
    case 'agriculteur':
      return '/dashboard'
    case 'cooperative':
      return '/dashboard'
    case 'transformateur':
      return '/dashboard'
    case 'distributeur':
      return '/dashboard'
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
    default:
      return 'Accès utilisateur standard'
  }
}