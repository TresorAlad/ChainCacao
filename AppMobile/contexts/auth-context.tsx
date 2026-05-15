import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { AxiosError } from 'axios';
import {
  authApi,
  TOKEN_KEY,
  USER_KEY,
  HAS_PIN_KEY,
  ActorInfo,
  getApiError,
  meApi,
} from '@/services/api';
import { actorInfoFromToken, isJwtExpired } from '@/lib/jwt-utils';
import {
  loadProfileExtrasForActor,
  saveProfileExtrasForActor,
  StoredProfileExtras,
} from '@/hooks/profile-extra';
import { registerForPushNotifications } from '@/services/push-notifications';

export type AuthContextValue = {
  token: string | null;
  user: ActorInfo | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  isAuthenticated: boolean;
  hasPin: boolean;
  pinUnlocked: boolean;
  needsPinUnlock: boolean;
  canAccessApp: boolean;
  pinUnlockLoading: boolean;
  pinUnlockError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  grantPinUnlock: () => void;
  updateProfile: (patch: Partial<StoredProfileExtras>) => Promise<void>;
  applySessionFromSignup: (token: string, actor: ActorInfo, withPin?: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseStoredUser(raw: string | null): Promise<ActorInfo | null> {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActorInfo;
  } catch {
    return null;
  }
}

async function mergeAndPersistActor(token: string, base: ActorInfo | null): Promise<ActorInfo> {
  const fromJwt = actorInfoFromToken(token);
  const merged: ActorInfo = {
    ...(fromJwt ?? {}),
    ...(base ?? {}),
    id: base?.id ?? fromJwt?.id ?? '',
    role: base?.role ?? fromJwt?.role,
    org_id: base?.org_id ?? fromJwt?.org_id,
    orgID: base?.orgID ?? fromJwt?.orgID,
  };
  if (!merged.id) {
    throw new Error('session invalide');
  }
  const extras = await loadProfileExtrasForActor(merged.id);
  const withExtras: ActorInfo = {
    ...merged,
    ...extras,
    nom: extras.nom ?? merged.nom,
    name: extras.name ?? merged.name,
    gps_location: extras.gps_location ?? merged.gps_location,
    field_surface: extras.field_surface ?? merged.field_surface,
    created_at: extras.created_at ?? merged.created_at,
  };
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(withExtras));
  return withExtras;
}

async function persistSession(token: string, actor: ActorInfo | null): Promise<ActorInfo> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  const full = await mergeAndPersistActor(token, actor);
  return full;
}

async function setHasPinFlag(value: boolean) {
  if (value) {
    await AsyncStorage.setItem(HAS_PIN_KEY, '1');
  } else {
    await AsyncStorage.removeItem(HAS_PIN_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ActorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinUnlockLoading, setPinUnlockLoading] = useState(false);
  const [pinUnlockError, setPinUnlockError] = useState<string | null>(null);

  const clearSession = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
      AsyncStorage.removeItem(HAS_PIN_KEY),
    ]);
    setToken(null);
    setUser(null);
    setHasPin(false);
    setPinUnlocked(false);
    setPinUnlockError(null);
  }, []);

  const applyHasPinFromApi = useCallback(async (flag: boolean) => {
    setHasPin(flag);
    await setHasPinFlag(flag);
    if (!flag) {
      setPinUnlocked(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUserRaw, storedHasPin] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(HAS_PIN_KEY),
        ]);

        if (!storedToken || isJwtExpired(storedToken)) {
          if (storedToken) await clearSession();
          return;
        }

        setToken(storedToken);
        const storedUser = await parseStoredUser(storedUserRaw);
        const restored = await mergeAndPersistActor(storedToken, storedUser);
        setUser(restored);

        const pinRequired = storedHasPin === '1';
        setHasPin(pinRequired);
        setPinUnlocked(!pinRequired);

        try {
          const { data } = await meApi.get();
          if (data.actor) {
            const merged = await mergeAndPersistActor(storedToken, { ...restored, ...data.actor });
            setUser(merged);
          }
          if (typeof data.has_pin === 'boolean') {
            await applyHasPinFromApi(data.has_pin);
            if (data.has_pin) {
              setPinUnlocked(false);
            }
          }
          void registerForPushNotifications();
        } catch (e) {
          const status = (e as AxiosError).response?.status;
          if (status === 401 || status === 403) {
            await clearSession();
          }
        }
      } catch {
        /* stockage inaccessible */
      } finally {
        setInitialized(true);
      }
    })();
  }, [clearSession, applyHasPinFromApi]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if ((state === 'background' || state === 'inactive') && hasPin) {
        setPinUnlocked(false);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [hasPin]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.login({ email, password });
      let actor: ActorInfo | null = data.actor ?? actorInfoFromToken(data.token);
      let apiHasPin = false;
      const me = await meApi.get();
      if (me.data.actor) {
        actor = { ...(actor ?? {}), ...me.data.actor };
      }
      if (typeof me.data.has_pin === 'boolean') {
        apiHasPin = me.data.has_pin;
      }
      const full = await persistSession(data.token, actor);
      setToken(data.token);
      setUser(full);
      await applyHasPinFromApi(apiHasPin);
      setPinUnlocked(!apiHasPin);
      void registerForPushNotifications();
      return true;
    } catch (e) {
      setError(getApiError(e));
      return false;
    } finally {
      setLoading(false);
    }
  }, [applyHasPinFromApi]);

  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    setPinUnlockLoading(true);
    setPinUnlockError(null);
    try {
      await meApi.verifyPin(pin);
      setPinUnlocked(true);
      setPinUnlockError(null);
      return true;
    } catch (e) {
      setPinUnlockError(getApiError(e));
      return false;
    } finally {
      setPinUnlockLoading(false);
    }
  }, []);

  const grantPinUnlock = useCallback(() => {
    setPinUnlocked(true);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(async (patch: Partial<StoredProfileExtras>) => {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return;
    const actor = JSON.parse(raw) as ActorInfo;
    const next: ActorInfo = {
      ...actor,
      ...patch,
      created_at: patch.created_at ?? actor.created_at,
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
    await saveProfileExtrasForActor(actor.id, {
      nom: next.nom,
      name: next.name,
      gps_location: next.gps_location,
      field_surface: next.field_surface,
      created_at: next.created_at,
    });
    setUser(next);
  }, []);

  const applySessionFromSignup = useCallback(
    async (newToken: string, actor: ActorInfo, withPin = false) => {
      const full = await persistSession(newToken, actor);
      setToken(newToken);
      setUser(full);
      await applyHasPinFromApi(withPin);
      setPinUnlocked(true);
      void registerForPushNotifications();
    },
    [applyHasPinFromApi]
  );

  const sessionValid = token != null && !isJwtExpired(token);
  const needsPinUnlock = sessionValid && hasPin && !pinUnlocked;
  const canAccessApp = sessionValid && Boolean(user?.id) && !needsPinUnlock;

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      error,
      initialized,
      isAuthenticated: sessionValid && Boolean(user?.id),
      hasPin,
      pinUnlocked,
      needsPinUnlock,
      canAccessApp,
      pinUnlockLoading,
      pinUnlockError,
      login,
      logout,
      unlockWithPin,
      grantPinUnlock,
      updateProfile,
      applySessionFromSignup,
    }),
    [
      token,
      user,
      loading,
      error,
      initialized,
      sessionValid,
      hasPin,
      pinUnlocked,
      needsPinUnlock,
      canAccessApp,
      pinUnlockLoading,
      pinUnlockError,
      login,
      logout,
      unlockWithPin,
      grantPinUnlock,
      updateProfile,
      applySessionFromSignup,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
