/**
 * Extrait l’identifiant de lot depuis le texte scanné (UUID brut ou URL /verify/{id}).
 */
export function extractLotIdFromScanPayload(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (t.toUpperCase().startsWith('LIST-')) return t;
  try {
    const u = new URL(t);
    const seg = u.pathname.split('/').filter(Boolean);
    const last = seg.length ? seg[seg.length - 1] : t;
    if (last.toUpperCase().startsWith('LIST-')) return last;
    return last;
  } catch {
    return t;
  }
}

/** True si le payload correspond à une liste groupée (LIST-…). */
export function isGroupedListId(id: string): boolean {
  return id.trim().toUpperCase().startsWith('LIST-');
}
