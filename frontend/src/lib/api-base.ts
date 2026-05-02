/** Émis par le client Axios lors d’un 401 pour synchroniser le contexte React. */
export const SESSION_EXPIRED_EVENT = 'chaincacao:session-expired'

/** Base URL API (sans slash final), alignée sur `tracabilite-api` `/api/v1`. */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
  return raw.replace(/\/$/, '')
}
