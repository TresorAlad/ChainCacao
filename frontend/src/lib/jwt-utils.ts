/** Décode le payload JWT (sans vérification de signature — usage client uniquement). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '='))
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export function isJwtExpired(token: string, skewSec = 30): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload) return true
  const exp = payload.exp
  if (typeof exp !== 'number') return false
  return Date.now() / 1000 >= exp - skewSec
}
