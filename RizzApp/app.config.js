module.exports = {
  expo: {
    name: 'RizzApp',
    slug: 'RizzApp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
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
      googleServicesFile: './google-services.json'
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      "@react-native-google-signin/google-signin",
      ["expo-build-properties", {
        android: {
          compileSdkVersion: 33,
          targetSdkVersion: 33,
          buildToolsVersion: "33.0.0",
          kotlinVersion: "1.8.0"
        },
        ios: {
          useFrameworks: 'static'
        }
      }]
    ]
  }
};