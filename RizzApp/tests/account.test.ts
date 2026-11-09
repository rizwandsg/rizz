import { beforeEach, expect, it, vi } from 'vitest';
import { AccountDependencies, createAccountHandler, Profile } from '../supabase/functions/account/handler';
const owner: Profile = { id: 'owner-a', firebase_user_id: 'user_owner_a', email: 'owner@example.com', full_name: 'Owner', role: 'owner', parent_user_id: null, is_active: true };
let deps: AccountDependencies;
beforeEach(() => {
  deps = { advanceManagedVersion:vi.fn(), resetManagedPassword:vi.fn(), identity: vi.fn().mockResolvedValue({uid:owner.firebase_user_id, email:owner.email, emailVerified:true}), findProfile: vi.fn().mockResolvedValue(owner), getProfile: vi.fn(), insertProfile: vi.fn(), updateProfile: vi.fn(), createIdentity: vi.fn(), deleteIdentity: vi.fn(), authorizeIdentity: vi.fn() };
});
function request(body: unknown, token = 'valid') { return new Request('https://local/account', { method: 'POST', headers: token ? { authorization: 'Bearer ' + token } : {}, body: JSON.stringify(body) }); }
it('rejects unsigned and invalid identities before accessing the admin database', async () => {
  const handle = createAccountHandler(deps);
  expect((await handle(request({ action: 'sync' }, ''))).status).toBe(401);
  vi.mocked(deps.identity).mockResolvedValue(null);
  expect((await handle(request({ action: 'sync' }))).status).toBe(401);
  expect(deps.findProfile).not.toHaveBeenCalled();
});
it('denies unverified identities, including previously mapped accounts', async () => {
  vi.mocked(deps.identity).mockResolvedValue({uid:owner.firebase_user_id!, email:owner.email, emailVerified:false});
  expect((await createAccountHandler(deps)(request({action:'sync'}))).status).toBe(403);
  expect(deps.findProfile).not.toHaveBeenCalled(); expect(deps.authorizeIdentity).not.toHaveBeenCalled();
});
it('installs only the authenticated claim after an active account synchronizes', async () => {
  expect((await createAccountHandler(deps)(request({action:'sync'}))).status).toBe(200);
  expect(deps.authorizeIdentity).toHaveBeenCalledWith(owner.firebase_user_id);
  vi.mocked(deps.findProfile).mockResolvedValue({...owner,is_active:false});
  expect((await createAccountHandler(deps)(request({action:'sync'}))).status).toBe(403);
  expect(deps.authorizeIdentity).toHaveBeenCalledTimes(1);
});
it('recovers a concurrent first sync by the same verified UID, never by email', async () => {
  vi.mocked(deps.findProfile).mockResolvedValueOnce(null).mockResolvedValueOnce(owner);
  vi.mocked(deps.insertProfile).mockRejectedValue(new Error('unique constraint'));
  expect((await createAccountHandler(deps)(request({action:'sync',email:'victim@example.com'}))).status).toBe(200);
  expect(deps.findProfile).toHaveBeenNthCalledWith(2,owner.firebase_user_id);
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
  vi.mocked(deps.identity).mockResolvedValue({uid: owner.firebase_user_id!, email: 'real@example.com', emailVerified: true, name: 'Verified'});
  vi.mocked(deps.insertProfile).mockResolvedValue(owner);
  expect((await createAccountHandler(deps)(request({ action: 'sync', email: 'attacker@example.com', firebase_user_id: 'user_victim', role: 'admin' }))).status).toBe(200);
  expect(deps.insertProfile).toHaveBeenCalledWith(expect.objectContaining({ firebase_user_id: owner.firebase_user_id, email: 'real@example.com', role: 'owner' }));
});
it('only permits editable profile fields and compensates failed member creation', async () => {
  vi.mocked(deps.updateProfile).mockResolvedValue(owner);
  await createAccountHandler(deps)(request({ action: 'updateProfile', profile: { full_name: 'Changed', role: 'owner', parent_user_id: null, is_active: true } }));
  expect(deps.updateProfile).toHaveBeenCalledWith(owner.id, { full_name: 'Changed' });
  vi.mocked(deps.createIdentity).mockResolvedValue({ uid: 'firebase_new' });
  vi.mocked(deps.findProfile).mockResolvedValueOnce(owner);
  vi.mocked(deps.insertProfile).mockRejectedValue(new Error('Database unavailable'));
  const response = await createAccountHandler(deps)(request({ action: 'createMember', member: { full_name: 'Team', email: 'team@example.com', password: 'strong-password' } }));
  expect(response.status).toBe(500);
  expect(deps.deleteIdentity).toHaveBeenCalledWith('firebase_new');
  expect(await response.text()).not.toContain('strong-password');
});
it('rejects malformed JSON, unsupported methods, and password resets without proof', async () => {
  const handle = createAccountHandler(deps);
  expect((await handle(new Request('https://local/account'))).status).toBe(405);
  expect((await handle(new Request('https://local/account', { method: 'POST', headers: { authorization: 'Bearer valid' }, body: '{' }))).status).toBe(400);
  expect((await handle(request({ action: 'resetPassword', email: 'victim@example.com' }))).status).toBe(400);
});
const managed:Profile={...owner,id:'member-a',firebase_user_id:'managed-a',role:'member',parent_user_id:owner.id,email:'fuwad@rizz.com',rizz_id:'fuwad@rizz.com',managed_login:true,managed_auth_version:1};
it('provisions a normalized Rizz ID with server claims and compensates claim failures',async()=>{
  vi.mocked(deps.createIdentity).mockResolvedValue({uid:'managed-a'});vi.mocked(deps.insertProfile).mockResolvedValue(managed);
  const body={action:'createMember',member:{rizz_id:' Fuwad@Rizz.com ',password:'secure-password',full_name:'Fuwad'}};
  expect((await createAccountHandler(deps)(request(body))).status).toBe(201);
  expect(deps.createIdentity).toHaveBeenCalledWith({email:'fuwad@rizz.com',password:'secure-password',displayName:'Fuwad'});
  expect(deps.authorizeIdentity).toHaveBeenCalledWith('managed-a',1);
  expect(deps.insertProfile).toHaveBeenCalledWith(expect.objectContaining({managed_login:true,managed_auth_version:1,rizz_id:'fuwad@rizz.com',parent_user_id:owner.id,role:'member'}));
  vi.mocked(deps.authorizeIdentity).mockRejectedValueOnce(new Error('Claims failed'));
  expect((await createAccountHandler(deps)(request(body))).status).toBe(500);expect(deps.deleteIdentity).toHaveBeenCalledWith('managed-a');
});
it('requires managed claims to match the provisioned profile and active workspace',async()=>{
  vi.mocked(deps.findProfile).mockResolvedValue(managed);vi.mocked(deps.getProfile).mockResolvedValue(owner);
  vi.mocked(deps.identity).mockResolvedValue({uid:'managed-a',email:managed.email,emailVerified:false,managedVersion:1});
  expect((await createAccountHandler(deps)(request({action:'sync'}))).status).toBe(200);
  vi.mocked(deps.identity).mockResolvedValue({uid:'managed-a',email:managed.email,emailVerified:false,managedVersion:2});
  expect((await createAccountHandler(deps)(request({action:'sync'}))).status).toBe(401);
  vi.mocked(deps.identity).mockResolvedValue({uid:'managed-a',email:'other@rizz.com',emailVerified:false,managedVersion:1});
  expect((await createAccountHandler(deps)(request({action:'sync'}))).status).toBe(401);
});
it('never auto-provisions an owner from the reserved Rizz ID domain',async()=>{
  vi.mocked(deps.findProfile).mockResolvedValue(null);
  vi.mocked(deps.identity).mockResolvedValue({uid:'new',email:'forged@rizz.com',emailVerified:true});
  expect((await createAccountHandler(deps)(request({action:'sync'}))).status).toBe(403);expect(deps.insertProfile).not.toHaveBeenCalled();
});
it('resets only managed members in the caller workspace and revokes data access first',async()=>{
  vi.mocked(deps.getProfile).mockResolvedValue(managed);vi.mocked(deps.advanceManagedVersion).mockResolvedValue({...managed,managed_auth_version:2});
  const body={action:'resetMemberPassword',id:managed.id,password:'new-password',expected_version:1};
  expect((await createAccountHandler(deps)(request(body))).status).toBe(200);
  expect(deps.advanceManagedVersion).toHaveBeenCalledWith(managed.id,owner.id,1);expect(deps.resetManagedPassword).toHaveBeenCalledWith('managed-a','new-password',2);
  expect(vi.mocked(deps.advanceManagedVersion).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(deps.resetManagedPassword).mock.invocationCallOrder[0]);
  vi.mocked(deps.getProfile).mockResolvedValue({...managed,parent_user_id:'other-owner'});
  expect((await createAccountHandler(deps)(request(body))).status).toBe(403);expect(deps.resetManagedPassword).toHaveBeenCalledTimes(1);
});
it('rejects stale reset requests and fails closed when the password service is unavailable',async()=>{
  vi.mocked(deps.getProfile).mockResolvedValue(managed);
  const body={action:'resetMemberPassword',id:managed.id,password:'new-password',expected_version:1};
  vi.mocked(deps.advanceManagedVersion).mockResolvedValue(null);
  expect((await createAccountHandler(deps)(request(body))).status).toBe(409);expect(deps.resetManagedPassword).not.toHaveBeenCalled();
  vi.mocked(deps.advanceManagedVersion).mockResolvedValue({...managed,managed_auth_version:2});vi.mocked(deps.resetManagedPassword).mockRejectedValue(new Error('private upstream details'));
  const result=await createAccountHandler(deps)(request(body));expect(result.status).toBe(500);expect(await result.text()).not.toContain('private upstream details');
});
