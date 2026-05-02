/** Nom/valeur du cookie lu par `middleware.ts` (mirroir minimal du JWT en localStorage). */
export const AUTH_SESSION_COOKIE_NAME = 'chaincacao_auth'
export const AUTH_SESSION_COOKIE_VALUE = '1'

const MAX_AGE_SEC = 60 * 60 * 24 * 7

export function setAuthSessionCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_SESSION_COOKIE_NAME}=${AUTH_SESSION_COOKIE_VALUE}; Path=/; SameSite=Lax; Max-Age=${MAX_AGE_SEC}`
}

export function clearAuthSessionCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`
}
