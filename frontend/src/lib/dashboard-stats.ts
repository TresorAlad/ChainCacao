/** Réponse `GET /dashboard/stats` (champs snake_case côté API). */
export interface DashboardStats {
  total_batches?: number
  total_lots?: number
  en_transit?: number
  exportes?: number
  eudr_conformes?: number
  eudr_compliance_pct?: number
  total_actors?: number
  /** Lots distincts présents dans sync_dedup (PostgreSQL). */
  lots_synchronises?: number
  total_weight?: number
  fraud_alerts?: number
  active_lots?: number
}
