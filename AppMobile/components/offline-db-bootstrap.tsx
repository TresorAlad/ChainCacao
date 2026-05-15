import { useEffect } from 'react';

/** Pré-initialisation de la base de données locale au démarrage. */
export function OfflineDbBootstrap() {
  useEffect(() => {
    // Base SQLite retirée — données servies depuis l'API directement.
    // Composant conservé pour compatibilité avec _layout.tsx.
  }, []);
  return null;
}
