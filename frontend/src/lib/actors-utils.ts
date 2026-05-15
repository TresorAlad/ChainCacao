import type { ActorDTO } from '@/lib/api'

const HIDDEN_ROLES = new Set(['admin', 'ministere'])

/** Acteurs visibles dans l'annuaire filière (sans admin ni ministère). */
export function filterAnnuaireActors(actors: ActorDTO[]): ActorDTO[] {
  return actors.filter((a) => !HIDDEN_ROLES.has((a.role || '').toLowerCase()))
}

export const ACTOR_ROLE_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'agriculteur', label: 'Agriculteurs' },
  { id: 'cooperative', label: 'Coopératives' },
  { id: 'transformateur', label: 'Transformateurs' },
  { id: 'exportateur', label: 'Exportateurs' },
] as const

export function roleDisplayLabel(role: string): string {
  switch (role?.toLowerCase()) {
    case 'agriculteur':
      return 'Agriculteur'
    case 'cooperative':
      return 'Coopérative'
    case 'transformateur':
      return 'Transformateur'
    case 'exportateur':
      return 'Exportateur'
    default:
      return role || '—'
  }
}
