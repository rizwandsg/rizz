import { act, type ReactTestRenderer, type ReactTestInstance } from 'react-test-renderer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupScreens, owner, pressText, renderScreen, resetSimulation, screenText, sim } from './simulation/harness';
import OwnerSignIn from '../app/(auth)/clerk-signin';
import TeamSignIn from '../app/(auth)/team-login';
import SignUp from '../app/(auth)/clerk-signup';
import ForgotPassword from '../app/(auth)/forgot-password';
import ResetPassword from '../app/(auth)/reset-password';
import LoginRedirect from '../app/(auth)/login';
import SignUpRedirect from '../app/(auth)/signup';
import AuthLayout from '../app/(auth)/_layout';
import Index from '../app/index';
import { SignOutButton } from '../components/SignOutButton';
import { nativeHeaderTitles, protectedScreens } from '../services/routePolicy';

async function fill(tree: ReactTestRenderer, placeholder: string, value: string) {
  const input = tree.root.findAll(node => String(node.type) === 'TextInput' && node.props.placeholder === placeholder)[0];
  if (!input) throw new Error('Input not found: ' + placeholder);
  await act(async () => input.props.onChangeText(value));
}
function button(tree: ReactTestRenderer, label: string) {
  for (const text of tree.root.findAll(node => String(node.type) === 'Text' && node.children.join('') === label)) {
    let node: ReactTestInstance | null = text;
    while (node && typeof node.props.onPress !== 'function') node = node.parent;
    if (node) return node;
  }
  throw new Error('Button not found: ' + label);
}
async function press(tree: ReactTestRenderer, label: string) {
  await act(async () => { await button(tree, label).props.onPress(); });
}
async function doublePress(tree: ReactTestRenderer, label: string) {
  const handler = button(tree, label).props.onPress;
  await act(async () => { await Promise.all([handler(), handler()]); });
}
async function fillSignUp(tree: ReactTestRenderer) {
  await fill(tree, 'Enter your full name', '  New   Owner  ');
  await fill(tree, 'Enter your email', '  new@example.test  ');
  await fill(tree, 'At least 8 characters', 'Strong-password-123');
}
async function enterRecoveryCode(tree: ReactTestRenderer) {
  await fill(tree, 'Enter your email', '  member@example.test  ');
  await press(tree, 'Send Verification Code');
  const sent = sim.alert.mock.calls.find(call => call[0] === 'Code Sent!');
  if (sent?.[2]?.[0]?.onPress) await act(async () => sent[2][0].onPress());
  await fill(tree, 'Enter 6-digit code', '123456');
  await fill(tree, 'Enter new password (min. 8 characters)', 'Changed-password-123');
}
beforeEach(() => {
  resetSimulation('guest');
  sim.signUp.create.mockReset().mockResolvedValue({status: 'missing_requirements'});
  sim.signUp.prepareEmailAddressVerification.mockReset().mockResolvedValue({});
  sim.signUp.attemptEmailAddressVerification.mockReset().mockResolvedValue({status: 'complete', createdSessionId: 'signup-session'});
  sim.signIn.attemptFirstFactor.mockReset().mockResolvedValue({status: 'complete', createdSessionId: 'reset-session'});
  sim.api.logout.mockResolvedValue(undefined);
});
afterEach(async () => { await cleanupScreens(); vi.useRealTimers(); });

describe.each([
  { role: 'owner', Component: OwnerSignIn, emailPlaceholder: 'Enter your email', submit: 'Sign In' },
  { role: 'member', Component: TeamSignIn, emailPlaceholder: 'name@example.com', submit: 'Sign In as Team Member' },
])('$role sign-in screen', ({Component, emailPlaceholder, submit}) => {
  it('validates required fields before contacting identity service', async () => {
    const tree = await renderScreen(Component);
    await press(tree, submit);
    expect(sim.alert).toHaveBeenCalledWith('Error', 'Enter your email and password');
    expect(sim.signIn.create).not.toHaveBeenCalled();
    await fill(tree, emailPlaceholder, 'member@example.test');
    await press(tree, submit);
    expect(sim.signIn.create).not.toHaveBeenCalled();
  });

  it('activates a completed session and navigates to the guarded home route', async () => {
    const tree = await renderScreen(Component);
    await fill(tree, emailPlaceholder, '  account@example.test  ');
    await fill(tree, 'Enter your password', 'Strong-password-123');
    await press(tree, submit);
    expect(sim.signIn.create).toHaveBeenCalledWith({identifier: 'account@example.test', password: 'Strong-password-123'});
    expect(sim.setActive).toHaveBeenCalledWith({session: 'simulation-session'});
    expect(sim.router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it.each([{status: 'needs_second_factor', createdSessionId: null}, {status: 'complete', createdSessionId: null}])('blocks incomplete identity result $status', async result => {
    sim.signIn.create.mockResolvedValue(result);
    const tree = await renderScreen(Component);
    await fill(tree, emailPlaceholder, 'account@example.test');
    await fill(tree, 'Enter your password', 'Strong-password-123');
    await press(tree, submit);
    expect(sim.setActive).not.toHaveBeenCalled();
    expect(sim.router.replace).not.toHaveBeenCalled();
    expect(sim.alert).toHaveBeenCalledWith('Sign In Failed', expect.stringContaining('Additional verification'));
  });

  it('shows rejected credentials and allows a corrected retry', async () => {
    sim.signIn.create.mockRejectedValueOnce({errors: [{message: 'Invalid credentials'}]});
    const tree = await renderScreen(Component);
    await fill(tree, emailPlaceholder, 'account@example.test');
    await fill(tree, 'Enter your password', 'Wrong-password');
    await press(tree, submit);
    expect(sim.alert).toHaveBeenCalledWith('Sign In Failed', 'Invalid credentials');
    expect(sim.setActive).not.toHaveBeenCalled();
    await fill(tree, 'Enter your password', 'Correct-password');
    await press(tree, submit);
    expect(sim.setActive).toHaveBeenCalledTimes(1);
  });

  it('does not navigate if session activation fails', async () => {
    sim.setActive.mockRejectedValueOnce(new Error('Session activation unavailable'));
    const tree = await renderScreen(Component);
    await fill(tree, emailPlaceholder, 'account@example.test');
    await fill(tree, 'Enter your password', 'Strong-password-123');
    await press(tree, submit);
    expect(sim.router.replace).not.toHaveBeenCalled();
    expect(sim.alert).toHaveBeenCalledWith('Sign In Failed', 'Session activation unavailable');
  });

  it('coalesces repeated taps before React rerenders', async () => {
    const tree = await renderScreen(Component);
    await fill(tree, emailPlaceholder, 'account@example.test');
    await fill(tree, 'Enter your password', 'Strong-password-123');
    await doublePress(tree, submit);
    expect(sim.signIn.create).toHaveBeenCalledTimes(1);
    expect(sim.setActive).toHaveBeenCalledTimes(1);
  });

  it('provides password recovery for the role', async () => {
    const tree = await renderScreen(Component);
    await pressText(tree, 'Forgot Password?');
    expect(sim.router.push).toHaveBeenCalledWith('/(auth)/forgot-password');
  });
});

describe('signup and email verification', () => {
  it('rejects empty name/email and short passwords', async () => {
    const tree = await renderScreen(SignUp);
    await press(tree, 'Create Account');
    expect(sim.alert).toHaveBeenLastCalledWith('Error', 'Please enter your full name');
    await fill(tree, 'Enter your full name', 'New Owner');
    await press(tree, 'Create Account');
    expect(sim.alert).toHaveBeenLastCalledWith('Error', 'Please enter your email');
    await fill(tree, 'Enter your email', 'new@example.test');
    await fill(tree, 'At least 8 characters', 'short');
    await press(tree, 'Create Account');
    expect(sim.signUp.create).not.toHaveBeenCalled();
  });

  it('sends verification, normalizes input, and requires a complete verification before activation', async () => {
    const tree = await renderScreen(SignUp);
    await fillSignUp(tree);
    await press(tree, 'Create Account');
    expect(sim.signUp.create).toHaveBeenCalledWith({emailAddress:'new@example.test', password:'Strong-password-123', firstName:'New', lastName:'Owner'});
    expect(sim.signUp.prepareEmailAddressVerification).toHaveBeenCalledWith({strategy:'email_code'});
    expect(screenText(tree)).toContain('Verification Code');
    expect(sim.setActive).not.toHaveBeenCalled();
    await fill(tree, 'Enter 6-digit code', '123456');
    await press(tree, 'Verify Email');
    expect(sim.signUp.attemptEmailAddressVerification).toHaveBeenCalledWith({code:'123456'});
    expect(sim.setActive).toHaveBeenCalledWith({session:'signup-session'});
  });

  it('resends only verification without creating another account', async () => {
    const tree = await renderScreen(SignUp);
    await fillSignUp(tree);
    await press(tree, 'Create Account');
    await press(tree, "Didn't receive code? Resend");
    expect(sim.signUp.create).toHaveBeenCalledTimes(1);
    expect(sim.signUp.prepareEmailAddressVerification).toHaveBeenCalledTimes(2);
  });

  it('lets the user retry sending a code after account creation succeeds but delivery fails', async () => {
    sim.signUp.prepareEmailAddressVerification.mockRejectedValueOnce(new Error('Email delivery unavailable'));
    const tree = await renderScreen(SignUp);
    await fillSignUp(tree);
    await press(tree, 'Create Account');
    expect(screenText(tree)).toContain('Verification Code');
    await press(tree, "Didn't receive code? Resend");
    expect(sim.signUp.create).toHaveBeenCalledTimes(1);
    expect(sim.signUp.prepareEmailAddressVerification).toHaveBeenCalledTimes(2);
  });

  it('requires six numeric digits and refuses incomplete verification', async () => {
    const tree = await renderScreen(SignUp);
    await fillSignUp(tree);
    await press(tree, 'Create Account');
    for (const code of ['12', 'abcdef']) {
      await fill(tree, 'Enter 6-digit code', code);
      await press(tree, 'Verify Email');
    }
    expect(sim.signUp.attemptEmailAddressVerification).not.toHaveBeenCalled();
    sim.signUp.attemptEmailAddressVerification.mockResolvedValue({status:'missing_requirements',createdSessionId:null});
    await fill(tree, 'Enter 6-digit code', '123456');
    await press(tree, 'Verify Email');
    expect(sim.setActive).not.toHaveBeenCalled();
    expect(sim.router.replace).not.toHaveBeenCalled();
  });

  it('coalesces repeated account creation and verification taps', async () => {
    const tree = await renderScreen(SignUp);
    await fillSignUp(tree);
    await doublePress(tree, 'Create Account');
    expect(sim.signUp.create).toHaveBeenCalledTimes(1);
    await fill(tree, 'Enter 6-digit code', '123456');
    await doublePress(tree, 'Verify Email');
    expect(sim.signUp.attemptEmailAddressVerification).toHaveBeenCalledTimes(1);
  });

  it('shows rejected creation and verification and permits retry', async () => {
    sim.signUp.create.mockRejectedValueOnce({errors:[{message:'Address unavailable'}]});
    const tree = await renderScreen(SignUp);
    await fillSignUp(tree);
    await press(tree, 'Create Account');
    expect(sim.alert).toHaveBeenLastCalledWith('Sign Up Failed', 'Address unavailable');
    expect(sim.signUp.prepareEmailAddressVerification).not.toHaveBeenCalled();
    await press(tree, 'Create Account');
    sim.signUp.attemptEmailAddressVerification.mockRejectedValueOnce({errors:[{message:'Code expired'}]});
    await fill(tree, 'Enter 6-digit code', '123456');
    await press(tree, 'Verify Email');
    expect(sim.alert).toHaveBeenLastCalledWith('Verification Failed', 'Code expired');
    expect(sim.setActive).not.toHaveBeenCalled();
    await press(tree, 'Verify Email');
    expect(sim.setActive).toHaveBeenCalledTimes(1);
  });

  it('coalesces resend taps and reports delivery errors without discarding verification', async () => {
    const tree = await renderScreen(SignUp);
    await fillSignUp(tree);
    await press(tree, 'Create Account');
    sim.signUp.prepareEmailAddressVerification.mockRejectedValueOnce(new Error('Delivery unavailable'));
    await doublePress(tree, "Didn't receive code? Resend");
    expect(sim.signUp.prepareEmailAddressVerification).toHaveBeenCalledTimes(2);
    expect(sim.alert).toHaveBeenLastCalledWith('Verification Failed', 'Delivery unavailable');
    expect(screenText(tree)).toContain('Verification Code');
    expect(sim.signUp.create).toHaveBeenCalledTimes(1);
  });
});

describe('password recovery', () => {
  it('validates the email and requires a six-digit recovery code plus a strong password', async () => {
    const tree = await renderScreen(ForgotPassword);
    await press(tree, 'Send Verification Code');
    await fill(tree, 'Enter your email', 'invalid');
    await press(tree, 'Send Verification Code');
    expect(sim.signIn.create).not.toHaveBeenCalled();
    await enterRecoveryCode(tree);
    expect(sim.signIn.create).toHaveBeenCalledWith({strategy:'reset_password_email_code',identifier:'member@example.test'});
    for (const code of ['', '1', 'abcdef']) {
      await fill(tree, 'Enter 6-digit code', code);
      await press(tree, 'Reset Password');
    }
    expect(sim.signIn.attemptFirstFactor).not.toHaveBeenCalled();
    await fill(tree, 'Enter 6-digit code', '123456');
    await fill(tree, 'Enter new password (min. 8 characters)', 'short');
    await press(tree, 'Reset Password');
    expect(sim.signIn.attemptFirstFactor).not.toHaveBeenCalled();
  });

  it('completes recovery, clears session state, and offers a sign-in route', async () => {
    const tree = await renderScreen(ForgotPassword);
    await enterRecoveryCode(tree);
    await press(tree, 'Reset Password');
    expect(sim.signIn.attemptFirstFactor).toHaveBeenCalledWith({strategy:'reset_password_email_code',code:'123456',password:'Changed-password-123'});
    expect(sim.signOut).toHaveBeenCalledTimes(1);
    expect(sim.api.logout).toHaveBeenCalledTimes(1);
    expect(screenText(tree)).toContain('Your password has been reset successfully.');
    await pressText(tree, 'Go to Sign In');
    expect(sim.router.replace).toHaveBeenCalledWith('/(auth)/clerk-signin');
  });

  it.each([{status:'needs_second_factor'}, new Error('Code expired')])('does not report success for an incomplete or failed recovery', async result => {
    if (result instanceof Error) sim.signIn.attemptFirstFactor.mockRejectedValue(result);
    else sim.signIn.attemptFirstFactor.mockResolvedValue(result);
    const tree = await renderScreen(ForgotPassword);
    await enterRecoveryCode(tree);
    await press(tree, 'Reset Password');
    expect(screenText(tree)).not.toContain('Your password has been reset successfully.');
    expect(sim.signOut).not.toHaveBeenCalled();
    expect(sim.router.replace).not.toHaveBeenCalled();
  });

  it('offers a sign-out retry after a successful password reset without consuming the code again', async () => {
    sim.signOut.mockRejectedValueOnce(new Error('Offline'));
    const tree = await renderScreen(ForgotPassword);
    await enterRecoveryCode(tree);
    await press(tree, 'Reset Password');
    expect(screenText(tree)).toContain('Retry Sign Out');
    expect(sim.router.replace).not.toHaveBeenCalled();
    await press(tree, 'Retry Sign Out');
    expect(sim.signIn.attemptFirstFactor).toHaveBeenCalledTimes(1);
    expect(sim.signOut).toHaveBeenCalledTimes(2);
    expect(screenText(tree)).toContain('Go to Sign In');
  });

  it('coalesces repeated recovery-code and reset submissions', async () => {
    const tree = await renderScreen(ForgotPassword);
    await fill(tree, 'Enter your email', 'member@example.test');
    await doublePress(tree, 'Send Verification Code');
    expect(sim.signIn.create).toHaveBeenCalledTimes(1);
    const sent = sim.alert.mock.calls.find(call => call[0] === 'Code Sent!');
    if (sent?.[2]?.[0]?.onPress) await act(async () => sent[2][0].onPress());
    await fill(tree, 'Enter 6-digit code', '123456');
    await fill(tree, 'Enter new password (min. 8 characters)', 'Changed-password-123');
    await doublePress(tree, 'Reset Password');
    expect(sim.signIn.attemptFirstFactor).toHaveBeenCalledTimes(1);
  });

  it('stays on the email screen after delivery failure and allows recovery resend', async () => {
    sim.signIn.create.mockRejectedValueOnce({errors:[{message:'Delivery unavailable'}]});
    const tree = await renderScreen(ForgotPassword);
    await fill(tree, 'Enter your email', 'member@example.test');
    await press(tree, 'Send Verification Code');
    expect(sim.alert).toHaveBeenLastCalledWith('Error', 'Delivery unavailable');
    expect(screenText(tree)).toContain('Step 1 of 2');
    await enterRecoveryCode(tree);
    await pressText(tree, 'Did not receive the code? Resend');
    expect(sim.signIn.create).toHaveBeenCalledTimes(3);
    expect(sim.signIn.attemptFirstFactor).not.toHaveBeenCalled();
  });

  it('automatically returns to sign in only after completed recovery and cleanup', async () => {
    vi.useFakeTimers();
    const tree = await renderScreen(ForgotPassword);
    await enterRecoveryCode(tree);
    await press(tree, 'Reset Password');
    expect(sim.router.replace).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(2500); });
    expect(sim.router.replace).toHaveBeenCalledWith('/(auth)/clerk-signin');
  });
});

describe('session routes and sign out', () => {
  it.each([
    {Component:LoginRedirect, route:'/(auth)/clerk-signin'},
    {Component:SignUpRedirect, route:'/(auth)/clerk-signup'},
    {Component:ResetPassword, route:'/(auth)/forgot-password'},
  ])('redirects legacy route to $route', async ({Component, route}) => {
    await renderScreen(Component);
    expect(sim.router.replace).toHaveBeenCalledWith(route);
  });

  it('index waits for profile synchronization, shows errors, and supports retry', async () => {
    sim.loading = true;
    const loading = await renderScreen(Index);
    expect(loading.root.findAllByType('ActivityIndicator' as any)).toHaveLength(1);
    expect(sim.router.replace).not.toHaveBeenCalled();
    sim.loading = false; sim.error = 'Workspace access could not be verified';
    const failed = await renderScreen(Index);
    expect(screenText(failed)).toContain(sim.error);
    await act(async () => failed.root.findAll(node => String(node.type) === 'Button' && node.props.title === 'Retry')[0].props.onPress());
    expect(sim.retry).toHaveBeenCalledTimes(1);
    expect(sim.router.replace).not.toHaveBeenCalled();
  });

  it.each(['owner','member','guest'] as const)('index routes $s according to the verified profile', async role => {
    resetSimulation(role);
    await renderScreen(Index);
    expect(sim.router.replace).toHaveBeenCalledWith(role === 'guest' ? '/(auth)/login' : '/(tabs)/home');
  });

  it('auth layout redirects existing sessions away from the login forms', async () => {
    sim.user = {...owner};
    await renderScreen(AuthLayout);
    expect(sim.router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('sign out revokes the session before clearing local data and navigates only on success', async () => {
    sim.user = {...owner};
    const tree = await renderScreen(SignOutButton);
    await doublePress(tree, 'Sign Out');
    expect(sim.signOut).toHaveBeenCalledTimes(1);
    expect(sim.api.logout).toHaveBeenCalledTimes(1);
    expect(sim.signOut.mock.invocationCallOrder[0]).toBeLessThan(sim.api.logout.mock.invocationCallOrder[0]);
    expect(sim.router.replace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('shows failed sign out and permits retry instead of silently retaining the session', async () => {
    sim.signOut.mockRejectedValueOnce(new Error('Offline'));
    const tree = await renderScreen(SignOutButton);
    await press(tree, 'Sign Out');
    expect(sim.alert).toHaveBeenCalledWith('Sign Out Failed', expect.any(String));
    expect(sim.router.replace).not.toHaveBeenCalled();
    await press(tree, 'Sign Out');
    expect(sim.signOut).toHaveBeenCalledTimes(2);
    expect(sim.router.replace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('index handles sign-out failure while account access is blocked', async () => {
    sim.error = 'Account disabled';
    sim.signOut.mockRejectedValueOnce(new Error('Offline'));
    const tree = await renderScreen(Index);
    await pressText(tree, 'Sign Out');
    expect(sim.alert).toHaveBeenCalledWith('Sign Out Failed', expect.any(String));
    expect(sim.router.replace).not.toHaveBeenCalled();
    await pressText(tree, 'Sign Out');
    expect(sim.router.replace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('attempts session revocation even when local cache cleanup fails', async () => {
    sim.api.logout.mockRejectedValueOnce(new Error('Storage unavailable'));
    const tree = await renderScreen(SignOutButton);
    await pressText(tree, 'Sign Out');
    expect(sim.signOut).toHaveBeenCalledTimes(1);
    expect(sim.alert).toHaveBeenCalledWith('Sign Out Failed', expect.any(String));
  });

  it('team login can return to owner login after a direct link without back history', async () => {
    sim.router.canGoBack.mockReturnValue(false);
    const tree = await renderScreen(TeamSignIn);
    await pressText(tree, 'Back to Owner Login');
    expect(sim.router.replace).toHaveBeenCalledWith('/(auth)/clerk-signin');
  });
});

describe('root navigator guards', () => {
  let RootLayout: typeof import('../app/_layout').default;
  beforeAll(async () => {
    vi.stubEnv('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY', 'pk_test_c2ltdWxhdGlvbi5jbGVyay5hY2NvdW50cy5kZXYk');
    RootLayout = (await import('../app/_layout')).default;
  });
  afterAll(() => vi.unstubAllEnvs());
  it('keeps native back and detail action headers visible, with a direct-link escape', async () => {
    resetSimulation('owner');
    const tree = await renderScreen(RootLayout);
    for (const name of Object.keys(nativeHeaderTitles)) {
      const route = tree.root.findAll(node => String(node.type) === 'Route' && node.props.name === name)[0];
      expect(route.props.options.headerShown).toBe(true);
      sim.router.canGoBack.mockReturnValue(false);
      const header = await renderScreen(route.props.options.headerLeft);
      await pressText(header, 'Back');
      expect(sim.router.replace).toHaveBeenLastCalledWith('/(tabs)/home');
    }
  });
  it.each([
    {name:'guest', role:'guest' as const, loading:false, error:null, expected:['index','(auth)']},
    {name:'owner', role:'owner' as const, loading:false, error:null, expected:['index',...protectedScreens]},
    {name:'member', role:'member' as const, loading:false, error:null, expected:['index',...protectedScreens]},
    {name:'loading profile', role:'owner' as const, loading:true, error:null, expected:['index']},
    {name:'denied profile', role:'owner' as const, loading:false, error:'Account disabled', expected:['index']},
  ])('$name mounts only allowed routes', async state => {
    resetSimulation(state.role); sim.loading = state.loading; sim.error = state.error;
    const tree = await renderScreen(RootLayout);
    expect(tree.root.findAll(node => String(node.type) === 'Route').map(node => node.props.name)).toEqual(state.expected);
    expect(tree.root.findAll(node => String(node.type) === 'Navigator')).toHaveLength(1);
  });
});
