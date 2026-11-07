import { beforeEach, expect, it, vi } from 'vitest';
import { AccountDependencies, createAccountHandler, Profile } from '../supabase/functions/account/handler';
const owner: Profile = { id: 'owner-a', clerk_user_id: 'user_owner_a', email: 'owner@example.com', full_name: 'Owner', role: 'owner', parent_user_id: null, is_active: true };
let deps: AccountDependencies;
beforeEach(() => {
  deps = { identity: vi.fn().mockResolvedValue(owner.clerk_user_id), findProfile: vi.fn().mockResolvedValue(owner), getProfile: vi.fn(), insertProfile: vi.fn(), updateProfile: vi.fn(), clerk: vi.fn() };
});
function request(body: unknown, token = 'valid') { return new Request('https://local/account', { method: 'POST', headers: token ? { authorization: 'Bearer ' + token } : {}, body: JSON.stringify(body) }); }
it('rejects unsigned and invalid identities before accessing the admin database', async () => {
  const handle = createAccountHandler(deps);
  expect((await handle(request({ action: 'sync' }, ''))).status).toBe(401);
  vi.mocked(deps.identity).mockResolvedValue(null);
  expect((await handle(request({ action: 'sync' }))).status).toBe(401);
  expect(deps.findProfile).not.toHaveBeenCalled();
});
it('blocks inactive accounts, members managing teams, and cross-workspace updates', async () => {
  const handle = createAccountHandler(deps);
  vi.mocked(deps.findProfile).mockResolvedValueOnce({ ...owner, is_active: false });
  expect((await handle(request({ action: 'sync' }))).status).toBe(403);
  vi.mocked(deps.findProfile).mockResolvedValueOnce({ ...owner, role: 'member', parent_user_id: 'another-owner' });
  vi.mocked(deps.getProfile).mockResolvedValue({ ...owner, id: 'another-owner' });
  expect((await handle(request({ action: 'createMember', member: {} }))).status).toBe(403);
  vi.mocked(deps.getProfile).mockResolvedValue({ ...owner, role: 'member', parent_user_id: 'another-owner' });
  expect((await handle(request({ action: 'updateMember', id: 'someone', member: { is_active: true } }))).status).toBe(403);
  expect(deps.updateProfile).not.toHaveBeenCalled();
});
it('takes new profile identity and verified email from trusted services', async () => {
  vi.mocked(deps.findProfile).mockResolvedValue(null);
  vi.mocked(deps.clerk).mockResolvedValue({ primary_email_address_id: 'mail', first_name: 'Verified', email_addresses: [{ id: 'mail', email_address: 'real@example.com', verification: { status: 'verified' } }] });
  vi.mocked(deps.insertProfile).mockResolvedValue(owner);
  expect((await createAccountHandler(deps)(request({ action: 'sync', email: 'attacker@example.com', clerk_user_id: 'user_victim', role: 'admin' }))).status).toBe(200);
  expect(deps.insertProfile).toHaveBeenCalledWith(expect.objectContaining({ clerk_user_id: owner.clerk_user_id, email: 'real@example.com', role: 'owner' }));
});
it('only permits editable profile fields and compensates failed member creation', async () => {
  vi.mocked(deps.updateProfile).mockResolvedValue(owner);
  await createAccountHandler(deps)(request({ action: 'updateProfile', profile: { full_name: 'Changed', role: 'owner', parent_user_id: null, is_active: true } }));
  expect(deps.updateProfile).toHaveBeenCalledWith(owner.id, { full_name: 'Changed' });
  vi.mocked(deps.clerk).mockResolvedValue({ id: 'user_new' });
  vi.mocked(deps.insertProfile).mockRejectedValue(new Error('Database unavailable'));
  const response = await createAccountHandler(deps)(request({ action: 'createMember', member: { full_name: 'Team', email: 'team@example.com', password: 'strong-password' } }));
  expect(response.status).toBe(500);
  expect(deps.clerk).toHaveBeenCalledWith('/users/user_new', 'DELETE');
  expect(await response.text()).not.toContain('strong-password');
});
it('rejects malformed JSON, unsupported methods, and password resets without proof', async () => {
  const handle = createAccountHandler(deps);
  expect((await handle(new Request('https://local/account'))).status).toBe(405);
  expect((await handle(new Request('https://local/account', { method: 'POST', headers: { authorization: 'Bearer valid' }, body: '{' }))).status).toBe(400);
  expect((await handle(request({ action: 'resetPassword', email: 'victim@example.com' }))).status).toBe(400);
});
