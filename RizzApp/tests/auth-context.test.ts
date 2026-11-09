import React, { useState } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

// Actual AuthProvider + route policy run here. Only identity, storage/API, and
// native lifecycle boundaries are mocked. API stale-commit protection is
// independently covered by session.test.ts.
const state = vi.hoisted(() => ({
  isLoaded: true, isSignedIn: false, emailVerified: true, sessionId: null as string | null,
  getToken: vi.fn(), clear: vi.fn(), refresh: vi.fn(), setTokenProvider: vi.fn(),
  profile: null as any, listeners: new Set<() => void>(),
  lifecycle: new Set<(state: string) => void>(),
}));
vi.mock('../context/IdentityContext', () => ({ useIdentity: () => ({isLoaded: state.isLoaded, isSignedIn: state.isSignedIn, sessionId: state.sessionId, getToken: state.getToken, emailVerified: state.emailVerified, error: null}) }));
vi.mock('react-native', () => ({AppState: {addEventListener: (_event: string, callback: (state: string) => void) => {
  state.lifecycle.add(callback);
  return {remove: () => {state.lifecycle.delete(callback);}};
}}}));
vi.mock('../api/authApi', () => ({
  clearSessionUser: state.clear, refreshCurrentUser: state.refresh,
  getSessionUser: () => state.profile,
  subscribeToSession: (callback: () => void) => {state.listeners.add(callback); return () => {state.listeners.delete(callback);};},
}));
vi.mock('../services/supabaseClient', () => ({setAccessTokenProvider: state.setTokenProvider}));

import { AuthProvider, useAccount } from '../context/AuthContext';
import { routeAccess } from '../services/routePolicy';

const ownerA = {id:'owner-a',firebase_user_id:'user_a',full_name:'Owner A',email:'a@example.invalid',role:'owner' as const,is_active:true,created_at:'2026-11-07'};
const ownerB = {...ownerA,id:'owner-b',firebase_user_id:'user_b',full_name:'Owner B',email:'b@example.invalid'};
let observed: ReturnType<typeof useAccount>;
let tree: ReactTestRenderer | undefined;
const observations: {session: string | null; profile: string | null; private: boolean}[] = [];

function commitProfile(profile: typeof ownerA | null) {
  state.profile = profile;
  state.listeners.forEach(listener => listener());
}
function Draft({kind}: {kind: string}) {
  const [draft, setDraft] = useState('');
  return React.createElement('input', {name:kind,value:draft,onChange:(value:string)=>setDraft(value)});
}
function GuardedContent() {
  // Record every render so the test detects even transient cross-session disclosure.
  // eslint-disable-next-line react-hooks/globals
  observed = useAccount();
  const access = routeAccess(!!observed.user, observed.loading, !!observed.error);
  observations.push({session:state.sessionId,profile:observed.user?.id || null,private:access.private});
  return React.createElement('main', {},
    access.public ? React.createElement(Draft, {key:'auth',kind:'verification-code'}) : null,
    access.private ? React.createElement(Draft, {key:'private',kind:'expense-draft'}) : null,
    React.createElement('span', {}, observed.error || observed.user?.full_name || (observed.loading ? 'Loading' : 'Guest')),
  );
}
function App() { return React.createElement(AuthProvider, null, React.createElement(GuardedContent)); }
async function mount() { await act(async () => {tree = create(React.createElement(App));}); }
async function rerender() { await act(async () => tree!.update(React.createElement(App))); }
async function foreground() { await act(async () => {state.lifecycle.forEach(callback => callback('background')); state.lifecycle.forEach(callback => callback('active'));}); }
function input() {return tree!.root.findAllByType('input')[0];}
async function typeDraft(value: string) {await act(async () => input().props.onChange(value));}
function deferred<T>() {
  let resolve!: (value:T) => void;
  let reject!: (failure:Error) => void;
  const promise = new Promise<T>((yes,no)=>{resolve=yes; reject=no;});
  return {promise,resolve,reject};
}

beforeEach(() => {
  Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT:true});
  state.emailVerified=true; state.isLoaded=true; state.isSignedIn=false; state.sessionId=null; state.profile=null;
  observations.length=0;
  state.listeners.clear(); state.lifecycle.clear();
  state.getToken.mockReset().mockResolvedValue('simulation-token');
  state.setTokenProvider.mockReset();
  state.clear.mockReset().mockImplementation(async () => commitProfile(null));
  state.refresh.mockReset().mockImplementation(async () => {commitProfile(ownerA); return ownerA;});
});
afterEach(async () => {if (tree) await act(async () => tree!.unmount()); tree=undefined;});

it('preserves a signed-out verification form when returning from the email app', async () => {
  await mount();
  await typeDraft('123456');
  await foreground();
  expect(input().props.name).toBe('verification-code');
  expect(input().props.value).toBe('123456');
  expect(state.refresh).not.toHaveBeenCalled();
});
it('never fetches or displays workspace data for an unverified Firebase session', async () => {
  state.isSignedIn=true; state.emailVerified=false; state.sessionId='unverified';
  state.profile=ownerA;
  await mount();
  expect(state.refresh).not.toHaveBeenCalled(); expect(observed.user).toBeNull();
  expect(state.setTokenProvider).toHaveBeenLastCalledWith(null);
  expect(observations.some(row=>row.private)).toBe(false);
});

it('keeps an unsaved private form mounted during and after successful foreground refresh', async () => {
  state.isSignedIn=true; state.sessionId='session-a';
  await mount(); await typeDraft('Unsaved materials expense');
  const pending = deferred<typeof ownerA>();
  state.refresh.mockImplementationOnce(() => pending.promise.then(profile => {commitProfile(profile); return profile;}));
  await foreground();
  expect(input()?.props.value).toBe('Unsaved materials expense');
  expect(observed.loading).toBe(false);
  await act(async () => pending.resolve({...ownerA,full_name:'Updated Owner A'}));
  expect(input().props.value).toBe('Unsaved materials expense');
  expect(observed.user?.full_name).toBe('Updated Owner A');
});

it('revokes visible private content when foreground account validation fails', async () => {
  state.isSignedIn=true; state.sessionId='session-a';
  await mount(); await typeDraft('Private draft');
  state.refresh.mockRejectedValueOnce(new Error('Account disabled'));
  await foreground();
  expect(input()?.props.name).not.toBe('expense-draft');
  expect(observed.user).toBeNull();
  expect(observed.error).toBe('Account disabled');
});

it('publishes a saved profile snapshot without discarding private form state', async () => {
  state.isSignedIn=true; state.sessionId='session-a';
  await mount(); await typeDraft('Keep this draft');
  await act(async () => commitProfile({...ownerA,full_name:'Profile saved'}));
  expect(observed.user?.full_name).toBe('Profile saved');
  expect(input().props.value).toBe('Keep this draft');
});

it('ignores the completion of an old initial sync after sign out', async () => {
  state.isSignedIn=true; state.sessionId='session-a';
  const pending = deferred<typeof ownerA>();
  state.refresh.mockReturnValueOnce(pending.promise);
  await mount(); expect(observed.loading).toBe(true);
  state.isSignedIn=false; state.sessionId=null;
  await rerender();
  expect(input().props.name).toBe('verification-code');
  await typeDraft('New guest flow');
  await act(async () => pending.resolve(ownerA));
  expect(observed.user).toBeNull();
  expect(observed.error).toBeNull();
  expect(input().props.value).toBe('New guest flow');
});

it('ignores a previous account failure after another account has synchronized', async () => {
  state.isSignedIn=true; state.sessionId='session-a';
  const previous = deferred<typeof ownerA>();
  state.refresh.mockReturnValueOnce(previous.promise);
  await mount();
  state.sessionId='session-b';
  state.refresh.mockImplementationOnce(async () => {commitProfile(ownerB); return ownerB;});
  await rerender();
  expect(observed.user?.id).toBe('owner-b');
  await typeDraft('Workspace B draft');
  await act(async () => previous.reject(new Error('Old account denied')));
  expect(observed.user?.id).toBe('owner-b');
  expect(observed.error).toBeNull();
  expect(input().props.value).toBe('Workspace B draft');
});

it('does not start a stale account sync when sign out occurs during cache clearing', async () => {
  state.isSignedIn=true; state.sessionId='session-a';
  const clearing = deferred<void>();
  state.clear.mockReturnValueOnce(clearing.promise);
  await mount();
  state.isSignedIn=false; state.sessionId=null;
  await rerender();
  await act(async () => clearing.resolve());
  expect(state.refresh).not.toHaveBeenCalled();
  expect(observed.user).toBeNull();
  expect(input().props.name).toBe('verification-code');
});

it('initial validation failure blocks both auth and private content until explicit retry succeeds', async () => {
  state.isSignedIn=true; state.sessionId='session-a';
  state.refresh.mockRejectedValueOnce(new Error('Workspace unavailable'));
  await mount();
  expect(input()).toBeUndefined();
  expect(observed.error).toBe('Workspace unavailable');
  await act(async () => observed.retry());
  expect(observed.error).toBeNull();
  expect(observed.user?.id).toBe('owner-a');
  expect(input().props.name).toBe('expense-draft');
});

it('does not expose the previous workspace even for one render while a new session loads', async () => {
  state.isSignedIn=true; state.sessionId='session-a';
  await mount(); await typeDraft('Workspace A private draft');
  const next = deferred<typeof ownerA>();
  state.sessionId='session-b';
  state.refresh.mockImplementationOnce(() => next.promise.then(profile => {commitProfile(profile); return profile;}));
  await rerender();
  expect(input()?.props.name).toBe('verification-code');
  expect(observations.filter(item=>item.session==='session-b' && item.private && item.profile==='owner-a')).toEqual([]);
  await act(async () => next.resolve(ownerB));
  expect(observed.user?.id).toBe('owner-b');
  expect(input().props.value).toBe('');
});

it('ignores a late foreground failure after switching to a different account', async () => {
  state.isSignedIn=true; state.sessionId='session-a';
  await mount();
  const previous = deferred<typeof ownerA>();
  state.refresh.mockReturnValueOnce(previous.promise);
  await foreground();
  state.sessionId='session-b';
  state.refresh.mockImplementationOnce(async () => {commitProfile(ownerB); return ownerB;});
  await rerender();
  await act(async () => previous.reject(new Error('Previous session expired')));
  expect(observed.user?.id).toBe('owner-b');
  expect(observed.error).toBeNull();
  expect(input().props.name).toBe('expense-draft');
});

it('keeps private content blocked while Firebase loads and preserves public deep links', async () => {
  state.isLoaded=false;
  await mount();
  expect(input()?.props.name).toBe('verification-code');
  expect(state.refresh).not.toHaveBeenCalled();
  state.isLoaded=true;
  await rerender();
  expect(observed.loading).toBe(false);
  expect(input().props.name).toBe('verification-code');
});
