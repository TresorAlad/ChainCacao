import type { AxiosError } from 'axios'

/** Message d’erreur exploitable depuis un `catch (unknown)`. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    const e = err as Error & { status?: number }
    if (typeof e.status === 'number' && e.status >= 400) {
      return `${e.message} (HTTP ${e.status})`
    }
    return err.message
  }
  if (typeof err === 'string' && err.trim()) return err
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message: unknown }).message
    if (typeof m === 'string' && m.trim()) return m
  }
  return fallback
}

/** Extrait un message depuis une réponse Axios (utilitaire formulaires / logs). */
export function getAxiosErrorDetail(err: unknown): { message: string; status?: number } {
  const ax = err as AxiosError<{ error?: string; message?: string }>
  const status = ax.response?.status
  const data = ax.response?.data
  let message =
    (data && typeof data === 'object' && typeof data.error === 'string' && data.error) ||
    (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
    (err instanceof Error ? err.message : '') ||
    'Erreur réseau'
  if (typeof status === 'number') {
    message = `${message} (HTTP ${status})`
  }
  return { message, status }
}
