import axios, { AxiosError } from 'axios'
import { getApiBaseUrl, SESSION_EXPIRED_EVENT } from './api-base'
import { clearAuthSessionCookie } from './auth-session-cookie'

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

function messageFromAxiosError(err: AxiosError): string {
  const data = err.response?.data as Record<string, unknown> | undefined
  if (data && typeof data === 'object') {
    if (typeof data.error === 'string') return data.error
    if (typeof data.message === 'string') return data.message
  }
  return err.message || 'Erreur réseau'
}

/** Erreur enrichie avec le code HTTP pour la gestion métier (403, etc.). */
export function apiErrorFromAxios(err: AxiosError): Error & { status?: number } {
  const status = err.response?.status
  const message = messageFromAxiosError(err)
  return Object.assign(new Error(message), { status })
}

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const status = err.response?.status
    if (typeof window !== 'undefined' && status === 401) {
      void clearAuthSessionCookie()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      const path = window.location.pathname
      const publicPaths = /^\/($|login|register|verify|compte-application-mobile)/
      if (!publicPaths.test(path)) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(apiErrorFromAxios(err))
  }
)

/** Client sans redirection 401 — endpoints publics (ex. /verify/:id). */
export const publicApi = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

export default api

/** Réponse JSON des handlers Go (`pkg/models`). */
export interface Batch {
  id: string
  culture: string
  variete?: string
  quantite: number
  lieu: string
  latitude?: number
  longitude?: number
  region?: string
  village?: string
  parcelle?: string
  date_recolte: string
  proprietaire_id: string
  org_id: string
  statut?: string
  eudr_conforme: boolean
  timestamp?: string
  certificat_url?: string
  photo_url?: string
  notes?: string
}

export interface BatchHistoryEvent {
  batch_id: string
  type: string
  from_actor_id?: string
  to_actor_id?: string
  commentaire?: string
  tx_hash?: string
  actor_id?: string
  created_at: string
  payload: Batch
}

export interface ActorDTO {
  id: string
  nom: string
  email?: string
  org_id: string
  role: string
}
