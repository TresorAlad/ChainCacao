/** Émis par le client Axios lors d’un 401 pour synchroniser le contexte React. */
export const SESSION_EXPIRED_EVENT = 'chaincacao:session-expired'

/**
 * Base URL API sans slash final.
 *
 * - Si la page est en **HTTPS** et que `NEXT_PUBLIC_API_URL` commence par **http://**, on utilise
 *   `/api/v1` (proxy Next → `API_REWRITE_TARGET`) pour éviter le blocage mixed content (« Failed to fetch »).
 * - Sinon, si `NEXT_PUBLIC_API_URL` est défini : utilisé tel quel.
 * - Sinon : `/api/v1` via proxy (défaut local : `API_REWRITE_TARGET` → 127.0.0.1:8080).
 */
export function getApiBaseUrl(): string {
  let raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (typeof window !== 'undefined' && raw?.startsWith('http://') && window.location.protocol === 'https:') {
    raw = '/api/v1'
  }
  if (raw) {
    return raw.replace(/\/$/, '')
  }
  return '/api/v1'
}
