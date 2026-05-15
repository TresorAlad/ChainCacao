export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const json = atob(b64 + pad);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, skewSec = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  const exp = payload.exp;
  if (typeof exp !== 'number') return false;
  return Date.now() / 1000 >= exp - skewSec;
}

/** Reconstruit un acteur minimal depuis le JWT (persistance session au redémarrage). */
export function actorInfoFromToken(token: string): {
  id: string;
  role?: string;
  org_id?: string;
  orgID?: string;
} | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const id = String(payload.actor_id ?? payload.sub ?? '').trim();
  if (!id) return null;
  const org = payload.org_id != null ? String(payload.org_id) : undefined;
  const role = payload.role != null ? String(payload.role) : undefined;
  return { id, role, org_id: org, orgID: org };
}
