import type { BatchResponse, BatchTimelineEvent, VerifyBatchResponse } from '@/services/api';

export interface TimelineDisplayEvent {
  type: 'creation' | 'transfert' | 'transformation' | 'certification';
  date: string;
  acteur: string;
  detail: string;
  txHash?: string;
  source: 'blockchain' | 'local';
}

export function parseTimelineEvents(events: BatchTimelineEvent[]): TimelineDisplayEvent[] {
  return events.map((e) => {
    const p = e.payload || {};
    const statut = String(p.statut || '').toLowerCase();
    const evtType = String(e.type || '').toLowerCase();
    let type: TimelineDisplayEvent['type'] = 'creation';
    if (
      evtType.includes('transfer') ||
      statut.includes('transfér') ||
      statut.includes('transfer')
    ) {
      type = 'transfert';
    } else if (evtType.includes('transform') || statut.includes('transform')) {
      type = 'transformation';
    }

    let date = '—';
    const rawDate = e.created_at || p.timestamp;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!Number.isNaN(d.getTime())) date = d.toLocaleDateString('fr-FR');
    }

    const acteur =
      e.to_actor_id ||
      e.actor_id ||
      e.from_actor_id ||
      p.proprietaire_id ||
      p.org_id ||
      '—';

    let detail = `${p.culture ?? '—'} · ${p.quantite ?? '—'} kg · ${p.lieu ?? '—'}`;
    if (e.commentaire) detail += ` · ${e.commentaire}`;

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
