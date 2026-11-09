import { act, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanupScreens, pressText, renderScreen, resetSimulation, screenText, sim } from './simulation/harness';
import OwnerSignIn from '../app/(auth)/clerk-signin';
import TeamSignIn from '../app/(auth)/team-login';
import SignUp from '../app/(auth)/clerk-signup';
import ForgotPassword from '../app/(auth)/forgot-password';
import VerifyEmail from '../app/(auth)/verify-email';
import Index from '../app/index';

async function fill(tree: ReactTestRenderer, placeholder: string, value: string) {
  const input = tree.root.findAll(node => String(node.type) === 'TextInput' && node.props.placeholder === placeholder)[0];
  await act(async () => input.props.onChangeText(value));
}
async function doublePress(tree: ReactTestRenderer, label: string) {
  await Promise.all([pressText(tree, label), pressText(tree, label)]);
}
beforeEach(() => resetSimulation('guest'));
afterEach(cleanupScreens);
describe.each([
  {role:'owner', Component:OwnerSignIn, email:'Enter your email', button:'Sign In'},
  {role:'member', Component:TeamSignIn, email:'name@example.com', button:'Sign In as Team Member'},
])('$role Firebase sign-in', ({Component,email,button}) => {
  it('validates fields and exposes the error on web', async () => {
    const tree = await renderScreen(Component); await pressText(tree,button);
    expect(sim.signInIdentity).not.toHaveBeenCalled(); expect(screenText(tree)).toContain('Enter your email and password');
  });
  it.each([true,false])('routes verified=%s through the correct guard', async verified => {
    sim.signInIdentity.mockResolvedValue({emailVerified:verified});
    const tree=await renderScreen(Component); await fill(tree,email,'  user@example.test  '); await fill(tree,'Enter your password','password123');
    await pressText(tree,button);
    expect(sim.signInIdentity).toHaveBeenCalledWith('user@example.test','password123');
    expect(sim.router.replace).toHaveBeenCalledWith(verified ? '/' : '/(auth)/verify-email');
  });
  it('prevents duplicate sign-ins and permits retry after failure', async () => {
    sim.signInIdentity.mockRejectedValueOnce(new Error('Network unavailable'));
    const tree=await renderScreen(Component); await fill(tree,email,'user@example.test'); await fill(tree,'Enter your password','password123');
    await doublePress(tree,button); expect(sim.signInIdentity).toHaveBeenCalledTimes(1);
    expect(screenText(tree)).toContain('Network unavailable'); expect(sim.router.replace).not.toHaveBeenCalled();
    await pressText(tree,button); expect(sim.router.replace).toHaveBeenCalledWith('/');
  });
  it('waits for persisted identity initialization', async () => {
    sim.identityLoaded=false; const tree=await renderScreen(Component);
    await fill(tree,email,'user@example.test'); await fill(tree,'Enter your password','password123'); await pressText(tree,button);
    expect(sim.signInIdentity).not.toHaveBeenCalled();
  });
});
it.each([
  ['', 'new@example.test','password123','full name'],
  ['New Owner','bad-email','password123','valid email'],
  ['New Owner','new@example.test','short','8 to 128'],
  ['New Owner','new@example.test','x'.repeat(129),'8 to 128'],
])('validates signup fields before creating an identity', async (name,email,password,message) => {
  const tree=await renderScreen(SignUp); await fill(tree,'Enter your full name',name); await fill(tree,'Enter your email',email); await fill(tree,'At least 8 characters',password);
  await pressText(tree,'Create Account'); expect(sim.signUpIdentity).not.toHaveBeenCalled(); expect(screenText(tree)).toContain(message);
});
it('creates one normalized account and moves to verification with the password cleared', async () => {
  const tree=await renderScreen(SignUp); await fill(tree,'Enter your full name','  New   Owner  '); await fill(tree,'Enter your email','  new@example.test  '); await fill(tree,'At least 8 characters','password123');
  await doublePress(tree,'Create Account'); expect(sim.signUpIdentity).toHaveBeenCalledExactlyOnceWith('new@example.test','password123','New Owner');
  expect(sim.router.replace).toHaveBeenCalledWith('/(auth)/verify-email');
  expect(tree.root.findAll(node=>String(node.type)==='TextInput'&&node.props.placeholder==='At least 8 characters')[0].props.value).toBe('');
});
it('preserves signup inputs and exposes delivery/service failures for retry', async () => {
  sim.signUpIdentity.mockRejectedValueOnce(new Error('Account unavailable'));
  const tree=await renderScreen(SignUp); await fill(tree,'Enter your full name','New'); await fill(tree,'Enter your email','new@example.test'); await fill(tree,'At least 8 characters','password123');
  await pressText(tree,'Create Account'); expect(screenText(tree)).toContain('Account unavailable'); expect(sim.router.replace).not.toHaveBeenCalled();
  await pressText(tree,'Create Account'); expect(sim.router.replace).toHaveBeenCalledWith('/(auth)/verify-email');
});
it('validates reset email and uses a privacy-preserving success message', async () => {
  const tree=await renderScreen(ForgotPassword); await pressText(tree,'Send Reset Link'); expect(sim.resetPassword).not.toHaveBeenCalled();
  await fill(tree,'Enter your email','  absent@example.test  '); await doublePress(tree,'Send Reset Link');
  expect(sim.resetPassword).toHaveBeenCalledExactlyOnceWith('absent@example.test'); expect(screenText(tree)).toContain('If an account exists');
  expect(sim.router.replace).not.toHaveBeenCalled(); await pressText(tree,'Resend Reset Link'); expect(sim.resetPassword).toHaveBeenCalledTimes(2);
});
it('keeps reset failures visible and retries without claiming success', async () => {
  sim.resetPassword.mockRejectedValueOnce(new Error('Delivery unavailable')); const tree=await renderScreen(ForgotPassword);
  await fill(tree,'Enter your email','user@example.test'); await pressText(tree,'Send Reset Link');
  expect(screenText(tree)).toContain('Delivery unavailable'); expect(screenText(tree)).not.toContain('If an account exists');
  await pressText(tree,'Send Reset Link'); expect(screenText(tree)).toContain('If an account exists');
});
describe('email verification', () => {
  beforeEach(()=>{sim.unverified=true;});
  it('sends only on explicit request and prevents duplicate sends', async () => {
    const tree=await renderScreen(VerifyEmail); expect(sim.sendVerification).not.toHaveBeenCalled();
    await doublePress(tree,'Send Verification Email'); expect(sim.sendVerification).toHaveBeenCalledTimes(1); expect(screenText(tree)).toContain('Verification email sent');
  });
  it('handles resend failure and successful retry', async () => {
    sim.sendVerification.mockRejectedValueOnce(new Error('Too many attempts')); const tree=await renderScreen(VerifyEmail);
    await pressText(tree,'Send Verification Email'); expect(screenText(tree)).toContain('Too many attempts');
    await pressText(tree,'Send Verification Email'); expect(screenText(tree)).toContain('Verification email sent');
  });
  it.each([true,false])('reloads trusted verification state: %s', async verified => {
    sim.refreshIdentity.mockResolvedValue(verified); const tree=await renderScreen(VerifyEmail); await pressText(tree,'I Have Verified My Email');
    if(verified) expect(sim.router.replace).toHaveBeenCalledWith('/');
    else {expect(sim.router.replace).not.toHaveBeenCalled(); expect(screenText(tree)).toContain('not verified yet');}
  });
  it('routes unverified sessions away from workspace data', async () => {await renderScreen(Index); expect(sim.router.replace).toHaveBeenCalledWith('/(auth)/verify-email');});
  it('keeps failed sign-out on screen and permits retry', async () => {
    sim.signOut.mockRejectedValueOnce(new Error('Offline')); const tree=await renderScreen(VerifyEmail); await pressText(tree,'Sign Out');
    expect(screenText(tree)).toContain('Offline'); expect(sim.router.replace).not.toHaveBeenCalled();
    await pressText(tree,'Sign Out'); expect(sim.router.replace).toHaveBeenCalledWith('/(auth)/clerk-signin');
  });
});
