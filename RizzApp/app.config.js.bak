module.exports = {
  expo: {
    name: 'RizzApp',
    slug: 'RizzApp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'com.rizz.app',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.rizz.app',
      googleServicesFile: './GoogleService-Info.plist'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.rizz.app',
      googleServicesFile: './google-services.json',
      permissions: [
        "INTERNET",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "USE_FULL_SCREEN_INTENT",
        "POST_NOTIFICATIONS"
      ]
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'c50bdb29-edbf-4aa1-9ff2-505cb7567378'
      },
      router: {
        origin: false,
        scheme: 'com.rizz.app'
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      appEnv: process.env.EXPO_PUBLIC_APP_ENV,
      appName: process.env.EXPO_PUBLIC_APP_NAME
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    plugins: [
      "@react-native-google-signin/google-signin",
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#667eea",
          "sounds": ["./assets/notification.wav"]
        }
      ],
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "13.0"
          },
          "android": {
            "kotlinVersion": "2.0.21",
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "buildToolsVersion": "34.0.0",
            "minSdkVersion": 23
          }
        }
      ]
    ]
  }
};