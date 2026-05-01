import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AxiosError } from 'axios';
import {
  authApi,
  TOKEN_KEY,
  USER_KEY,
  ActorInfo,
  getApiError,
  actorsApi,
} from '@/services/api';
import { LOTS_STORAGE_KEY } from '@/hooks/use-storage';
import {
  loadProfileExtrasForActor,
  saveProfileExtrasForActor,
  StoredProfileExtras,
  PROFILE_EXTRA_KEY,
} from '@/hooks/profile-extra';

export type AuthContextValue = {
  token: string | null;
  user: ActorInfo | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<StoredProfileExtras>) => Promise<void>;
  applySessionFromSignup: (token: string, actor: ActorInfo) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ActorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              /* ignore corrupt profile json */
            }
          }
          try {
            await actorsApi.list();
          } catch (e) {
            const status = (e as AxiosError).response?.status;
            if (status === 401 || status === 403) {
              await AsyncStorage.multiRemove([
                TOKEN_KEY,
                USER_KEY,
                LOTS_STORAGE_KEY,
                PROFILE_EXTRA_KEY,
              ]);
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch {
        /* stockage inaccessible */
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.login({ email, password });
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      if (data.actor) {
        const extras = await loadProfileExtrasForActor(data.actor.id);
        const merged: ActorInfo = {
          ...data.actor,
          ...extras,
          nom: extras.nom ?? data.actor.nom,
          name: extras.name ?? data.actor.name,
          gps_location: extras.gps_location ?? data.actor.gps_location,
          field_surface: extras.field_surface ?? data.actor.field_surface,
          created_at: extras.created_at ?? data.actor.created_at,
        };
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(merged));
        setUser(merged);
      }
      return true;
    } catch (e) {
      setError(getApiError(e));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
      AsyncStorage.removeItem(LOTS_STORAGE_KEY),
      AsyncStorage.removeItem(PROFILE_EXTRA_KEY),
    ]);
    setToken(null);
    setUser(null);
  }, []);

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

  const applySessionFromSignup = useCallback(async (newToken: string, actor: ActorInfo) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(actor));
    setToken(newToken);
    setUser(actor);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      error,
      initialized,
      isAuthenticated: !!token,
      login,
      logout,
      updateProfile,
      applySessionFromSignup,
    }),
    [
      token,
      user,
      loading,
      error,
      initialized,
      login,
      logout,
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
