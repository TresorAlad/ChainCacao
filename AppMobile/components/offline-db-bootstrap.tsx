import { useEffect } from 'react';

import { getDb } from '@/lib/db';

/** Pré-ouvre SQLite + migration AsyncStorage au démarrage (avant la sync). */
export function OfflineDbBootstrap() {
  useEffect(() => {
    void getDb();
  }, []);
  return null;
}
