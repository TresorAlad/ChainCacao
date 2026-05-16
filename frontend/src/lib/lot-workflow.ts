/** Flux métier : transfert → en_transit → réception → recu → transfert suivant */

export function isEnTransit(statut?: string | null): boolean {
  return String(statut ?? '').toLowerCase() === 'en_transit'
}

/** Le propriétaire courant peut transférer (réception confirmée ou lot créé localement). */
export function canTransferLot(statut?: string | null): boolean {
  if (isEnTransit(statut)) return false
  const s = String(statut ?? '').toLowerCase().trim()
  if (s === 'exporte' || s === 'paye') return false
  return s === 'cree' || s === 'recu' || s === 'transfere' || !s
}

/** Acheteur (coop, transformateur, exportateur) peut payer un lot reçu, pas déjà payé. */
export function canPayLot(statut?: string | null): boolean {
  if (isEnTransit(statut)) return false
  const s = String(statut ?? '').toLowerCase().trim()
  if (s === 'paye' || s === 'exporte') return false
  return s === 'recu' || s === 'cree' || s === 'transfere' || !s
}

/** Agriculteur : transfert uniquement tant que le lot n'a pas quitté la parcelle. */
export function canAgriculteurTransfer(statut?: string | null): boolean {
  const s = String(statut ?? '').toLowerCase().trim()
  return !s || s === 'cree'
}

export function historyEventLabel(type?: string): string {
  const t = String(type ?? '').toLowerCase()
  if (t === 'creation') return 'Création du lot'
  if (t === 'transfert') return 'Transfert'
  if (t === 'reception') return 'Réception confirmée'
  if (t === 'paiement' || t === 'paiement_liste') return 'Paiement'
  if (t === 'export') return 'Export'
  if (t === 'maj_poids') return 'Mise à jour du poids'
  return type || 'Événement'
}

/** Badge liste / tableau (couleurs Tailwind). */
export function lotStatutDisplay(statut?: string | null): { label: string; cls: string } {
  const s = String(statut ?? '').toLowerCase().trim()
  if (s === 'en_transit') return { label: 'En transit', cls: 'bg-amber-100 text-amber-800' }
  if (s === 'recu') return { label: 'Reçu', cls: 'bg-green-100 text-green-800' }
  if (s === 'cree') return { label: 'Créé', cls: 'bg-blue-100 text-blue-800' }
  if (s === 'paye') return { label: 'Payé', cls: 'bg-emerald-100 text-emerald-900' }
  if (s === 'exporte') return { label: 'Exporté', cls: 'bg-purple-100 text-purple-800' }
  if (s === 'transfere') return { label: 'Transféré', cls: 'bg-slate-100 text-slate-700' }
  if (!s) return { label: '—', cls: 'bg-gray-100 text-gray-600' }
  return { label: s.replace(/_/g, ' '), cls: 'bg-[#FFF3E0] text-[#E65100]' }
}

export function historyActorSummary(event: {
  type?: string
  actor_id?: string
  from_actor_id?: string
  to_actor_id?: string
}): string {
  const t = String(event.type ?? '').toLowerCase()
  if (t === 'transfert' && (event.from_actor_id || event.to_actor_id)) {
    return `${event.from_actor_id || '?'} → ${event.to_actor_id || '?'}`
  }
  return event.actor_id || '—'
}
