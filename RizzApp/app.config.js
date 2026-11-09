const { configEnvironment } = require('./config/runtime-config.cjs');
const runtime = configEnvironment(process.env);
const suffix = runtime.appEnv === 'production' ? '' : `.${runtime.appEnv}`;
module.exports = {
  expo: {
    owner: 'rizwan-portfolio-07',
    name: runtime.appEnv === 'production' ? 'Rizz' : `Rizz (${runtime.appEnv})`,
    slug: 'RizzApp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: `com.rizz.app${suffix}`,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: `com.rizz.app${suffix}`,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: `com.rizz.app${suffix}`,
      permissions: [
        "INTERNET",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "POST_NOTIFICATIONS"
      ]
    },
    web: {
      output: 'single',
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: '70871b7d-8e41-4657-901c-9c10f01e259e'
      },
      router: {
        origin: false,
        scheme: `com.rizz.app${suffix}`
      },
      supabaseUrl: runtime.supabaseUrl,
      supabaseKey: runtime.supabaseKey,
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      appEnv: runtime.appEnv,
      appName: process.env.EXPO_PUBLIC_APP_NAME
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#667eea"
        }
      ],
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "16.4"
          },
          "android": {
            "minSdkVersion": 24
          }
        }
      ]
    ]
  }
};
