import { extractLotIdFromScanPayload } from '@/utils/lotQr';

describe('extractLotIdFromScanPayload', () => {
  it('retourne le dernier segment de chemin pour une URL verify', () => {
    expect(
      extractLotIdFromScanPayload('https://api.example.com/api/v1/verify/batch-uuid-123')
    ).toBe('batch-uuid-123');
  });

  it('retourne le texte brut si ce n’est pas une URL', () => {
    expect(extractLotIdFromScanPayload('  raw-id-no-url  ')).toBe('raw-id-no-url');
  });

  it('accepte une URL sans sous-chemin significatif', () => {
    expect(extractLotIdFromScanPayload('https://host')).toBe('https://host');
  });
});
