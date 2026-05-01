import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActorInfo } from '@/services/api';

/** Persistance des champs profil par acteur (GPS, surface, date d'inscription) après logout / login. */
export const PROFILE_EXTRA_KEY = 'chaincacao_profile_extra';

export type StoredProfileExtras = Pick<
  ActorInfo,
  'gps_location' | 'field_surface' | 'created_at' | 'nom' | 'name'
>;

export async function loadProfileExtrasForActor(
  actorId: string
): Promise<Partial<StoredProfileExtras>> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_EXTRA_KEY);
    if (!raw) return {};
    const all = JSON.parse(raw) as Record<string, Partial<StoredProfileExtras>>;
    return all[actorId] || {};
  } catch {
    return {};
  }
}

export async function saveProfileExtrasForActor(
  actorId: string,
  patch: Partial<StoredProfileExtras>
): Promise<void> {
  const raw = await AsyncStorage.getItem(PROFILE_EXTRA_KEY);
  const all: Record<string, Partial<StoredProfileExtras>> = raw ? JSON.parse(raw) : {};
  all[actorId] = { ...all[actorId], ...patch };
  await AsyncStorage.setItem(PROFILE_EXTRA_KEY, JSON.stringify(all));
}
