import axios, { AxiosError } from 'axios'
import { getApiBaseUrl, SESSION_EXPIRED_EVENT } from './api-base'
import { clearAuthSessionCookie } from './auth-session-cookie'

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  /** Évite un spinner infini si le backend / Fabric ne répond pas (aucun timeout par défaut dans Axios). */
  timeout: 120_000,
})

function messageFromAxiosError(err: AxiosError): string {
  if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
    return 'Délai dépassé : le serveur n’a pas répondu à temps. Réessayez ou vérifiez la connexion.'
  }
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
  timeout: 60_000,
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

function asBatch(raw: unknown): Batch | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = r.id ?? r.batch_id
  if (typeof id !== 'string' || !id.trim()) return null
  return { ...(raw as unknown as Batch), id: id.trim() }
}

/** GET /lot/:id renvoie `{ success, lot }` côté API Go — utiliser pour axios.data. */
export function unwrapLotFromResponse(data: unknown): Batch | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  const fromLot = asBatch(o.lot)
  if (fromLot) return fromLot
  const fromBatch = asBatch(o.batch)
  if (fromBatch) return fromBatch
  const direct = asBatch(o)
  if (direct) return direct
  const batchId = o.batch_id
  if (typeof batchId === 'string' && batchId.trim()) {
    return { ...(o as unknown as Batch), id: batchId.trim() }
  }
  return null
}

function pickLotField<T>(...values: (T | undefined | null)[]): T | undefined {
  for (const v of values) {
    if (v === undefined || v === null) continue
    if (typeof v === 'string' && v.trim() === '') continue
    if (typeof v === 'number' && !Number.isFinite(v)) continue
    return v
  }
  return undefined
}

/** Fusionne GET /lot, liste « mes lots » et payload d’historique (GetBatch parfois incomplet sur le ledger). */
export function mergeLotDetail(
  lotId: string,
  primary: Batch | null,
  fromList?: Batch | null,
  history?: BatchHistoryEvent[]
): Batch | null {
  const events = history ?? []
  const creation =
    events.find((e) => String(e.type || '').toLowerCase().includes('creat')) ??
    events[0]
  const fromHistory = creation?.payload?.id ? creation.payload : null

  const id = lotId || primary?.id || fromList?.id || fromHistory?.id
  if (!id) return null

  const merged: Batch = {
    id,
    culture: pickLotField(primary?.culture, fromList?.culture, fromHistory?.culture) ?? '',
    variete: pickLotField(primary?.variete, fromList?.variete, fromHistory?.variete),
    quantite:
      pickLotField(primary?.quantite, fromList?.quantite, fromHistory?.quantite) ?? 0,
    lieu: pickLotField(primary?.lieu, fromList?.lieu, fromHistory?.lieu) ?? '',
    latitude: pickLotField(primary?.latitude, fromList?.latitude, fromHistory?.latitude),
    longitude: pickLotField(primary?.longitude, fromList?.longitude, fromHistory?.longitude),
    region: pickLotField(primary?.region, fromList?.region, fromHistory?.region),
    village: pickLotField(primary?.village, fromList?.village, fromHistory?.village),
    parcelle: pickLotField(primary?.parcelle, fromList?.parcelle, fromHistory?.parcelle),
    date_recolte:
      pickLotField(primary?.date_recolte, fromList?.date_recolte, fromHistory?.date_recolte) ?? '',
    proprietaire_id:
      pickLotField(primary?.proprietaire_id, fromList?.proprietaire_id, fromHistory?.proprietaire_id) ??
      '',
    org_id: pickLotField(primary?.org_id, fromList?.org_id, fromHistory?.org_id) ?? '',
    statut: pickLotField(primary?.statut, fromList?.statut, fromHistory?.statut),
    eudr_conforme:
      primary?.eudr_conforme ?? fromList?.eudr_conforme ?? fromHistory?.eudr_conforme ?? false,
    timestamp: pickLotField(primary?.timestamp, fromList?.timestamp, fromHistory?.timestamp),
    certificat_url: pickLotField(
      primary?.certificat_url,
      fromList?.certificat_url,
      fromHistory?.certificat_url
    ),
    photo_url: pickLotField(primary?.photo_url, fromList?.photo_url, fromHistory?.photo_url),
    notes: pickLotField(primary?.notes, fromList?.notes, fromHistory?.notes),
  }

  const hasBody =
    merged.culture ||
    merged.quantite > 0 ||
    merged.lieu ||
    merged.date_recolte ||
    merged.proprietaire_id

  return hasBody || events.length > 0 ? merged : null
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
  suspended?: boolean
  gps_location?: string
  field_surface?: string
  org_name?: string
}

export interface AdminIncident {
  id: string
  type: string
  payload?: Record<string, unknown>
  status: string
  error?: string
  created_at: string
}
