/**
 * Extrait l’identifiant de lot depuis le texte scanné (UUID brut ou URL /verify/{id}).
 */
export function extractLotIdFromScanPayload(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  try {
    const u = new URL(t);
    const seg = u.pathname.split('/').filter(Boolean);
    return seg.length ? seg[seg.length - 1] : t;
  } catch {
    return t;
  }
}
