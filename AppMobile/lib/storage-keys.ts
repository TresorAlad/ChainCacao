/** Événement : recharger les listes de lots depuis l'API. */
export const LOTS_UPDATED_EVENT = 'chaincacao:lotsUpdated';

/** Clé AsyncStorage : file d'attente des lots / transferts / réceptions hors-ligne. */
export const OFFLINE_QUEUE_KEY = 'chaincacao_offline_queue';

/** Événement : la file d'attente offline a été modifiée. */
export const OFFLINE_QUEUE_UPDATED_EVENT = 'chaincacao:offlineQueueUpdated';

/** Clé AsyncStorage : cache des lots de la coopérative. */
export const COOP_LOTS_CACHE_KEY = 'chaincacao_coop_lots_cache';
