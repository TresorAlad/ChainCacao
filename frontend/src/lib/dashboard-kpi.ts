import type { DashboardStats } from '@/lib/dashboard-stats'

/** Affiche un entier KPI (0 si absent, pas de tiret après chargement). */
export function displayKpiNumber(value: number | null | undefined, loading: boolean): string {
  if (loading) return '—'
  if (value == null || Number.isNaN(Number(value))) return '0'
  return Number(value).toLocaleString('fr-FR')
}

/** Volume tracé : poids total si disponible, sinon nombre de lots. */
export function displayTracedVolume(stats: DashboardStats | null | undefined, loading: boolean): string {
  if (loading) return '—'
  const w = stats?.total_weight
  if (w != null && w > 0) return `${w.toLocaleString('fr-FR')} kg`
  const lots = stats?.total_batches ?? stats?.total_lots ?? stats?.active_lots
  if (lots != null && lots > 0) return `${displayKpiNumber(lots, false)} lot(s)`
  return '0 kg'
}

export function pickTotalLots(stats: DashboardStats | null | undefined): number | undefined {
  if (!stats) return undefined
  const n = stats.total_batches ?? stats.total_lots ?? stats.active_lots
  return n != null ? Number(n) : undefined
}
