/** Centre par défaut : Lomé / Togo */
export const TOGO_MAP_CENTER = { lat: 6.1319, lng: 1.2228 } as const
export const DEFAULT_MAP_ZOOM = 8
export const DETAIL_MAP_ZOOM = 14

export type LatLng = { lat: number; lng: number }

export function parseGpsString(raw: string): LatLng | null {
  const parts = raw
    .split(/[,;]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !Number.isNaN(n))
  if (parts.length < 2) return null
  const lat = parts[0]
  const lng = parts[1]
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

export function formatGpsString(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

export function coordsFromLot(lat?: number | null, lng?: number | null): LatLng | null {
  if (lat == null || lng == null) return null
  if (!lat && !lng) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

export type MapMarker = LatLng & { label?: string; id?: string }
