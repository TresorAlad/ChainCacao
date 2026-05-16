import type { BatchResponse, BatchTimelineEvent, VerifyBatchResponse } from '@/services/api';

export type TimelineEventKind =
  | 'creation'
  | 'transfert'
  | 'reception'
  | 'paiement'
  | 'transformation'
  | 'certification'
  | 'export'
  | 'maj_poids'
  | 'other';

export interface TimelineDisplayEvent {
  type: TimelineEventKind;
  date: string;
  acteur: string;
  detail: string;
  txHash?: string;
  source: 'blockchain' | 'local';
}

export function historyEventLabel(type?: string): string {
  const t = String(type ?? '').toLowerCase();
  if (t === 'creation') return 'Création du lot';
  if (t === 'transfert') return 'Transfert';
  if (t === 'reception') return 'Réception confirmée';
  if (t === 'paiement' || t === 'paiement_liste') return 'Paiement';
  if (t === 'export') return 'Export';
  if (t === 'maj_poids') return 'Mise à jour du poids';
  return type || 'Événement';
}

export function historyActorLine(event: BatchTimelineEvent): string {
  const t = String(event.type ?? '').toLowerCase();
  if (t === 'transfert' && (event.from_actor_id || event.to_actor_id)) {
    return `${event.from_actor_id || '?'} → ${event.to_actor_id || '?'}`;
  }
  return event.actor_id || event.to_actor_id || event.from_actor_id || '—';
}

export function parseTimelineEvents(events: BatchTimelineEvent[]): TimelineDisplayEvent[] {
  return events.map((e) => {
    const p = e.payload || {};
    const statut = String(p.statut || '').toLowerCase();
    const evtType = String(e.type || '').toLowerCase();

    let type: TimelineEventKind = 'other';
    if (evtType === 'creation' || evtType.includes('creat')) {
      type = 'creation';
    } else if (evtType === 'reception' || evtType.includes('reception')) {
      type = 'reception';
    } else if (evtType === 'paiement' || evtType === 'paiement_liste' || evtType.includes('paiement')) {
      type = 'paiement';
    } else if (evtType === 'transfert' || evtType.includes('transfer') || statut.includes('transit')) {
      type = 'transfert';
    } else if (evtType.includes('transform') || statut.includes('transform')) {
      type = 'transformation';
    } else if (evtType === 'export' || evtType.includes('export')) {
      type = 'export';
    } else if (evtType === 'maj_poids' || evtType.includes('poids')) {
      type = 'maj_poids';
    }

    let date = '—';
    const rawDate = e.created_at || p.timestamp;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!Number.isNaN(d.getTime())) date = d.toLocaleDateString('fr-FR');
    }

    const acteur = historyActorLine(e);

    let detail = `${p.culture ?? '—'} · ${p.quantite ?? '—'} kg · ${p.lieu ?? '—'}`;
    if (type === 'transfert' && (e.from_actor_id || e.to_actor_id)) {
      detail = `Transfert : ${e.from_actor_id || '?'} → ${e.to_actor_id || '?'}`;
      if (p.statut) detail += ` · statut: ${p.statut}`;
    } else if (type === 'reception') {
      detail = 'Réception physique confirmée';
      if (e.actor_id) detail += ` · ${e.actor_id}`;
    } else if (p.statut) {
      detail += ` · statut: ${p.statut}`;
    }
    if (type === 'paiement' && e.commentaire) {
      try {
        const pay = JSON.parse(e.commentaire) as {
          montant_brut?: number;
          marge_fcfa?: number;
          marge_pct?: number;
          montant_net?: number;
        };
        if (pay.montant_brut != null) {
          detail += ` · Brut ${Math.round(pay.montant_brut).toLocaleString('fr-FR')} FCFA`;
          detail += ` · Marge ${pay.marge_pct ?? 0} % (−${Math.round(pay.marge_fcfa ?? 0).toLocaleString('fr-FR')} FCFA)`;
          detail += ` · Net ${Math.round(pay.montant_net ?? 0).toLocaleString('fr-FR')} FCFA`;
        } else {
          detail += ` · ${e.commentaire}`;
        }
      } catch {
        detail += ` · ${e.commentaire}`;
      }
    } else if (e.commentaire) {
      detail += ` · ${e.commentaire}`;
    }
    if (type === 'paiement' && !e.commentaire?.includes('montant_brut')) {
      detail += ' · Paiement enregistré sur la chaîne';
    }

    return {
      type,
      date,
      acteur,
      detail,
      txHash: e.tx_hash,
      source: 'blockchain',
    };
  });
}

export function lotToBlockchainSummary(lot: BatchResponse): TimelineDisplayEvent {
  let date = '—';
  if (lot.timestamp) {
    const d = new Date(lot.timestamp);
    if (!Number.isNaN(d.getTime())) date = d.toLocaleDateString('fr-FR');
  }
  return {
    type: 'creation',
    date,
    acteur: lot.proprietaire_id || '—',
    detail: `${lot.culture ?? '—'} · ${lot.quantite ?? '—'} kg · ${lot.lieu ?? '—'}`,
    source: 'blockchain',
  };
}

/** Événements d’affichage à partir de la réponse publique GET /verify/:id. */
export function eventsFromVerifyResponse(
  data: VerifyBatchResponse
): TimelineDisplayEvent[] | null {
  if (!data.success || !data.lot) return null;
  const timeline = data.timeline ?? [];
  if (timeline.length > 0) return parseTimelineEvents(timeline);
  return [lotToBlockchainSummary(data.lot)];
}
