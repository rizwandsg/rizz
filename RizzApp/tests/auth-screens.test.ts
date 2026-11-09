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
beforeEach(() => { resetSimulation('guest'); sim.api.logout.mockResolvedValue(undefined); });
afterEach(async () => { await cleanupScreens(); vi.useRealTimers(); });

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
