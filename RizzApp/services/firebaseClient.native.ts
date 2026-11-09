import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';
import { firebaseApp } from './firebaseApp';
import { createSecureAuthStorage } from './secureAuthStorage';

const storage = createSecureAuthStorage(SecureStore, key => digestStringAsync(CryptoDigestAlgorithm.SHA256, key), randomUUID);
function nativeAuth() {
  try { return initializeAuth(firebaseApp, { persistence: getReactNativePersistence(storage) }); }
  catch (error) {
    if ((error as { code?: string }).code === 'auth/already-initialized') return getAuth(firebaseApp);
    throw error;
  }
}
export const firebaseAuth = nativeAuth();
