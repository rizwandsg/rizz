import { getApps, initializeApp } from 'firebase/app';

// Only these public client settings are embedded. Admin credentials stay server-side.
export const firebaseApp = getApps().find(app => app.name === '[DEFAULT]') || initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});
