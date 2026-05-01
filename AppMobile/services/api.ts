import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'http://13.60.214.56:8080';
export const TOKEN_KEY = 'chaincacao_jwt';
export const USER_KEY = 'chaincacao_user';

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
  email?: string;
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
  dateRecolte: string;   // ISO 8601 (YYYY-MM-DD)
  notes?: string;
}

export interface BatchResponse {
  id: string;            // UUID du lot
  txHash?: string;       // hash de transaction Fabric
  culture?: string;
  quantite?: number;
  lieu?: string;
  dateRecolte?: string;
  proprietaireID?: string;
  statut?: string;
  timestamp?: string;
}

export interface TransferPayload {
  batchID: string;
  toOrg: string;
  commentaire?: string;
}

export const batchApi = {
  create: (payload: CreateBatchPayload) =>
    api.post<BatchResponse>('/api/v1/batch/create', payload),

  transfer: (payload: TransferPayload) =>
    api.post<{ txHash: string }>('/api/v1/batch/transfer', payload),

  get: (id: string) =>
    api.get<BatchResponse>(`/api/v1/batch/${id}`),

  history: (id: string) =>
    api.get<HistoryEvent[]>(`/api/v1/batch/${id}/history`),

  verify: (id: string) =>
    api.get<HistoryEvent[]>(`/api/v1/verify/${id}`),
};

// ─── ACTORS ───────────────────────────────────────────────────────────────────

export const actorsApi = {
  list: () => api.get<ActorInfo[]>('/api/v1/actors'),
};

// ─── HISTORY ──────────────────────────────────────────────────────────────────

export interface HistoryEvent {
  txId?: string;
  timestamp?: string;
  isDelete?: boolean;
  value?: {
    id?: string;
    culture?: string;
    quantite?: number;
    lieu?: string;
    dateRecolte?: string;
    proprietaireID?: string;
    orgID?: string;
    statut?: string;
    timestamp?: string;
  };
}

// ─── HEALTH ───────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => api.get('/health'),
};
