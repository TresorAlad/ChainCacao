/** Cookie httpOnly — presence verifiee par middleware (valeur non lisible cote client). */
export const AUTH_SESSION_COOKIE_NAME = 'chaincacao_jwt'

export async function setAuthSessionCookie(token: string): Promise<void> {
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ token }),
  })
}

export async function clearAuthSessionCookie(): Promise<void> {
  await fetch('/api/auth/session', {
    method: 'DELETE',
    credentials: 'same-origin',
  })
}
