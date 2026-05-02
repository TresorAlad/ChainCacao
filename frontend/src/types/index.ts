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

export interface User {
  token: string
  actor_id?: string
  role?: string
  email?: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (actor_id: string, pin: string) => Promise<User>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}
