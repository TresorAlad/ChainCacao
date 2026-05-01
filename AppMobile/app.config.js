/* eslint-env node */
/**
 * Configuration Expo : URL API via EXPO_PUBLIC_API_URL (HTTPS recommandé en prod).
 * Cleartext Android uniquement si l’URL commence par http://
 */
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://13.60.214.56:8080';
const usesCleartextTraffic = apiUrl.startsWith('http://');

module.exports = {
  expo: {
    name: 'ChainCacao',
    slug: 'ChainCacao',
    version: '1.0.0',
    orientation: 'portrait',
    /** Icône store : médaillon + fond marque (voir scripts/generate-app-icons.py) */
    icon: './assets/images/app-icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/accueil.jpg',
      resizeMode: 'cover',
      backgroundColor: '#000000',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.votrenom.chaincacao',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Cette application nécessite l'accès à votre position pour certifier l'emplacement de votre champ ou de votre siège social.",
        NSFaceIDUsageDescription:
          "Cette application utilise FaceID pour sécuriser votre accès.",
      },
    },
    android: {
      package: 'com.votrenom.chaincacao',
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
      ],
    },
    web: {
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
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
    ],
    extra: {
      eas: {
        projectId: 'votre-project-id',
      },
      apiUrl,
    },
  },
};
