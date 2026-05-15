/** Formate une adresse à partir de l’API Nominatim (OpenStreetMap). */
export async function reverseGeocodeWeb(latitude: number, longitude: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'ChainCacao/1.0' },
    })
    if (!res.ok) throw new Error('geocode failed')
    const data = (await res.json()) as { display_name?: string }
    if (data.display_name?.trim()) return data.display_name.trim()
  } catch {
    /* ignore */
  }
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}
