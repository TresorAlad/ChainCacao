/**
 * Mémorise le choix « interface principale » à l’inscription sur ce navigateur,
 * sans modifier l’API (clé par identifiant acteur après la première session).
 */
const PREFIX = 'chaincacao_signup_channel:'

export type SignupChannel = 'web' | 'mobile'

export function setSignupChannel(actorId: string, channel: SignupChannel): void {
  if (!actorId || typeof window === 'undefined') return
  localStorage.setItem(PREFIX + actorId, channel)
}

export function getSignupChannel(actorId: string | undefined): SignupChannel | null {
  if (!actorId || typeof window === 'undefined') return null
  const v = localStorage.getItem(PREFIX + actorId)
  if (v === 'web' || v === 'mobile') return v
  return null
}

export function clearSignupChannel(actorId: string): void {
  if (!actorId || typeof window === 'undefined') return
  localStorage.removeItem(PREFIX + actorId)
}
