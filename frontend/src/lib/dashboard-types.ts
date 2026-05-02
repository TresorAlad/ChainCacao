/** Données dashboard (API `/dashboard/*`) — types minimaux pour éviter `any`. */

export interface RecentTransferRow {
  id?: string
  date?: string
  sender?: string
  receiver?: string
  status?: string
}

export interface ActivityChartRow {
  day?: string
  value?: number | string
  width?: string
}

export interface EudrCompliancePayload {
  percentage?: number
  status?: string
}

export interface AlertsCountPayload {
  total?: number
  urgent?: number
}
