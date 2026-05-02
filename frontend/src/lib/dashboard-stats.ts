/** Réponse `GET /dashboard/stats` (champs snake_case côté API). */
export interface DashboardStats {
  total_batches?: number
  total_lots?: number
  en_transit?: number
  exportes?: number
  eudr_conformes?: number
  total_actors?: number
  total_weight?: number
}
