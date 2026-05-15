/** Formate une adresse à partir de l’API Nominatim (OpenStreetMap). */
export async function reverseGeocodeWeb(latitude: number, longitude: number): Promise<string> {
  const r = await reverseGeocodeWebParsed(latitude, longitude)
  return r.lieu
}

export type ReverseGeocodeWebResult = {
  lieu: string
  region: string
}

/** Adresse affichable + région (état / province) pour les champs API. */
export async function reverseGeocodeWebParsed(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeWebResult> {
  const fallback: ReverseGeocodeWebResult = {
    lieu: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    region: '',
  }
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'ChainCacao/1.0' },
    })
    if (!res.ok) throw new Error('geocode failed')
    const data = (await res.json()) as {
      display_name?: string
      address?: Record<string, string>
    }
    const addr = data.address ?? {}
    const region =
      addr.state ||
      addr.region ||
      addr.county ||
      addr.province ||
      addr.state_district ||
      ''
    const lieu = data.display_name?.trim()
    if (lieu) return { lieu, region }
  } catch {
    /* ignore */
  }
  return fallback
}
