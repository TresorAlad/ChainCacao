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

export type ActorWithGps = {
  id: string
  nom: string
  role?: string
  gps_location?: string
}

export function markersFromActors(
  actors: ActorWithGps[],
  options?: { roleFilter?: string; idPrefix?: string }
): MapMarker[] {
  const markers: MapMarker[] = []
  for (const actor of actors) {
    if (options?.roleFilter && actor.role !== options.roleFilter) continue
    const raw = actor.gps_location?.trim()
    if (!raw) continue
    const c = parseGpsString(raw)
    if (!c) continue
    markers.push({
      ...c,
      id: options?.idPrefix ? `${options.idPrefix}-${actor.id}` : actor.id,
      label: `${actor.nom}${actor.role ? ` (${actor.role})` : ''}`,
    })
  }
  return markers
}

export function markersFromLots(
  lots: Array<{ id: string; culture?: string; latitude?: number | null; longitude?: number | null }>
): MapMarker[] {
  const markers: MapMarker[] = []
  for (const lot of lots) {
    const c = coordsFromLot(lot.latitude, lot.longitude)
    if (!c) continue
    markers.push({
      ...c,
      id: `lot-${lot.id}`,
      label: `${lot.id}${lot.culture ? ` — ${lot.culture}` : ''}`,
    })
  }
  return markers
}
