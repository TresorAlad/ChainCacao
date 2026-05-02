/** Aligné sur `tracabilite-api/pkg/models` (JSON snake_case). */
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

export interface Stats {
  totalBatches?: number
  compliantBatches?: number
  transitBatches?: number
  exportedBatches?: number
  totalWeight?: number
  totalActors?: number
}

export interface User {
  token: string
  actor_id?: string
  role?: string
  email?: string
}
