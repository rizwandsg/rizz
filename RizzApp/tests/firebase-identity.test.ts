import { beforeEach, expect, it, vi } from 'vitest';
const sdk=vi.hoisted(()=>({
  auth:{currentUser:null as any}, observer:null as any,
  createUserWithEmailAndPassword:vi.fn(), onIdTokenChanged:vi.fn(), reauthenticateWithCredential:vi.fn(),
  reload:vi.fn(),sendEmailVerification:vi.fn(),sendPasswordResetEmail:vi.fn(),signInWithEmailAndPassword:vi.fn(),
  signOut:vi.fn(),updatePassword:vi.fn(),updateProfile:vi.fn(), credential:vi.fn(),
}));
vi.mock('../services/firebaseClient',()=>({firebaseAuth:sdk.auth}));
vi.mock('firebase/auth',()=>({...sdk,EmailAuthProvider:{credential:sdk.credential}}));
import { changeIdentityPassword,getIdentityState,getIdentityToken,identityError,refreshIdentity,resetIdentityPassword,sendVerificationEmail,signInIdentity,signOutIdentity,signUpIdentity,subscribeIdentity } from '../services/firebaseIdentity';
function user(uid='firebase-a'){return {uid,email:'a@example.test',emailVerified:true,metadata:{lastSignInTime:'today'},getIdToken:vi.fn().mockResolvedValue('verified-token')};}
beforeEach(()=>{
  vi.clearAllMocks(); sdk.auth.currentUser=user();
  sdk.createUserWithEmailAndPassword.mockResolvedValue({user:sdk.auth.currentUser});
  sdk.signInWithEmailAndPassword.mockResolvedValue({user:sdk.auth.currentUser});
  sdk.updateProfile.mockReset().mockResolvedValue(undefined);sdk.sendPasswordResetEmail.mockReset().mockResolvedValue(undefined);
  sdk.reauthenticateWithCredential.mockReset().mockResolvedValue(undefined);
  sdk.onIdTokenChanged.mockImplementation((_auth,observer)=>{sdk.observer=observer;return ()=>{};});
});
it('uses Firebase credentials and trims email without modifying passwords',async()=>{
  expect(await signInIdentity(' a@example.test ',' password ')).toEqual({emailVerified:true});
  expect(sdk.signInWithEmailAndPassword).toHaveBeenCalledWith(sdk.auth,'a@example.test',' password ');
});
it('does not strand a newly created account if its display-name update fails',async()=>{
  sdk.updateProfile.mockRejectedValue(new Error('Offline'));await expect(signUpIdentity(' a@example.test ','password',' A ')).resolves.toBeUndefined();
  expect(sdk.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);expect(sdk.sendEmailVerification).not.toHaveBeenCalled();
});
it('rejects an ID token that finishes after a session switch',async()=>{
  sdk.auth.currentUser.getIdToken.mockImplementation(async()=>{sdk.auth.currentUser=user('firebase-b');return 'old-token';});
  await expect(getIdentityToken()).rejects.toThrow('Sign-in changed');
});
it('requires a signed-in account for verification',async()=>{sdk.auth.currentUser=null;await expect(sendVerificationEmail()).rejects.toThrow('sign in');});
it('reloads email verification and refreshes token claims',async()=>{
  await expect(refreshIdentity()).resolves.toBe(true);expect(sdk.reload).toHaveBeenCalledWith(sdk.auth.currentUser);expect(sdk.auth.currentUser.getIdToken).toHaveBeenCalledWith(true);
});
it('conceals whether a reset address exists',async()=>{
  sdk.sendPasswordResetEmail.mockRejectedValue({code:'auth/user-not-found'});await expect(resetIdentityPassword(' absent@example.test ')).resolves.toBeUndefined();
  sdk.sendPasswordResetEmail.mockRejectedValue({code:'auth/network-request-failed'});await expect(resetIdentityPassword('a@example.test')).rejects.toMatchObject({code:'auth/network-request-failed'});
});
it('reauthenticates before changing the password and blocks changes after a session switch',async()=>{
  sdk.credential.mockReturnValue('credential');await changeIdentityPassword('current','newpassword');
  expect(sdk.reauthenticateWithCredential).toHaveBeenCalledWith(sdk.auth.currentUser,'credential');
  expect(sdk.updatePassword).toHaveBeenCalledWith(sdk.auth.currentUser,'newpassword');
  sdk.updatePassword.mockClear();sdk.reauthenticateWithCredential.mockImplementation(async()=>{sdk.auth.currentUser=user('firebase-b');});
  await expect(changeIdentityPassword('current','newpassword')).rejects.toThrow('Sign-in changed');expect(sdk.updatePassword).not.toHaveBeenCalled();
});
it('refuses unverified password changes and signs out through Firebase',async()=>{
  sdk.auth.currentUser.emailVerified=false;await expect(changeIdentityPassword('current','newpassword')).rejects.toThrow('verified email');
  await signOutIdentity();expect(sdk.signOut).toHaveBeenCalledWith(sdk.auth);
});
it('publishes stable session identity across token refreshes and clears it on sign-out',()=>{
  const listener=vi.fn();const unsubscribe=subscribeIdentity(listener);sdk.observer(sdk.auth.currentUser);const session=getIdentityState().sessionId;
  sdk.observer(sdk.auth.currentUser);expect(getIdentityState().sessionId).toBe(session);expect(getIdentityState().emailVerified).toBe(true);
  sdk.observer(null);expect(getIdentityState().isSignedIn).toBe(false);expect(getIdentityState().sessionId).toBeNull();unsubscribe();
});
it('does not expose provider internals in Firebase error messages',()=>{
  expect(identityError({code:'auth/internal-error',message:'SECRET details'})).not.toContain('SECRET');
  expect(identityError({code:'auth/invalid-credential'})).toBe('Email or password is incorrect.');
});
