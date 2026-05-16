/* eslint-env node */
/**
 * URL de l'API : EXPO_PUBLIC_API_URL (.env) ou valeur par défaut ci-dessous.
 * Doit être la racine http(s)://hôte:port sans suffixe /api/v1 (normalisé automatiquement).
 * Cleartext Android forcé via withAndroidManifest pour les URL http://.
 */
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

/** Racine API uniquement (sans /api/v1) : les chemins dans services/api.ts ajoutent déjà /api/v1/... */
function normalizeApiBaseUrl(url) {
  let u = String(url || '').trim().replace(/\/+$/, '');
  u = u.replace(/\/api\/v1\/?$/i, '');
  return u || 'http://127.0.0.1:8080';
}

function httpApiHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

// Production par défaut (téléphone réel). En dev local : .env avec EXPO_PUBLIC_API_URL=http://10.0.2.2:8080
const PRODUCTION_API_URL = 'http://13.60.214.56:8080';
const apiUrl = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL);
const usesCleartextTraffic = apiUrl.startsWith('http://');
const cleartextHostname = httpApiHostname(apiUrl);

/**
 * HTTP vers IP / LAN : OkHttp bloque parfois le cleartext même avec usesCleartextTraffic selon ROM / WebView.
 * On ajoute res/xml/network_security_config.xml + référence manifest + usesCleartextTraffic.
 */
const withAndroidHttpCleartextPlugin = (config) => {
  if (!usesCleartextTraffic) return config;

  const domains = new Set(
    [
      cleartextHostname,
      '10.0.2.2',
      'localhost',
      '127.0.0.1',
    ].filter(Boolean)
  );

  const domainLines = [...domains]
    .map((h) => `    <domain includeSubdomains="true">${h}</domain>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
${domainLines}
  </domain-config>
</network-security-config>
`;

  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const root = cfg.modRequest.platformProjectRoot;
      const dest = path.join(root, 'app/src/main/res/xml/network_security_config.xml');
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, xml, 'utf8');
      return cfg;
    },
  ]);

  return withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:usesCleartextTraffic'] = 'true';
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
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
        ...(usesCleartextTraffic
          ? {
              NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: true,
              },
            }
          : {}),
      },
    },
    android: {
      package: 'com.chaincacao.chaincacao',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
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
      withAndroidHttpCleartextPlugin,
      'expo-secure-store',
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
