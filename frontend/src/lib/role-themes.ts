export type UserRole = 'admin' | 'exportateur' | 'cooperative' | 'agriculteur' | 'transformateur' | 'ministere'

export interface RoleTheme {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  sidebar: {
    background: string
    text: string
    activeItem: string
    activeText: string
    border: string
  }
  card: {
    background: string
    shadow: string
    border: string
  }
  button: {
    primary: string
    secondary: string
    outline: string
  }
  badge: {
    success: string
    warning: string
    error: string
    info: string
  }
  text: {
    primary: string
    secondary: string
    muted: string
  }
}

const themes: Record<UserRole, RoleTheme> = {
  admin: {
    primary: '#1A2E0D',
    secondary: '#4CAF50',
    accent: '#81C784',
    background: '#F5F5F0',
    surface: '#F4F6F3',
    sidebar: {
      background: '#0F1F08',
      text: '#FFFFFF',
      activeItem: '#2D5016',
      activeText: '#FFFFFF',
      border: '#1A2E0D'
    },
    card: {
      background: '#FFFFFF',
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '#E5E7EB'
    },
    button: {
      primary: '#1A2E0D',
      secondary: '#2D5016',
      outline: '#CBD5E1'
    },
    badge: {
      success: '#E8F5E9',
      warning: '#FFF3E0',
      error: '#FFEBEE',
      info: '#E3F2FD'
    },
    text: {
      primary: '#1A2E0D',
      secondary: '#2D5016',
      muted: '#6B7280'
    }
  },
  ministere: {
    primary: '#2D5016',
    secondary: '#4CAF50',
    accent: '#F59E0B',
    background: '#FAFAF7',
    surface: '#F9FAFB',
    sidebar: {
      background: '#FFFFFF',
      text: '#374151',
      activeItem: '#F0FDF4',
      activeText: '#2D5016',
      border: '#E5E7EB'
    },
    card: {
      background: '#FFFFFF',
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '#E5E7EB'
    },
    button: {
      primary: '#2D5016',
      secondary: '#4CAF50',
      outline: '#CBD5E1'
    },
    badge: {
      success: '#DCFCE7',
      warning: '#FEF9C3',
      error: '#FEE2E2',
      info: '#E3F2FD'
    },
    text: {
      primary: '#2D5016',
      secondary: '#4CAF50',
      muted: '#6B7280'
    }
  },
  exportateur: {
    primary: '#1B3A0F',
    secondary: '#6B9E3A',
    accent: '#06B6D4',
    background: '#F8FAF5',
    surface: '#F8FAFC',
    sidebar: {
      background: '#FFFFFF',
      text: '#374151',
      activeItem: '#F0FDF4',
      activeText: '#2D5016',
      border: '#F3F4F6'
    },
    card: {
      background: '#FFFFFF',
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '#E5E7EB'
    },
    button: {
      primary: '#1B3A0F',
      secondary: '#2D5016',
      outline: '#CBD5E1'
    },
    badge: {
      success: '#E8F5E9',
      warning: '#FFF8E1',
      error: '#FFEBEE',
      info: '#E3F2FD'
    },
    text: {
      primary: '#1B3A0F',
      secondary: '#2D5016',
      muted: '#6B7280'
    }
  },
  cooperative: {
    primary: '#2E5E1A',
    secondary: '#7CB342',
    accent: '#CDDC39',
    background: '#F7F9F4',
    surface: '#F8FAF5',
    sidebar: {
      background: '#FFFFFF',
      text: '#374151',
      activeItem: '#F0FDF4',
      activeText: '#2D5016',
      border: '#E5E7EB'
    },
    card: {
      background: '#FFFFFF',
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '#E5E7EB'
    },
    button: {
      primary: '#2E5E1A',
      secondary: '#7CB342',
      outline: '#CBD5E1'
    },
    badge: {
      success: '#E8F5E9',
      warning: '#FFF8E1',
      error: '#FFEBEE',
      info: '#F1F8E9'
    },
    text: {
      primary: '#2E5E1A',
      secondary: '#7CB342',
      muted: '#6B7280'
    }
  },
  agriculteur: {
    primary: '#3A6B1C',
    secondary: '#9CCC65',
    accent: '#F59E0B',
    background: '#FAFDF7',
    surface: '#FAFDF5',
    sidebar: {
      background: '#FFFFFF',
      text: '#374151',
      activeItem: '#F1F8E9',
      activeText: '#33691E',
      border: '#F0F0E8'
    },
    card: {
      background: '#FFFFFF',
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '#E5E7EB'
    },
    button: {
      primary: '#3A6B1C',
      secondary: '#9CCC65',
      outline: '#CBD5E1'
    },
    badge: {
      success: '#E8F5E9',
      warning: '#FFF8E1',
      error: '#FFEBEE',
      info: '#F1F8E9'
    },
    text: {
      primary: '#3A6B1C',
      secondary: '#7CB342',
      muted: '#6B7280'
    }
  },
  transformateur: {
    primary: '#5D4037',
    secondary: '#8D6E63',
    accent: '#FF9800',
    background: '#FAFDF7',
    surface: '#FAFDF5',
    sidebar: {
      background: '#FFFFFF',
      text: '#374151',
      activeItem: '#F1F8E9',
      activeText: '#33691E',
      border: '#F0F0E8'
    },
    card: {
      background: '#FFFFFF',
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '#E5E7EB'
    },
    button: {
      primary: '#5D4037',
      secondary: '#8D6E63',
      outline: '#CBD5E1'
    },
    badge: {
      success: '#E8F5E9',
      warning: '#FFF8E1',
      error: '#FFEBEE',
      info: '#F1F8E9'
    },
    text: {
      primary: '#5D4037',
      secondary: '#7CB342',
      muted: '#6B7280'
    }
  }
}

export function getRoleTheme(role: UserRole | string): RoleTheme {
  if (role in themes) return themes[role as UserRole]
  if (role === 'verificateur' || role === 'distributeur') return themes.agriculteur
  return themes.agriculteur
}

export function getRoleBasedRedirect(role: UserRole | string | undefined): string {
  if (!role) return '/login'

  switch (role) {
    case 'admin':
      return '/dashboard-admin'
    case 'ministere':
      return '/dashboard-ministere'
    case 'exportateur':
      return '/dashboard-exportateur'
    case 'cooperative':
      return '/dashboard-cooperative'
    case 'agriculteur':
      return '/dashboard-agriculteur'
    case 'transformateur':
      return '/dashboard-transformateur'
    default:
      return '/dashboard'
  }
}

export function getRoleDisplayName(role: UserRole | string | undefined): string {
  if (!role) return 'Utilisateur'

  switch (role) {
    case 'admin':
      return 'Administrateur'
    case 'ministere':
      return 'Ministère'
    case 'exportateur':
      return 'Exportateur'
    case 'cooperative':
      return 'Coopérative'
    case 'agriculteur':
      return 'Agriculteur'
    case 'transformateur':
      return 'Transformateur'
    default:
      return 'Utilisateur'
  }
}

export function getRoleDescription(role: UserRole | string | undefined): string {
  if (!role) return 'Accès utilisateur standard'

  switch (role) {
    case 'admin':
      return 'Accès complet à toutes les fonctionnalités administratives'
    case 'ministere':
      return 'Supervision nationale et audit de la filière'
    case 'exportateur':
      return 'Gestion des exportations et suivi logistique international'
    case 'cooperative':
      return 'Coordination des agriculteurs et gestion des collectes'
    case 'agriculteur':
      return 'Gestion des lots de cacao et suivi de production'
    case 'transformateur':
      return 'Traitement et transformation du cacao en produits finis'
    default:
      return 'Accès utilisateur standard'
  }
}

export function getRoleNavigation(role: UserRole): Array<{ name: string, href: string, icon: string }> {
  const baseNav = [
    { name: 'Tableau de bord', href: '/dashboard', icon: 'home' }
  ]

  const roleSpecificNav: Record<UserRole, Array<{ name: string, href: string, icon: string }>> = {
    admin: [
      { name: 'Lots de cacao', href: '/lots', icon: 'cube' },
      { name: 'Acteurs', href: '/actors', icon: 'users' },
      { name: 'Transactions', href: '/transactions', icon: 'arrows-right-left' },
      { name: 'Blockchain', href: '/blockchain', icon: 'link' },
      { name: 'Paramètres', href: '/parametres', icon: 'cog-6-tooth' }
    ],
    ministere: [
      { name: 'Supervision', href: '/dashboard-ministere', icon: 'building-library' },
      { name: 'Acteurs', href: '/actors', icon: 'users' }
    ],
    exportateur: [
      { name: 'Exportations', href: '/exportations', icon: 'globe-americas' },
      { name: 'Détails', href: '/details', icon: 'clipboard-document-list' },
      { name: 'Créer', href: '/creer', icon: 'plus-circle' },
      { name: 'Profil', href: '/profil', icon: 'user-circle' }
    ],
    cooperative: [
      { name: 'Lots collectés', href: '/lots-collectes', icon: 'archive-box' },
      { name: 'Confirmer lot', href: '/confirmer-lot', icon: 'check-circle' },
      { name: 'Détails lot', href: '/details-lot', icon: 'eye' },
      { name: 'Collecte', href: '/collecte', icon: 'truck' },
      { name: 'Profil', href: '/profil', icon: 'user-circle' }
    ],
    agriculteur: [
      { name: 'Accueil', href: '/accueil', icon: 'home' },
      { name: 'Revenus', href: '/revenus', icon: 'banknotes' },
      { name: 'Productions', href: '/productions', icon: 'beaker' },
      { name: 'Profil', href: '/profil', icon: 'user-circle' }
    ],
    transformateur: [
      { name: 'Lots', href: '/lots', icon: 'cube' },
      { name: 'Transferts', href: '/transfer', icon: 'arrows-right-left' },
      { name: 'Profil', href: '/profile', icon: 'user-circle' }
    ],
  }

  return [...baseNav, ...roleSpecificNav[role]]
}