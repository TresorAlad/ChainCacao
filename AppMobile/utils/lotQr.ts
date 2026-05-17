/**
 * Extrait l’identifiant depuis un QR (LIST-…, TC-…, ou URL /verify/… /qrcode/…).
 */
export function extractLotIdFromScanPayload(raw: string): string {
  const t = raw.trim();
  if (!t) return t;

  const fromListPrefix = (s: string) => {
    const m = s.trim().match(/^list-(.+)$/i);
    return m ? `LIST-${m[1]}` : s.trim();
  };

  if (!t.includes('/')) {
    return fromListPrefix(t);
  }

  try {
    const u = new URL(t);
    const seg = u.pathname.split('/').filter(Boolean);
    const last = seg.length ? seg[seg.length - 1] : t;
    return fromListPrefix(last);
  } catch {
    return fromListPrefix(t);
  }
}

/** Identifiant LIST-… normalisé (casse) pour les appels API / PostgreSQL. */
export function normalizeGroupedListId(raw: string): string {
  return extractLotIdFromScanPayload(raw);
}

/** True si le payload correspond à une liste groupée (LIST-…). */
export function isGroupedListId(id: string): boolean {
  return /^list-/i.test(id.trim());
}
