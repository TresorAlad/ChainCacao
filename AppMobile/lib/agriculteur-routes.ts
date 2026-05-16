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
  qrLot: (lotId: string) => `/(agriculteur)/qr-lot?lotId=${encodeURIComponent(lotId)}`,
  paiementLot: (lotId: string) => `/(agriculteur)/paiement-lot?lotId=${encodeURIComponent(lotId)}`,
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
  // #region agent log
  fetch('http://127.0.0.1:7502/ingest/021a24f4-c602-42f7-9527-28f6d89d0b6f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e5623e'},body:JSON.stringify({sessionId:'e5623e',location:'agriculteur-routes.ts:navigateAgriculteurFromTab',message:'tab_nav',data:{source,path,isNouveau:path===AG.nouveaulot},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  logNavigation(source, path);
  if (path === AG.nouveaulot) {
    router.push(path as any);
    return;
  }
  router.replace(path as any);
}
