import { useIdentity } from './IdentityContext';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { clearSessionUser, getSessionUser, refreshCurrentUser, subscribeToSession, User } from '../api/authApi';
import { setAccessTokenProvider } from '../services/supabaseClient';

const AuthContext = createContext<{ user: User | null; loading: boolean; error: string | null; retry: () => void }>({ user: null, loading: true, error: null, retry: () => {} });
export const useAccount = () => useContext(AuthContext);
export function AuthProvider({ children }: { children?: React.ReactNode }) {
  const { isLoaded, isSignedIn, accessVerified, getToken, sessionId, error: identityFailure } = useIdentity();
  const user = useSyncExternalStore(subscribeToSession, getSessionUser, getSessionUser);
  const sessionKey = isSignedIn ? `${sessionId ?? 'pending-session'}:${accessVerified}` : 'signed-out';
  const [status, setStatus] = useState<{ loading: boolean; error: string | null; sessionKey: string | null }>({ loading: true, error: null, sessionKey: null });
  const [attempt, setAttempt] = useState(0);
  const sequence = useRef(0);
  const refreshing = useRef(false);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    let cancelled = false;
    const request = ++sequence.current;
    refreshing.current = false;
    // Revoke the previous external session's visible state before async synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus({ loading: true, error: null, sessionKey: null });
    setAccessTokenProvider(isLoaded && isSignedIn && accessVerified ? () => getToken() : null);
    async function sync() {
      try {
        await clearSessionUser();
        if (cancelled || request !== sequence.current || !isLoaded) return;
        if (isSignedIn && accessVerified) {
          await refreshCurrentUser();
          if (cancelled || request !== sequence.current) return;
          // Sync installs the server-assigned authenticated claim for first sign-in.
          await getToken(true);
        }
        if (!cancelled && request === sequence.current) setStatus({ loading: false, error: null, sessionKey });
      } catch (failure) {
        if (!cancelled && request === sequence.current) {
          setStatus({ loading: false, error: failure instanceof Error ? failure.message : 'Account unavailable', sessionKey });
          await clearSessionUser().catch(() => {});
        }
      }
    }
    void sync();
    return () => { cancelled = true; sequence.current++; setAccessTokenProvider(null); };
  }, [isLoaded, isSignedIn, accessVerified, sessionKey, getToken, attempt]);
  // Returning from an email app preserves the verification flow. A valid
  // signed-in session keeps unsaved forms mounted during revalidation.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active' || !isLoaded || !isSignedIn || status.loading || status.error || status.sessionKey !== sessionKey || !user || refreshing.current) return;
      const request = ++sequence.current;
      refreshing.current = true;
      void (async () => {
        try {
          await refreshCurrentUser();
        } catch (failure) {
          if (request === sequence.current) {
            setStatus({ loading: false, error: failure instanceof Error ? failure.message : 'Account unavailable', sessionKey });
            await clearSessionUser().catch(() => {});
          }
        } finally {
          if (request === sequence.current) refreshing.current = false;
        }
      })();
    });
    return () => subscription.remove();
  }, [isLoaded, isSignedIn, sessionKey, status, user]);
  const loading = !isLoaded || status.loading || status.sessionKey !== sessionKey;
  const error = identityFailure || status.error;
  const account = isLoaded && isSignedIn && accessVerified && !loading && !error ? user : null;
  return <AuthContext.Provider value={{ user: account, loading, error, retry }}>{children}</AuthContext.Provider>;
}
