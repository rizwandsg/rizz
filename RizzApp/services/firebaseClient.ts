import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from './firebaseApp';
import { clearWebDialogs, installWebDialogs } from './webDialogs';

// Web persistence is managed by the Firebase browser SDK.
export const firebaseAuth = getAuth(firebaseApp);
installWebDialogs();
let dialogSession: string | null | undefined;
onAuthStateChanged(firebaseAuth, user => {
  const next = user?.uid ?? null;
  if (next !== dialogSession) { clearWebDialogs(); dialogSession = next; }
});
