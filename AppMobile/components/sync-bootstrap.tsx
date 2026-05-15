import { useEffect } from 'react';
import { useSync } from '@/hooks/use-sync';

/** Lance la synchronisation en arrière-plan dès le démarrage de l'app. */
export function SyncBootstrap() {
  useSync();
  return null;
}
