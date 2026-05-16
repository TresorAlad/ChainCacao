/**
 * Href Expo Router pour les écrans du groupe (agriculteur).
 * Toujours utiliser le préfixe `/(agriculteur)/…` pour éviter une résolution vers un écran vide
 * (stack racine sans feuille `nouveaulot`).
 */
export const AG = {
  accueil: '/(agriculteur)/accueil',
  meslots: '/(agriculteur)/meslots',
  nouveaulot: '/(agriculteur)/nouveaulot',
  portefeuille: '/(agriculteur)/portefeuille',
  profil: '/(agriculteur)/profil',
  lotDetail: (lotId: string) => `/(agriculteur)/lot-detail?lotId=${encodeURIComponent(lotId)}`,
  qrLot: (lotId: string) => `/(agriculteur)/qr-lot?lotId=${encodeURIComponent(lotId)}`,
  paiementLot: (lotId: string) => `/(agriculteur)/paiement-lot?lotId=${encodeURIComponent(lotId)}`,
  historiqueLot: (lotId: string) => `/historique?lotId=${encodeURIComponent(lotId)}`,
  transfertLot: (lotId: string) => `/transfert?lotId=${encodeURIComponent(lotId)}`,
} as const;

/** En développement : journaliser les navigations pour diagnostiquer un tap « + » sans effet. */
export function logNavigation(_source: string, href: string) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[ChainCacao][nav] ${_source} → ${href}`);
  }
}

type TabRouter = { push: (href: string) => void; replace: (href: string) => void };

/**
 * Depuis les onglets agriculteur : « Nouveau lot » en push (pile), le reste en replace pour éviter d’empiler les onglets.
 */
export function navigateAgriculteurFromTab(router: TabRouter, path: string, source: string) {
  logNavigation(source, path);
  if (path === AG.nouveaulot) {
    router.push(path as any);
    return;
  }
  router.replace(path as any);
}
