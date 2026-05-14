import type { ActorInfo } from '@/services/api';

/** Écran d’accueil Expo Router selon le rôle renvoyé par l’API. */
export function homePathForActor(actor: ActorInfo | null | undefined): `/${string}` {
  const r = (actor?.role ?? '').toLowerCase().trim();
  if (r.includes('export')) return '/(exportateur)/accueil';
  if (r.includes('coop')) return '/(cooperative)/accueil';
  if (r.includes('transform')) return '/(exportateur)/accueil';
  return '/(agriculteur)/accueil';
}
