export type UserRole = 'admin' | 'verificateur' | 'exportateur' | 'cooperative' | 'agriculteur'

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
  verificateur: {
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
  }
}

export function getRoleTheme(role: UserRole): RoleTheme {
  return themes[role] || themes.agriculteur
}

export function getRoleBasedRedirect(role: UserRole | string | undefined): string {
  if (!role) return '/login'

  switch (role) {
    case 'admin':
      return '/dashboard-admin'
    case 'verificateur':
      return '/dashboard-verificateur'
    case 'exportateur':
      return '/dashboard-exportateur'
    case 'cooperative':
      return '/dashboard-cooperative'
    case 'agriculteur':
      return '/dashboard-agriculteur'
    default:
      return '/dashboard'
  }
}

export function getRoleDisplayName(role: UserRole | string | undefined): string {
  if (!role) return 'Utilisateur'

  switch (role) {
    case 'admin':
      return 'Administrateur'
    case 'verificateur':
      return 'Vérificateur'
    case 'exportateur':
      return 'Exportateur'
    case 'cooperative':
      return 'Coopérative'
    case 'agriculteur':
      return 'Agriculteur'
    default:
      return 'Utilisateur'
  }
}

export function getRoleDescription(role: UserRole | string | undefined): string {
  if (!role) return 'Accès utilisateur standard'

  switch (role) {
    case 'admin':
      return 'Accès complet à toutes les fonctionnalités administratives'
    case 'verificateur':
      return 'Gestion des vérifications et conformité des lots'
    case 'exportateur':
      return 'Gestion des exportations et suivi logistique international'
    case 'cooperative':
      return 'Coordination des agriculteurs et gestion des collectes'
    case 'agriculteur':
      return 'Gestion des lots de cacao et suivi de production'
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
      { name: 'Conformité', href: '/conformite', icon: 'document-check' },
      { name: 'Paramètres', href: '/parametres', icon: 'cog-6-tooth' }
    ],
    verificateur: [
      { name: 'Vérifications', href: '/verifications', icon: 'document-magnifying-glass' },
      { name: 'Historique', href: '/historique', icon: 'clock' },
      { name: 'Profil', href: '/profil', icon: 'user-circle' }
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
    ]
  }

  return [...baseNav, ...roleSpecificNav[role]]
}