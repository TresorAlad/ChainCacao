import type { CreateBatchPayload, TransferPayload } from '@/services/api';

describe('contrats payloads batch', () => {
  it('CreateBatchPayload suit snake_case attendu par Gin', () => {
    const p: CreateBatchPayload = {
      culture: 'cacao',
      quantite: 100,
      lieu: 'GPS',
      date_recolte: '2026-05-01',
      notes: 'LOT-REF-1',
    };
    expect(p.date_recolte).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof p.quantite).toBe('number');
  });

  it('TransferPayload expose batch_id et to_actor_id', () => {
    const p: TransferPayload = {
      batch_id: '550e8400-e29b-41d4-a716-446655440000',
      to_actor_id: '660e8400-e29b-41d4-a716-446655440001',
      commentaire: 'livraison',
    };
    expect(p.batch_id).toContain('-');
    expect(p.to_actor_id).toContain('-');
  });
});
