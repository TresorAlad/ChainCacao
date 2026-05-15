import * as Location from 'expo-location';

/** Formate une adresse lisible à partir du résultat Expo reverse geocoding. */
export function formatReverseGeocode(
  results: Location.LocationGeocodedAddress[]
): string {
  if (!results.length) return '';
  const g = results[0];
  const parts: string[] = [];
  const street = [g.streetNumber, g.street].filter(Boolean).join(' ').trim();
  if (street) parts.push(street);
  if (g.district) parts.push(g.district);
  if (g.city) parts.push(g.city);
  else if (g.subregion) parts.push(g.subregion);
  if (g.region) parts.push(g.region);
  if (g.country) parts.push(g.country);
  return parts.filter(Boolean).join(', ');
}

/** Géocodage inverse GPS → adresse (Expo, sans clé API). */
export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number
): Promise<string> {
  const r = await reverseGeocodeCoordsWithRegion(latitude, longitude);
  return r.lieu;
}

/** Adresse + région pour les champs API (aligné web). */
export async function reverseGeocodeCoordsWithRegion(
  latitude: number,
  longitude: number
): Promise<{ lieu: string; region: string }> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const formatted = formatReverseGeocode(results);
    const g = results[0];
    const region = (g?.region || g?.subregion || '').trim();
    const lieu =
      formatted.trim() || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    return { lieu, region };
  } catch {
    /* ignore */
  }
  return {
    lieu: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    region: '',
  };
}
