/**
 * Href Expo Router pour les écrans du groupe (agriculteur).
 * - Chemins courts (`/nouveaulot`, `/qr-lot`, …) lorsque le fichier est unique dans `app/` (recommandé Expo).
 * - Préfixe `/(agriculteur)/…` pour les noms partagés avec d’autres groupes (`accueil`, `profil`, `portefeuille`).
 */
export const AG = {
  accueil: '/(agriculteur)/accueil',
  meslots: '/meslots',
  nouveaulot: '/nouveaulot',
  portefeuille: '/(agriculteur)/portefeuille',
  profil: '/(agriculteur)/profil',
  qrLot: (lotId: string) => `/qr-lot?lotId=${encodeURIComponent(lotId)}`,
  paiementLot: (lotId: string) => `/paiement-lot?lotId=${encodeURIComponent(lotId)}`,
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
