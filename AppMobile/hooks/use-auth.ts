import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback, useEffect } from 'react';
import { authApi, TOKEN_KEY, USER_KEY, ActorInfo, getApiError } from '@/services/api';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ActorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Charger le token et l'utilisateur stockés au démarrage
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (_) {}
      setInitialized(true);
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
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.actor));
        setUser(data.actor);
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
    ]);
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token;

  return { token, user, loading, error, initialized, isAuthenticated, login, logout };
}
