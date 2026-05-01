import { useLayoutEffect } from 'react';
import { useRouter } from 'expo-router';
import { setSessionInvalidateHandler } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';

/**
 * Réagit aux réponses HTTP 401 en déconnectant l’utilisateur (intercepteur Axios).
 */
export function SessionInvalidateBridge() {
  const router = useRouter();
  const { logout } = useAuth();

  useLayoutEffect(() => {
    setSessionInvalidateHandler(async () => {
      await logout();
      router.replace('/login');
    });
    return () => setSessionInvalidateHandler(null);
  }, [logout, router]);

  return null;
}
