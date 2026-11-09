import { useSyncExternalStore } from 'react';
import { getIdentityState, getIdentityToken, signOutIdentity, subscribeIdentity } from '../services/firebaseIdentity';

export function useIdentity() {
  const state = useSyncExternalStore(subscribeIdentity, getIdentityState, getIdentityState);
  return { ...state, getToken: getIdentityToken, signOut: signOutIdentity };
}
