import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const TOKEN_KEY = 'chaincacao_jwt';
export const USER_KEY = 'chaincacao_user';
export const HAS_PIN_KEY = 'chaincacao_has_pin';

type ExpoExtra = { apiUrl?: string };

/** URL de base : `extra.apiUrl` dans app.config.js (EXPO_PUBLIC_API_URL en build). */
export function getApiBaseUrl(): string {
  const fromExtra = (Constants.expoConfig?.extra as ExpoExtra | undefined)?.apiUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim()) {
    const url = fromExtra.trim();
    if (url.includes('127.0.0.1') || url.includes('localhost')) {
      console.warn(
        '[ChainCacao] ⚠️  URL API localhost détectée (' + url + ').\n' +
        'Ce build pointe vers localhost et ne fonctionnera PAS sur un téléphone réel.\n' +
        'Rebuild avec : eas build --profile preview --platform android\n' +
        'Ou en local   : EXPO_PUBLIC_API_URL=http://13.60.214.56:8080 npx expo run:android'
      );
    }
    return url;
  }
  throw new Error('API URL non configurée : définissez EXPO_PUBLIC_API_URL ou extra.apiUrl dans app.config.js');
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
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT + LOG de chaque requête
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API] ➤ ${config.method?.toUpperCase()} ${config.baseURL ?? ''}${config.url ?? ''}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API] ✔ ${response.status} ${response.config?.url ?? ''}`);
    return response;
  },
  async (error: AxiosError) => {
    console.warn(`[API] ✘ ${error.code ?? 'ERR'} ${error.config?.url ?? ''} — ${error.message}`);
    const hadToken = Boolean(await AsyncStorage.getItem(TOKEN_KEY));
    if (error.response?.status === 401 && hadToken && sessionInvalidateHandler) {
      try {
        await sessionInvalidateHandler();
      } catch {
        /* laisser rejeter l’erreur originale */
      }
    }
    return Promise.reject(error);
  }
);

/** Contexte d’erreur : évite d’associer connexion/inscription à un « mode hors-ligne lots ». */
export type GetApiErrorKind = 'default' | 'auth' | 'lots_offline';

// Normaliser les erreurs API
export function getApiError(e: unknown, kind: GetApiErrorKind = 'default'): string {
  const err = e as AxiosError<{ error?: string; message?: string }>;
  if (err.response?.data?.error) return err.response.data.error;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ECONNABORTED') {
    if (kind === 'auth') {
      return `Le serveur met trop de temps à répondre. Vérifiez que le serveur ChainCacao est démarré et accessible (${API_BASE}).`;
    }
    return `Délai de connexion dépassé — serveur : ${API_BASE}`;
  }
  if (err.code === 'ERR_NETWORK' || !err.response) {
    if (API_BASE.includes('127.0.0.1') || API_BASE.includes('localhost')) {
      return `Configuration incorrecte : l'URL de l'API pointe vers localhost (${API_BASE}), ce qui ne fonctionne pas sur un téléphone réel. Vérifiez EXPO_PUBLIC_API_URL.`;
    }
    if (kind === 'auth') {
      return (
        `Connexion au serveur impossible (${API_BASE}).\n\n` +
        `Causes probables :\n` +
        `• Le serveur ChainCacao est arrêté ou en cours de démarrage\n` +
        `• L'URL du serveur a changé (vérifiez EXPO_PUBLIC_API_URL)\n` +
        `• Le port 8080 est bloqué par un pare-feu\n\n` +
        `Votre connexion Wi-Fi/4G fonctionne normalement.`
      );
    }
    if (kind === 'lots_offline') {
      return `Le serveur (${API_BASE}) n'a pas répondu. Le lot sera enregistré localement et envoyé automatiquement dès que le serveur sera disponible.`;
    }
    return `Impossible de joindre le serveur (${API_BASE}).`;
  }
  return err.message || 'Erreur inconnue';
}

export function isNetworkError(e: unknown): boolean {
  const err = e as AxiosError;
  return !err.response || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED';
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export interface LoginPayload { email: string; password: string }
export interface LoginResponse {
  token: string;
  actor?: ActorInfo;
  wallet_balance?: number;
  wallet_credit_warning?: string;
}
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
  gps_location?: string;
  field_surface?: string;
  org_name?: string;
  created_at?: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/api/v1/auth/login', payload),
  signup: (payload: SignupPayload) =>
    api.post<LoginResponse>('/api/v1/auth/signup', payload),
};

export interface MeResponse {
  success?: boolean;
  actor?: ActorInfo;
  has_pin?: boolean;
}

export const meApi = {
  get: () => api.get<MeResponse>('/api/v1/me'),
  verifyPin: (pin: string) =>
    api.post<{ success?: boolean }>('/api/v1/auth/verify-pin', { pin }),
};

// ─── BATCH ────────────────────────────────────────────────────────────────────

export interface CreateBatchPayload {
  culture: string;
  quantite: number;
  lieu: string;
  date_recolte: string;
  notes?: string;
  variete?: string;
  parcelle?: string;
  /** Compat JSON uniquement ; création recommandée : multipart + photo (GPS EXIF). */
  latitude?: number;
  longitude?: number;
  region?: string;
  village?: string;
  client_lot_id?: string;
}

/** Champs texte pour `multipart/form-data` (champ fichier séparé). */
export interface CreateBatchMultipartFields {
  culture: string;
  quantite: number;
  lieu: string;
  date_recolte: string;
  notes?: string;
  variete?: string;
  parcelle?: string;
  region?: string;
  village?: string;
  client_lot_id?: string;
  /**
   * Position GPS du téléphone (remplie automatiquement par l’app, jamais par saisie utilisateur).
   * Secours côté serveur si la photo n’a pas d’EXIF GPS.
   */
  latitude?: number;
  longitude?: number;
}

function appendBatchMultipartFields(form: FormData, fields: CreateBatchMultipartFields) {
  form.append('culture', fields.culture);
  form.append('quantite', String(fields.quantite));
  form.append('lieu', fields.lieu);
  form.append('date_recolte', fields.date_recolte);
  if (fields.notes != null && fields.notes !== '') form.append('notes', fields.notes);
  if (fields.variete != null && fields.variete !== '') form.append('variete', fields.variete);
  if (fields.parcelle != null && fields.parcelle !== '') form.append('parcelle', fields.parcelle);
  if (fields.region != null && fields.region !== '') form.append('region', fields.region);
  if (fields.village != null && fields.village !== '') form.append('village', fields.village);
  if (fields.client_lot_id != null && fields.client_lot_id !== '') form.append('client_lot_id', fields.client_lot_id);
  if (fields.latitude != null && fields.longitude != null && fields.latitude !== 0 && fields.longitude !== 0) {
    form.append('latitude', String(fields.latitude));
    form.append('longitude', String(fields.longitude));
  }
}

export interface BatchResponse {
  id: string;
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
  latitude?: number;
  longitude?: number;
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

export interface GetBatchApiResponse {
  success?: boolean;
  lot?: BatchResponse;
}

export const batchApi = {
  create: (payload: CreateBatchPayload) =>
    api.post<CreateBatchResponse>('/api/v1/batch/create', payload),

  /**
   * Création lot avec photo : le serveur lit latitude/longitude dans les EXIF du fichier.
   * Ne pas fixer `Content-Type` à `application/json` (instance Axios) : boundary multipart.
   */
  createWithPhoto: (imageUri: string, fields: CreateBatchMultipartFields) => {
    const form = new FormData();
    const lower = imageUri.toLowerCase();
    const ext = lower.endsWith('.png') ? 'png' : 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    form.append('file', { uri: imageUri, name: `lot_${Date.now()}.${ext}`, type: mime } as any);
    appendBatchMultipartFields(form, fields);
    return api.post<CreateBatchResponse>('/api/v1/batch/create', form, {
      timeout: 120000,
      transformRequest: (data, headers) => {
        delete (headers as Record<string, unknown>)['Content-Type'];
        return data as string;
      },
    });
  },

  transfer: (payload: TransferPayload) =>
    api.post<TransferApiResponse>('/api/v1/batch/transfer', payload),

  get: (id: string) =>
    api.get<GetBatchApiResponse>(`/api/v1/batch/${encodeURIComponent(id)}`),

  history: (id: string) =>
    api.get<BatchHistoryApiResponse>(`/api/v1/batch/${encodeURIComponent(id)}/history`),

  verify: (id: string) =>
    api.get<VerifyBatchResponse>(`/api/v1/verify/${encodeURIComponent(id)}`),

  /** Upload photo sur un lot déjà créé (sync 2G — étape 2). */
  uploadPhoto: (lotId: string, imageUri: string) => {
    const form = new FormData();
    const lower = imageUri.toLowerCase();
    const ext = lower.endsWith('.png') ? 'png' : 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    form.append('file', { uri: imageUri, name: `lot_${lotId}.${ext}`, type: mime } as any);
    return api.post<{ success?: boolean; secure_url?: string }>(
      `/api/v1/lot/${encodeURIComponent(lotId)}/photo`,
      form,
      {
        timeout: 120000,
        transformRequest: (data, headers) => {
          delete (headers as Record<string, unknown>)['Content-Type'];
          return data as string;
        },
      }
    );
  },
};

// ─── ACTORS ───────────────────────────────────────────────────────────────────

export interface ActorsListResponse {
  success?: boolean;
  actors?: ActorInfo[];
}

export interface MyLotsResponse {
  success?: boolean;
  lots?: BatchResponse[];
}

export const actorsApi = {
  list: () => api.get<ActorsListResponse>('/api/v1/actors'),
};

export const myLotsApi = {
  list: () => api.get<MyLotsResponse>('/api/v1/actors/me/lots'),
};

// ─── SYNC OFFLINE (tableau attendu par le backend) ───────────────────────────

export interface SyncBatchInput {
  client_lot_id?: string;
  culture: string;
  variete?: string;
  quantite: number;
  lieu: string;
  latitude: number;
  longitude: number;
  region?: string;
  village?: string;
  parcelle?: string;
  date_recolte: string;
  photo_url?: string;
  notes?: string;
  payload_hash?: string;
  signature?: string;
  signer_pubkey?: string;
}

export interface SyncResultItem {
  index: number;
  client_lot_id?: string;
  lot_id?: string;
  tx_hash?: string;
  error?: string;
}

export interface SyncOfflineResponse {
  success?: boolean;
  results?: SyncResultItem[];
}

export const syncApi = {
  /** POST /api/v1/sync — corps = tableau de lots à créer côté serveur */
  pushLots: (items: SyncBatchInput[]) =>
    api.post<SyncOfflineResponse>('/api/v1/sync', items),
};

// ─── WALLET ─────────────────────────────────────────────────────────────────

export interface WalletSoldeResponse {
  success?: boolean;
  balance?: number;
  currency?: string;
}

export interface WalletMutationPayload {
  montant: number;
  pin: string;
}

export interface WalletMutationResponse {
  success?: boolean;
  tx_hash?: string;
  message?: string;
}

export const walletApi = {
  solde: () => api.get<WalletSoldeResponse>('/api/v1/portefeuille/solde'),
  depot: (payload: WalletMutationPayload) =>
    api.post<WalletMutationResponse>('/api/v1/portefeuille/depot', payload),
  retrait: (payload: WalletMutationPayload) =>
    api.post<WalletMutationResponse>('/api/v1/portefeuille/retrait', payload),
};

// ─── QR CODE (public) ───────────────────────────────────────────────────────

export interface QrCodeJsonResponse {
  success?: boolean;
  lot_id?: string;
  verify_url?: string;
  qrcode_png_base64?: string;
  hint?: string;
}

export const qrcodeApi = {
  /** JSON avec image base64 (pas ?format=png) */
  getJson: (lotId: string) =>
    api.get<QrCodeJsonResponse>(`/api/v1/qrcode/${encodeURIComponent(lotId)}`),
};

// ─── POSITION LOT (JWT) ─────────────────────────────────────────────────────

export interface LotPositionResponse {
  success?: boolean;
  position?: {
    statut?: string;
    proprietaire_id?: string;
    proprietaire_nom?: string;
    org_id?: string;
  };
}

export const lotApi = {
  position: (lotId: string) =>
    api.get<LotPositionResponse>(`/api/v1/lot/${encodeURIComponent(lotId)}/position`),
};

// ─── CONFIRMER RÉCEPTION / PAIEMENT LOT ─────────────────────────────────────

export interface ConfirmerLotPayload {
  pin: string;
}

export interface ConfirmerLotResponse {
  success?: boolean;
  tx_hash?: string;
  message?: string;
  montant_total?: number;
  montant_brut?: number;
  marge_pct?: number;
  marge_fcfa?: number;
  montant_net?: number;
}

export interface ConfirmerReceptionPayload {
  pin: string;
  poids_constate?: number;
}

export interface ConfirmerReceptionResponse {
  success?: boolean;
  tx_hash?: string;
  message?: string;
  lot?: BatchResponse;
}

export interface PaymentLine {
  lot_id: string;
  poids_kg?: number;
  montant_brut?: number;
  marge_fcfa?: number;
  montant_net?: number;
  seller_id?: string;
}

export interface PaymentPreviewSummary {
  prix_par_kg?: number;
  marge_pct?: number;
  marge_fcfa?: number;
  montant_brut?: number;
  montant_net?: number;
  montant_net_agriculteurs?: number;
  montant_total_debite?: number;
  nb_agriculteurs?: number;
  poids_total_kg?: number;
  lots?: PaymentLine[];
}

export interface CooperativeMarginResponse {
  success?: boolean;
  org_id?: string;
  margin?: number;
  margin_pct?: number;
}

export const marginApi = {
  getForCoop: () => api.get<CooperativeMarginResponse>('/api/v1/cooperative/marge'),
};

export const groupedListApi = {
  create: (list_id: string, batch_ids: string[]) =>
    api.post<{ success?: boolean; list_id?: string; tx_hash?: string }>('/api/v1/liste-groupee', {
      list_id,
      batch_ids,
    }),
  preview: (listId: string, prix_par_kg: number) =>
    api.post<PaymentPreviewSummary & { success?: boolean; list_id?: string }>(
      `/api/v1/liste-groupee/${encodeURIComponent(listId)}/preview`,
      { prix_par_kg }
    ),
  pay: (listId: string, payload: { pin: string; prix_par_kg: number }) =>
    api.post<PaymentPreviewSummary & { success?: boolean; tx_hash?: string; message?: string }>(
      `/api/v1/liste-groupee/${encodeURIComponent(listId)}/payer`,
      payload
    ),
};

export interface LotPaiementStatus {
  batch_id?: string;
  status?: string;
  montant_net?: number;
  marge_fcfa?: number;
  marge_pct?: number;
  tx_hash?: string;
}

export const lotPaymentApi = {
  getPaiement: (lotId: string) =>
    api.get<{ success?: boolean; paiement: LotPaiementStatus }>(
      `/api/v1/lot/${encodeURIComponent(lotId)}/paiement`
    ),
  preview: (lotId: string, prix_par_kg: number) =>
    api.get<PaymentPreviewSummary & { success?: boolean; lot_id?: string }>(
      `/api/v1/lot/${encodeURIComponent(lotId)}/paiement-preview`,
      { params: { prix_par_kg } }
    ),
  setPrix: (lotId: string, prix_par_kg: number) =>
    api.post(`/api/v1/lot/${encodeURIComponent(lotId)}/prix`, { prix_par_kg }),
};

export const portefeuilleApi = {
  solde: () => api.get<{ success?: boolean; balance?: number; currency?: string }>('/api/v1/portefeuille/solde'),
};

export const lotActionApi = {
  confirmer: (lotId: string, payload: ConfirmerLotPayload) =>
    api.post<ConfirmerLotResponse>(
      `/api/v1/lot/${encodeURIComponent(lotId)}/confirmer`,
      payload
    ),
  /** Le destinataire (propriétaire actuel) confirme la réception physique après transfert (`en_transit` → `recu`). */
  confirmerReception: (lotId: string, payload: ConfirmerReceptionPayload) =>
    api.post<ConfirmerReceptionResponse>(
      `/api/v1/lot/${encodeURIComponent(lotId)}/reception`,
      payload
    ),
};

// ─── DEVICE / PUSH ────────────────────────────────────────────────────────────

export interface RegisterDevicePayload {
  token: string;
  platform?: string;
}

export const deviceApi = {
  register: (payload: RegisterDevicePayload) =>
    api.post<{ success?: boolean }>('/api/v1/device/register', payload),
};

// ─── HEALTH ───────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => api.get('/health'),
};
