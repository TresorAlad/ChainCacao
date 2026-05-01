import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor pour ajouter le token JWT automatiquement
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Interceptor pour gérer les erreurs globalement
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message
    return Promise.reject(new Error(message))
  }
)

export default api

// Types pour les endpoints principaux (à étendre)
export interface Batch {
  id: string
  culture: string
  variete: string
  Quantite: number
  lieu: string
  latitude: number
  longitude: number
  region: string
  village: string
  parcelle: string
  date_recolte: string
  proprietaire_id: string
  org_id: string
  Statut?: string
  EUDRConforme: boolean
  Timestamp: string
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

export interface Stats {
  totalBatches?: number
  compliantBatches?: number
  transitBatches?: number
  exportedBatches?: number
  totalWeight?: number
  totalActors?: number
}
