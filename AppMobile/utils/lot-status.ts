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

/** Lot éligible à une liste groupée (réception confirmée, pas en transit ni déjà payé). */
export function canIncludeInGroupedList(statut?: string | null): boolean {
  const s = String(statut ?? '').toLowerCase().trim();
  if (!s || s === 'en_transit' || s === 'paye' || s === 'exporte') return false;
  return s === 'recu' || s === 'cree' || s === 'transfere';
}

/** Acheteur peut payer le producteur (lot reçu, pas en transit ni déjà payé). */
export function canPayLot(statut?: string | null): boolean {
  if (isEnTransit(statut)) return false;
  const s = String(statut ?? '').toLowerCase().trim();
  if (s === 'paye' || s === 'exporte') return false;
  return s === 'recu' || s === 'cree' || s === 'transfere' || !s;
}

/** Le propriétaire peut transférer (réception confirmée ou lot créé). */
export function canTransferLot(statut?: string | null): boolean {
  if (isEnTransit(statut)) return false;
  const s = String(statut ?? '').toLowerCase().trim();
  if (s === 'exporte' || s === 'paye') return false;
  return s === 'cree' || s === 'recu' || s === 'transfere' || !s;
}

/** Agriculteur : transfert uniquement avant envoi à la coopérative. */
export function canAgriculteurTransfer(statut?: string | null): boolean {
  const s = String(statut ?? '').toLowerCase().trim();
  return !s || s === 'cree';
}

/** Indique si le paiement a été effectué. */
export function isPaye(statut?: string | null): boolean {
  return String(statut ?? '').toLowerCase() === 'paye';
}

export type CdcLotColor = 'red' | 'orange' | 'green' | 'blue' | 'grey';

/**
 * Codage couleur CDC §6.4 :
 * - rouge : local non synchronisé
 * - orange : synchronisé, pas encore transféré / payé
 * - vert : transféré ou payé
 */
export function getCdcLotColor(opts: {
  synced: boolean;
  chainStatut?: string | null;
  localStatus?: string;
}): CdcLotColor {
  if (!opts.synced) return 'red';
  const s = String(opts.chainStatut ?? '').toLowerCase();
  if (s === 'paye' || s === 'exporte' || s === 'transfere') return 'green';
  if (s === 'recu' || s === 'en_transit') return 'orange';
  if (opts.localStatus === 'Problème') return 'grey';
  if (opts.synced && !s) return 'orange';
  return 'orange';
}

const CDC_COLORS: Record<CdcLotColor, LotStatusDisplay> = {
  red: { label: 'Non synchronisé', color: '#FFEBEE', textColor: '#C62828' },
  orange: { label: 'Synchronisé', color: '#FFF3E0', textColor: '#EF6C00' },
  green: { label: 'Transféré / payé', color: '#E8F5E9', textColor: '#2E7D32' },
  blue: { label: 'En cours', color: '#E3F2FD', textColor: '#1565C0' },
  grey: { label: 'Problème', color: '#ECEFF1', textColor: '#616161' },
};

export function mapCdcLotDisplay(opts: {
  synced: boolean;
  chainStatut?: string | null;
  localStatus?: string;
}): LotStatusDisplay {
  const c = getCdcLotColor(opts);
  const base = CDC_COLORS[c];
  const s = String(opts.chainStatut ?? '').toLowerCase();
  if (c === 'green' && s === 'paye') return { ...base, label: 'Payé' };
  if (c === 'green' && s === 'transfere') return { ...base, label: 'Transféré' };
  if (c === 'orange' && s === 'en_transit') return { ...base, label: 'En transit' };
  if (c === 'orange' && s === 'recu') return { ...base, label: 'Reçu' };
  if (!opts.synced) return { ...base, label: 'En attente réseau' };
  return base;
}

/** Statut local (sync hors-ligne) → libellé affiché. */
export function mapLocalSyncStatus(synced: boolean, status?: string): string {
  if (!synced) return 'En attente réseau';
  if (status === 'Problème') return 'Problème';
  if (status === 'En cours') return 'En cours';
  return 'Synchronisé';
}
