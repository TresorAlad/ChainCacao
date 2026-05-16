import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { homePathForActor } from '@/lib/home-path';
import { deviceApi } from '@/services/api';
import type { ActorInfo } from '@/services/api';

/** Expo Go (SDK 53+) : pas de push Android distante — éviter le chargement du module au parse. */
const isExpoGo = Constants.executionEnvironment === 'storeClient';

type NotificationsModule = typeof import('expo-notifications');

function getNotifications(): NotificationsModule | null {
  if (isExpoGo) return null;
  // require différé : évite l'erreur Expo Go au chargement du bundle pour expo-notifications.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as NotificationsModule;
}

function notificationGranted(perm: { granted?: boolean; status?: string }): boolean {
  return perm.granted === true || perm.status === 'granted';
}

(() => {
  const Notifications = getNotifications();
  if (!Notifications) return;
  /** Affichage en tête d'écran (style WhatsApp) lorsque l'app est au premier plan. */
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
})();

const ANDROID_CHANNEL_ID = 'chaincacao_default';

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'ChainCacao',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1B5E20',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

/** Demande les permissions et enregistre le jeton FCM côté backend. */
export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications || !Device.isDevice) {
    return null;
  }

  await ensureAndroidChannel(Notifications);

  const existing = await Notifications.getPermissionsAsync();
  let granted = notificationGranted(existing);
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = notificationGranted(requested);
  }
  if (!granted) {
    return null;
  }

  const devicePush = await Notifications.getDevicePushTokenAsync();
  const token = devicePush.data;
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    await deviceApi.register({
      token,
      platform: Platform.OS === 'android' ? 'android' : Platform.OS,
    });
  } catch (e) {
    console.warn('Enregistrement token FCM:', e);
  }

  return token;
}

function navigateFromNotificationData(data: Record<string, unknown> | undefined, user: ActorInfo | null) {
  if (!data) return;
  const screen = String(data.screen ?? '');
  const lotId = String(data.lot_id ?? '');

  if (screen === 'portefeuille') {
    const role = String(user?.role ?? '').toLowerCase();
    if (role.includes('agricult')) {
      router.push('/(agriculteur)/portefeuille');
      return;
    }
    if (role.includes('coop')) {
      router.push('/(cooperative)/paiement');
      return;
    }
    router.push('/(exportateur)/paiement');
    return;
  }

  if (screen === 'lots' && lotId) {
    router.push({
      pathname: '/confirmer-reception-lot',
      params: { lotId },
    });
    return;
  }

  if (user) {
    router.push(homePathForActor(user) as never);
  }
}

/** Écoute les notifications (foreground + tap). Retourne une fonction de nettoyage. */
export function setupNotificationListeners(user: ActorInfo | null): () => void {
  const Notifications = getNotifications();
  if (!Notifications) {
    return () => {};
  }

  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    // Le handler ci-dessus affiche déjà la bannière système en foreground.
    console.log('Notification reçue:', notification.request.content.title);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    navigateFromNotificationData(data, user);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

/** Dernière notification tapée au démarrage (app fermée). */
export async function handleInitialNotification(user: ActorInfo | null): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  const last = await Notifications.getLastNotificationResponseAsync();
  if (!last) return;
  const data = last.notification.request.content.data as Record<string, unknown> | undefined;
  navigateFromNotificationData(data, user);
}
