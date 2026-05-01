import type { BatchTimelineEvent, VerifyBatchResponse } from '@/services/api';
import {
  parseTimelineEvents,
  lotToBlockchainSummary,
  eventsFromVerifyResponse,
} from '@/utils/historiqueTimeline';

describe('historiqueTimeline', () => {
  it('parseTimelineEvents classe un transfert', () => {
    const events: BatchTimelineEvent[] = [
      {
        type: 'TRANSFER',
        payload: { statut: 'Transféré', culture: 'cacao', quantite: 10, lieu: 'X' },
        to_actor_id: 'actor-b',
        tx_hash: '0xabc',
      },
    ];
    const out = parseTimelineEvents(events);
    expect(out[0].type).toBe('transfert');
    expect(out[0].acteur).toBe('actor-b');
    expect(out[0].txHash).toBe('0xabc');
  });

  it('eventsFromVerifyResponse utilise la timeline si présente', () => {
    const data: VerifyBatchResponse = {
      success: true,
      lot: {
        id: '1',
        culture: 'cacao',
        quantite: 5,
        lieu: 'Y',
        timestamp: '2026-01-01T00:00:00Z',
      },
      timeline: [{ type: 'CREATE', payload: { culture: 'cacao', quantite: 5, lieu: 'Y' } }],
    };
    const ev = eventsFromVerifyResponse(data);
    expect(ev).not.toBeNull();
    expect(ev!.length).toBe(1);
  });

  it('eventsFromVerifyResponse résume le lot si timeline vide', () => {
    const data: VerifyBatchResponse = {
      success: true,
      lot: {
        id: '1',
        proprietaire_id: 'p1',
        culture: 'cacao',
        quantite: 3,
        lieu: 'Z',
        timestamp: '2026-02-01T00:00:00Z',
      },
      timeline: [],
    };
    const ev = eventsFromVerifyResponse(data)!;
    expect(ev.length).toBe(1);
    expect(ev[0].type).toBe('creation');
    expect(ev[0].acteur).toBe('p1');
  });

  it('lotToBlockchainSummary formate une entrée création', () => {
    const s = lotToBlockchainSummary({
      id: 'x',
      proprietaire_id: 'p',
      culture: 'c',
      quantite: 1,
      lieu: 'l',
      timestamp: '2026-03-15T12:00:00Z',
    });
    expect(s.date).not.toBe('—');
    expect(s.source).toBe('blockchain');
    expect(s.type).toBe('creation');
  });

  it('eventsFromVerifyResponse renvoie null si succès sans lot', () => {
    expect(eventsFromVerifyResponse({ success: true })).toBeNull();
  });
});
