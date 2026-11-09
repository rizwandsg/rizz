import 'firebase/auth';
import type { Persistence } from 'firebase/auth';
// Firebase exposes this at the React Native runtime entry point, while tsc's
// platform-independent pass resolves the browser declarations.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
