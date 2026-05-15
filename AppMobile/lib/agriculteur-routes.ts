/**
 * Href Expo Router pour les écrans du groupe (agriculteur).
 * Sans le préfixe du groupe, push('/nouveaulot') peut ne rien faire selon la version / la pile.
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
