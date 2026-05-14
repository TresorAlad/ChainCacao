import { useSync } from '@/hooks/use-sync';

/** Monte la synchronisation périodique des lots hors-ligne (dans AuthProvider). */
export function SyncBootstrap() {
  useSync();
  return null;
}
