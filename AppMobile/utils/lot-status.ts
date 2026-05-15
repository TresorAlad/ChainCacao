/** Statuts API blockchain / backend */
export type ApiLotStatut =
  | 'cree'
  | 'en_transit'
  | 'recu'
  | 'paye'
  | 'exporte'
  | 'transfere'
  | string;

export type LotStatusDisplay = {
  label: string;
  color: string;
  textColor: string;
};

const STATUS_MAP: Record<string, LotStatusDisplay> = {
  cree: { label: 'Créé', color: '#E3F2FD', textColor: '#1565C0' },
  en_transit: { label: 'En transit', color: '#FFF3E0', textColor: '#E65100' },
  recu: { label: 'Reçu', color: '#E8F5E9', textColor: '#2E7D32' },
  paye: { label: 'Payé', color: '#E8F5E9', textColor: '#1B5E20' },
  exporte: { label: 'Exporté', color: '#F3E5F5', textColor: '#6A1B9A' },
  transfere: { label: 'Transféré', color: '#ECEFF1', textColor: '#455A64' },
};

/** Mappe un statut API vers libellé et couleurs pour les badges UI. */
export function mapStatut(statut?: string | null): LotStatusDisplay {
  const key = String(statut ?? '').toLowerCase().trim();
  if (STATUS_MAP[key]) return STATUS_MAP[key];
  if (!key) return { label: '—', color: '#ECEFF1', textColor: '#616161' };
  return {
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
    color: '#ECEFF1',
    textColor: '#616161',
  };
}

/** Indique si le lot attend une confirmation de réception physique. */
export function isEnTransit(statut?: string | null): boolean {
  return String(statut ?? '').toLowerCase() === 'en_transit';
}

/** Indique si le paiement a été effectué. */
export function isPaye(statut?: string | null): boolean {
  return String(statut ?? '').toLowerCase() === 'paye';
}

/** Statut local (sync hors-ligne) → libellé affiché. */
export function mapLocalSyncStatus(synced: boolean, status?: string): string {
  if (!synced) return 'En attente';
  if (status === 'Problème') return 'Problème';
  if (status === 'En cours') return 'En cours';
  return 'Synchronisé';
}
