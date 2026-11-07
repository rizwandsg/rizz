import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ token: vi.fn(), invoke: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), multiRemove: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { setItem: mocks.setItem, removeItem: mocks.removeItem, multiRemove: mocks.multiRemove } }));
vi.mock('../services/supabaseClient', () => ({ requireAccessToken: mocks.token, supabase: { functions: { invoke: mocks.invoke } } }));
import { clearSessionUser, getCurrentUser, isAuthenticated, refreshCurrentUser, resetPassword, updateProfile } from '../api/authApi';
const user = { id: 'profile', clerk_user_id: 'user_verified', role: 'owner', is_active: true, email: 'user@example.com' };
beforeEach(async () => { vi.resetAllMocks(); mocks.token.mockResolvedValue('signed-token'); await clearSessionUser(); });
it('does not trust local cached identity or a profile without an active token', async () => {
  expect(await isAuthenticated()).toBe(false);
  mocks.invoke.mockResolvedValue({ data: user, error: null });
  await refreshCurrentUser(); expect(await getCurrentUser()).toEqual(user);
  mocks.token.mockRejectedValue(new Error('Expired'));
  expect(await isAuthenticated()).toBe(false);
});
it('discards an in-flight profile edit after logout or an account switch', async () => {
  mocks.invoke.mockResolvedValue({data:user,error:null});
  await refreshCurrentUser();
  let resolve!: (value: unknown) => void;
  mocks.invoke.mockReturnValueOnce(new Promise(done => { resolve=done; }));
  const pending=updateProfile({full_name:'Edited old user'});
  await Promise.resolve();
  await clearSessionUser();
  const next={...user,id:'another-profile',clerk_user_id:'user_other'};
  mocks.invoke.mockResolvedValue({data:next,error:null});
  await refreshCurrentUser();
  resolve({data:{...user,full_name:'Edited old user'},error:null});
  await expect(pending).rejects.toThrow('Session changed');
  expect(await getCurrentUser()).toEqual(next);
  expect(mocks.setItem).not.toHaveBeenCalledWith('@rizzapp_user', JSON.stringify({...user,full_name:'Edited old user'}));
});
it('rejects profile responses that change the signed-in identity or role', async () => {
  mocks.invoke.mockResolvedValue({data:user,error:null});
  await refreshCurrentUser();
  for (const changed of [{...user,id:'other'},{...user,clerk_user_id:'user_other'},{...user,role:'member'},{...user,is_active:false}]) {
    mocks.invoke.mockResolvedValueOnce({data:changed,error:null});
    await expect(updateProfile({full_name:'Changed'})).rejects.toThrow('Profile identity changed');
    expect(await getCurrentUser()).toEqual(user);
  }
});
it('orders logout cache removal after an already-started profile cache write', async () => {
  mocks.invoke.mockResolvedValue({data:user,error:null});
  let finishWrite!: ()=>void;
  mocks.setItem.mockImplementationOnce(() => new Promise<void>(resolve=>{finishWrite=resolve;}));
  const pending=refreshCurrentUser();
  // Let the account response reach the asynchronous storage write.
  for(let i=0;i<8 && !finishWrite;i++) await Promise.resolve();
  expect(finishWrite).toBeTypeOf('function');
  const logout=clearSessionUser();
  expect(await getCurrentUser()).toBeNull();
  finishWrite();
  await expect(pending).rejects.toThrow('Session changed');
  await logout;
  expect(mocks.multiRemove.mock.invocationCallOrder.at(-1)).toBeGreaterThan(mocks.setItem.mock.invocationCallOrder.at(-1)!);
  expect(await getCurrentUser()).toBeNull();
});
it('discards stale profile responses after logout and never returns reset passwords', async () => {
  let resolve!: (value: unknown) => void;
  mocks.invoke.mockReturnValue(new Promise(done => { resolve = done; }));
  const pending = refreshCurrentUser();
  await Promise.resolve();
  await clearSessionUser();
  resolve({ data: user, error: null });
  await expect(pending).rejects.toThrow('Session changed');
  expect(await getCurrentUser()).toBeNull();
  await expect(resetPassword('victim@example.com')).rejects.toThrow('verify');
});
