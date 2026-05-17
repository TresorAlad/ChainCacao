import type { AxiosError } from 'axios';

const PARTIAL_SUCCESS_MARKERS = [
  'liste créée sur la blockchain',
  'enregistrement local échoué',
];

/** La liste existe sur Fabric mais l’index PostgreSQL a échoué (souvent migration manquante côté serveur). */
export function isGroupedListPartialSuccess(e: unknown): boolean {
  const err = e as AxiosError<{ error?: string }>;
  const msg = err.response?.data?.error ?? '';
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return PARTIAL_SUCCESS_MARKERS.every((m) => lower.includes(m.toLowerCase()));
}

export function groupedListPartialSuccessMessage(listId: string): string {
  return (
    `Liste ${listId} enregistrée sur la blockchain.\n\n` +
    `L’index serveur (PostgreSQL) n’a pas pu être mis à jour. ` +
    `Vous pouvez quand même utiliser cet identifiant pour le paiement (QR / menu Payer liste). ` +
    `Demandez à l’admin de redémarrer l’API pour appliquer les migrations, puis réessayez si besoin.`
  );
}
