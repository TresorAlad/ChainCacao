import type { AxiosError } from 'axios'

const PARTIAL_SUCCESS_MARKERS = [
  'liste créée sur la blockchain',
  'enregistrement local échoué',
]

/** La liste existe sur Fabric mais l’index PostgreSQL a échoué. */
export function isGroupedListPartialSuccess(err: unknown): boolean {
  const e = err as AxiosError<{ error?: string }>
  const msg = e.response?.data?.error ?? (err instanceof Error ? err.message : '')
  if (!msg) return false
  const lower = msg.toLowerCase()
  return PARTIAL_SUCCESS_MARKERS.every((m) => lower.includes(m.toLowerCase()))
}

export function groupedListPartialSuccessMessage(listId: string): string {
  return (
    `Liste ${listId} enregistrée sur la blockchain. ` +
    `L’index serveur n’a pas pu être mis à jour : vous pouvez quand même payer avec cet identifiant. ` +
    `Demandez à l’admin de redémarrer l’API (migrations PostgreSQL).`
  )
}
