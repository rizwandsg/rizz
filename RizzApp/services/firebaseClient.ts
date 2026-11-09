import { getAuth } from 'firebase/auth';
import { firebaseApp } from './firebaseApp';

// Web persistence is managed by the Firebase browser SDK.
export const firebaseAuth = getAuth(firebaseApp);
