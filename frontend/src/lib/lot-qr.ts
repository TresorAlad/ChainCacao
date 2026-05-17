/**
 * Extrait l’identifiant depuis un QR ou une saisie (LIST-…, lot TC-…, URL /verify/…).
 */
export function extractLotIdFromScanPayload(raw: string): string {
  const t = raw.trim()
  if (!t) return t

  const fromListPrefix = (s: string) => {
    const m = s.trim().match(/^list-(.+)$/i)
    return m ? `LIST-${m[1]}` : s.trim()
  }

  if (!t.includes('/')) {
    return fromListPrefix(t)
  }

  try {
    const u = new URL(t)
    const seg = u.pathname.split('/').filter(Boolean)
    const last = seg.length ? seg[seg.length - 1] : t
    return fromListPrefix(last)
  } catch {
    return fromListPrefix(t)
  }
}

export function normalizeGroupedListId(raw: string): string {
  return extractLotIdFromScanPayload(raw)
}

export function isGroupedListId(id: string): boolean {
  return /^list-/i.test(id.trim())
}
