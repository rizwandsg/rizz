import Constants from 'expo-constants';

interface Config {
  googleDriveClientId: string;
  apiUrl: string;
  appEnv: string;
  appName: string;
}

const config: Config = {
  googleDriveClientId: Constants.expoConfig?.extra?.googleDriveClientId ?? '',
  apiUrl: Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000',
  appEnv: Constants.expoConfig?.extra?.appEnv ?? 'development',
  appName: Constants.expoConfig?.extra?.appName ?? 'RizzApp',
};

export default config;