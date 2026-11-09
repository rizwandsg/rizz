import {
  createUserWithEmailAndPassword, EmailAuthProvider, onIdTokenChanged, reauthenticateWithCredential,
  reload, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut,
  updatePassword, updateProfile,
} from 'firebase/auth';
import { firebaseAuth } from './firebaseClient';

export interface IdentityState {
  isLoaded: boolean; isSignedIn: boolean; emailVerified: boolean;
  sessionId: string | null; email: string | null; error: string | null;
}
let state: IdentityState = { isLoaded: false, isSignedIn: false, emailVerified: false, sessionId: null, email: null, error: null };
const listeners = new Set<() => void>();
let unsubscribe: (() => void) | null = null;
function publish() { listeners.forEach(listener => listener()); }
function observe() {
  if (unsubscribe) return;
  unsubscribe = onIdTokenChanged(firebaseAuth, user => {
    state = {
      isLoaded: true, isSignedIn: !!user, emailVerified: user?.emailVerified ?? false,
      sessionId: user ? `${user.uid}:${user.metadata.lastSignInTime || ''}` : null,
      email: user?.email ?? null, error: null,
    };
    publish();
  }, () => {
    state = { isLoaded: true, isSignedIn: false, emailVerified: false, sessionId: null, email: null, error: 'Unable to restore sign-in. Please try again.' };
    publish();
  });
}
export function subscribeIdentity(listener: () => void) { listeners.add(listener); observe(); return () => { listeners.delete(listener); }; }
export const getIdentityState = () => state;
export async function getIdentityToken(forceRefresh = false): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  const token = await user.getIdToken(forceRefresh);
  if (firebaseAuth.currentUser !== user) throw new Error('Sign-in changed. Please try again.');
  return token;
}
export function identityError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'This email already has an account. Sign in or use Forgot password.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/password-does-not-meet-requirements': 'This password does not meet the account security requirements.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/network-request-failed': 'Unable to connect. Check your connection and try again.',
    'auth/user-disabled': 'This account is disabled. Contact your workspace owner.',
    'auth/requires-recent-login': 'Please sign in again before changing your password.',
  };
  return messages[code || ''] || (code ? 'Unable to complete authentication. Please try again.' : error instanceof Error ? error.message : 'Please try again.');
}
export async function signInIdentity(email: string, password: string) {
  const result = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  return { emailVerified: result.user.emailVerified };
}
export async function signUpIdentity(email: string, password: string, fullName: string) {
  const result = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  // A profile-name failure must not strand a successfully created account on signup.
  // The verified account can edit its display name after signing in.
  await updateProfile(result.user, { displayName: fullName.trim() }).catch(() => {});
  // The verification screen handles delivery errors and explicit resend safely.
}
export async function sendVerificationEmail() {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Please sign in before verifying your email.');
  await sendEmailVerification(user);
}
export async function refreshIdentity() {
  const user = firebaseAuth.currentUser;
  if (!user) return false;
  await reload(user);
  if (firebaseAuth.currentUser?.uid !== user.uid) throw new Error('Sign-in changed. Please try again.');
  await user.getIdToken(true);
  return user.emailVerified;
}
export async function resetIdentityPassword(email: string) {
  try { await sendPasswordResetEmail(firebaseAuth, email.trim()); }
  catch (error) {
    // Do not reveal whether an address is registered, even on older projects.
    if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
  }
}
export async function changeIdentityPassword(currentPassword: string, newPassword: string) {
  const user = firebaseAuth.currentUser;
  if (!user?.email || !user.emailVerified) throw new Error('Sign in with a verified email before changing your password.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  if (firebaseAuth.currentUser?.uid !== user.uid) throw new Error('Sign-in changed. Please try again.');
  await updatePassword(user, newPassword);
}
export async function signOutIdentity() { await signOut(firebaseAuth); }
