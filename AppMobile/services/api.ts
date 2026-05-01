import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const TOKEN_KEY = 'chaincacao_jwt';
export const USER_KEY = 'chaincacao_user';

type ExpoExtra = { apiUrl?: string };

/** URL de base depuis app.config.js (extra.apiUrl) ou valeur historique. */
export function getApiBaseUrl(): string {
  const fromExtra = (Constants.expoConfig?.extra as ExpoExtra | undefined)?.apiUrl;
  return (
    fromExtra ??
    process.env.EXPO_PUBLIC_API_URL ??
    'http://13.60.214.56:8080'
  );
}

export const API_BASE = getApiBaseUrl();

let sessionInvalidateHandler: (() => Promise<void>) | null = null;

/** Appelé depuis `_layout` : déconnexion + redirection login sur HTTP 401. */
export function setSessionInvalidateHandler(fn: (() => Promise<void>) | null) {
  sessionInvalidateHandler = fn;
}

// Instance Axios centrale
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT sur chaque requête
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && sessionInvalidateHandler) {
      try {
        await sessionInvalidateHandler();
      } catch {
        /* laisser rejeter l’erreur originale */
      }
    }
    return Promise.reject(error);
  }
);

// Normaliser les erreurs API
export function getApiError(e: unknown): string {
  const err = e as AxiosError<{ error?: string; message?: string }>;
  if (err.response?.data?.error) return err.response.data.error;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ECONNABORTED') return 'Délai d\'attente dépassé — vérifiez la connexion';
  if (err.code === 'ERR_NETWORK') return 'Réseau indisponible — mode hors-ligne activé';
  return err.message || 'Erreur inconnue';
}

export function isNetworkError(e: unknown): boolean {
  const err = e as AxiosError;
  return !err.response || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED';
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export interface LoginPayload { email: string; password: string }
export interface LoginResponse { token: string; actor?: ActorInfo }
export interface SignupPayload {
  nom: string;
  email: string;
  password: string;
  org_id?: string;
  role?: string;
  gps_location?: string;
  field_surface?: string;
  org_name?: string;
  pin_code?: string;
}

export interface ActorInfo {
  id: string;
  nom?: string;
  name?: string;
  role?: string;
  orgID?: string;
  org_id?: string;
  email?: string;
  /** Enrichi côté mobile à l'inscription (non renvoyé par le backend actuel) */
  gps_location?: string;
  field_surface?: string;
  created_at?: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/api/v1/auth/login', payload),
  signup: (payload: SignupPayload) =>
    api.post<LoginResponse>('/api/v1/auth/signup', payload),
};

// ─── BATCH ────────────────────────────────────────────────────────────────────

export interface CreateBatchPayload {
  culture: string;       // type de produit (cacao, maïs…)
  quantite: number;      // poids en kg
  lieu: string;          // localisation / GPS
  /** ISO YYYY-MM-DD — JSON snake_case pour Gin */
  date_recolte: string;
  notes?: string;
}

export interface BatchResponse {
  id: string;            // UUID du lot
  tx_hash?: string;
  culture?: string;
  quantite?: number;
  lieu?: string;
  date_recolte?: string;
  proprietaire_id?: string;
  org_id?: string;
  statut?: string;
  timestamp?: string;
  notes?: string;
}

/** Événement renvoyé par Fabric dans `timeline` / `events` (verify & history). */
export interface BatchTimelineEvent {
  batch_id?: string;
  type?: string;
  from_actor_id?: string;
  to_actor_id?: string;
  commentaire?: string;
  tx_hash?: string;
  actor_id?: string;
  created_at?: string;
  payload?: {
    id?: string;
    culture?: string;
    quantite?: number;
    lieu?: string;
    date_recolte?: string;
    proprietaire_id?: string;
    org_id?: string;
    statut?: string;
    timestamp?: string;
    notes?: string;
  };
}

export interface VerifyBatchResponse {
  success?: boolean;
  lot?: BatchResponse;
  timeline?: BatchTimelineEvent[];
  origin?: Record<string, unknown>;
  owner?: Record<string, unknown>;
}

export interface BatchHistoryApiResponse {
  success?: boolean;
  events?: BatchTimelineEvent[];
}

/** Réponse POST /api/v1/batch/create */
export interface CreateBatchResponse {
  success?: boolean;
  tx_hash?: string;
  batch?: BatchResponse;
}

export interface TransferPayload {
  batch_id: string;
  to_actor_id: string;
  commentaire?: string;
}

export interface TransferApiResponse {
  success?: boolean;
  tx_hash?: string;
  batch?: BatchResponse;
}

export const batchApi = {
  create: (payload: CreateBatchPayload) =>
    api.post<CreateBatchResponse>('/api/v1/batch/create', payload),

  transfer: (payload: TransferPayload) =>
    api.post<TransferApiResponse>('/api/v1/batch/transfer', payload),

  get: (id: string) =>
    api.get<BatchResponse>(`/api/v1/batch/${encodeURIComponent(id)}`),

  history: (id: string) =>
    api.get<BatchHistoryApiResponse>(`/api/v1/batch/${encodeURIComponent(id)}/history`),

  verify: (id: string) =>
    api.get<VerifyBatchResponse>(`/api/v1/verify/${encodeURIComponent(id)}`),
};

// ─── ACTORS ───────────────────────────────────────────────────────────────────

export interface ActorsListResponse {
  success?: boolean;
  actors?: ActorInfo[];
}

export const actorsApi = {
  list: () => api.get<ActorsListResponse>('/api/v1/actors'),
};

// ─── HEALTH ───────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => api.get('/health'),
};
