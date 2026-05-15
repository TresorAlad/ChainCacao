/* eslint-env node */
/**
 * URL de l'API : définie uniquement ici (pas de .env / EXPO_PUBLIC_*).
 * Cleartext Android forcé via withAndroidManifest pour les URL http://.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.chaincacao.tg';
const usesCleartextTraffic = apiUrl.startsWith('http://');

/**
 * Plugin config : garantit android:usesCleartextTraffic="true" dans le manifest
 * lorsque l'API est en HTTP — expo prebuild seul ne l'injecte pas toujours.
 */
const withCleartextPlugin = (config) => {
  if (!usesCleartextTraffic) return config;
  return withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:usesCleartextTraffic'] = 'true';
    }
    return c;
  });
};

module.exports = {
  expo: {
    name: 'ChainCacao',
    slug: 'ChainCacao',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/app-icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/f6a18683-7b87-4986-8742-0bf31e0078a3',
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
    },
    splash: {
      image: './assets/images/accueil.jpg',
      resizeMode: 'cover',
      backgroundColor: '#000000',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.chaincacao.chaincacao',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Cette application nécessite l'accès à votre position pour certifier l'emplacement de votre champ ou de votre siège social.",
        NSFaceIDUsageDescription:
          "Cette application utilise FaceID pour sécuriser votre accès.",
      },
    },
    android: {
      package: 'com.chaincacao.chaincacao',
      googleServicesFile: './google-services.json',
      usesCleartextTraffic,
      adaptiveIcon: {
        foregroundImage: './assets/images/app-icon-adaptive-fg.png',
        backgroundImage: './assets/images/app-icon-adaptive-bg.png',
        backgroundColor: '#1B5E20',
      },
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'USE_BIOMETRIC',
        'USE_FINGERPRINT',
        'INTERNET',
        'POST_NOTIFICATIONS',
      ],
    },
    web: {
      favicon: './assets/images/app-icon.png',
    },
    plugins: [
      withCleartextPlugin,
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/images/app-icon.png',
          color: '#1B5E20',
          defaultChannel: 'chaincacao_default',
        },
      ],
      'expo-updates',
      [
        'expo-camera',
        {
          cameraPermission: 'Autoriser ChainCacao à utiliser la caméra pour scanner les codes QR des lots.',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Autoriser ChainCacao à utiliser votre position.',
        },
      ],
      [
        'expo-local-authentication',
        {
          faceIDPermission: 'Autoriser ChainCacao à utiliser FaceID.',
        },
      ],
      '@react-native-community/datetimepicker',
      'expo-font',
      'expo-image',
      'expo-web-browser',
    ],
    extra: {
      eas: {
        projectId: 'f6a18683-7b87-4986-8742-0bf31e0078a3',
      },
      apiUrl,
    },
  },
};
