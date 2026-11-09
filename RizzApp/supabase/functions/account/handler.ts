// Framework-independent handler, also executed by the local regression suite.
import { isRizzId, normalizeRizzId } from '../_shared/rizzId.ts';
export interface Profile {
  id: string; firebase_user_id: string | null; email: string; full_name: string;
  role: string; parent_user_id: string | null; is_active: boolean; phone?: string;
  rizz_id?: string | null; managed_login?: boolean; managed_auth_version?: number;
}
export interface AccountDependencies {
  identity(token: string): Promise<{ uid: string; email: string; emailVerified: boolean; name?: string; managedVersion?: number } | null>;
  findProfile(firebaseId: string): Promise<Profile | null>;
  getProfile(id: string): Promise<Profile | null>;
  insertProfile(data: Record<string, unknown>): Promise<Profile>;
  updateProfile(id: string, data: Record<string, unknown>): Promise<Profile>;
  createIdentity(data: { email: string; password: string; displayName: string }): Promise<{ uid: string }>;
  deleteIdentity(uid: string): Promise<void>;
  authorizeIdentity(uid: string, managedVersion?: number): Promise<void>;
  advanceManagedVersion(id: string, ownerId: string, expected: number): Promise<Profile | null>;
  resetManagedPassword(uid: string, password: string, version: number): Promise<void>;
}
class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
function text(value: unknown, name: string, max = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new HttpError(400, 'Invalid ' + name);
  return value.trim();
}
function profileFields(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Invalid profile');
  const data = value as Record<string, unknown>;
  const fields: Record<string, unknown> = {};
  if (data.full_name !== undefined) fields.full_name = text(data.full_name, 'name');
  if (data.phone !== undefined) {
    if (typeof data.phone !== 'string' || data.phone.length > 40) throw new HttpError(400, 'Invalid phone');
    fields.phone = data.phone.trim();
  }
  return fields;
}
export function createAccountHandler(deps: AccountDependencies) {
  return async (request: Request): Promise<Response> => {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    try {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
      if (request.method !== 'POST') throw new HttpError(405, 'Use POST');
      const token = /^Bearer (\S+)$/i.exec(request.headers.get('authorization') || '')?.[1];
      if (!token) throw new HttpError(401, 'Authentication required');
      const identity = await deps.identity(token);
      if (!identity?.uid || identity.uid.length > 128) throw new HttpError(401, 'Invalid identity');
      if (!identity.email) throw new HttpError(403, 'Account identity is missing');
      if (!identity.emailVerified && !identity.managedVersion) throw new HttpError(403, 'Verify your email before continuing');
      const raw = await request.text();
      if (raw.length > 12000) throw new HttpError(413, 'Request too large');
      let input: Record<string, any>;
      try { input = JSON.parse(raw); } catch { throw new HttpError(400, 'Invalid JSON'); }
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Invalid request');
      let caller = await deps.findProfile(identity.uid);
      if (caller?.managed_login) {
        if (caller.role !== 'member' || !caller.parent_user_id || caller.rizz_id !== identity.email.toLowerCase() ||
            identity.managedVersion !== caller.managed_auth_version) throw new HttpError(401, 'Your sign-in has expired. Please sign in again.');
      } else if (!identity.emailVerified || isRizzId(identity.email)) {
        throw new HttpError(403, 'Rizz IDs must be created by a workspace owner');
      }
      if (input.action === 'sync') {
        if (!caller) {
          // Never attach an existing legacy account by an email supplied by a client.
          try {
            caller = await deps.insertProfile({ firebase_user_id: identity.uid, email: identity.email.toLowerCase(), full_name: identity.name?.trim() || identity.email, role: 'owner', parent_user_id: null, is_active: true });
          } catch (error) {
            // Concurrent first logins may insert the same verified UID once.
            caller = await deps.findProfile(identity.uid);
            if (!caller) throw error;
          }
        }
        if (!caller.is_active) throw new HttpError(403, 'Account is inactive');
        if (caller.parent_user_id) {
          const owner = await deps.getProfile(caller.parent_user_id);
          if (!owner?.is_active || owner.role !== 'owner' || owner.parent_user_id) throw new HttpError(403, 'Workspace is inactive');
        }
        if (caller.managed_login) await deps.authorizeIdentity(identity.uid, caller.managed_auth_version);
        else await deps.authorizeIdentity(identity.uid);
        return Response.json(caller, { headers });
      }
      if (!caller?.is_active) throw new HttpError(403, 'Account is inactive');
      if (caller.parent_user_id) {
        const owner = await deps.getProfile(caller.parent_user_id);
        if (!owner?.is_active || owner.role !== 'owner' || owner.parent_user_id) throw new HttpError(403, 'Workspace is inactive');
      }
      if (input.action === 'updateProfile') return Response.json(await deps.updateProfile(caller.id, profileFields(input.profile)), { headers });
      if (caller.role !== 'owner' || caller.parent_user_id) throw new HttpError(403, 'Only owners can manage team members');
      if (input.action === 'createMember') {
        const fields = profileFields(input.member);
        const managed = input.member?.rizz_id !== undefined;
        let email: string;
        try { email = managed ? normalizeRizzId(text(input.member.rizz_id,'Rizz ID')) : text(input.member?.email, 'email').toLowerCase(); }
        catch (error) { throw error instanceof HttpError ? error : new HttpError(400,(error as Error).message); }
        if (!managed && isRizzId(email)) throw new HttpError(400, 'Use the Rizz ID field to create an owner-managed account');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Invalid email');
        const password = input.member?.password;
        if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new HttpError(400, 'Password must contain 8 to 128 characters');
        if (!fields.full_name) throw new HttpError(400, 'Name is required');
        const firebaseUser = await deps.createIdentity({ email, password, displayName: fields.full_name as string });
        try {
          if (managed) await deps.authorizeIdentity(firebaseUser.uid,1);
          const member = await deps.insertProfile({ ...fields, email, firebase_user_id: firebaseUser.uid, role: 'member', parent_user_id: caller.id, is_active: true,
            ...(managed ? {rizz_id:email,managed_login:true,managed_auth_version:1} : {}) });
          return Response.json(member, { headers, status: 201 });
        } catch (error) {
          // Compensate only the identity created by this request.
          await deps.deleteIdentity(firebaseUser.uid);
          throw error;
        }
      }
      if (input.action === 'resetMemberPassword') {
        const member = await deps.getProfile(text(input.id,'member ID'));
        if (!member || member.role !== 'member' || member.parent_user_id !== caller.id || !member.managed_login || !member.firebase_user_id) throw new HttpError(403,'Only Rizz IDs in your workspace can use owner-managed password resets');
        const password=input.password;
        if (typeof password !== 'string' || password.length<8 || password.length>128) throw new HttpError(400,'Password must contain 8 to 128 characters');
        if (!Number.isInteger(input.expected_version) || input.expected_version !== member.managed_auth_version) throw new HttpError(409,'This member changed. Refresh the list and try again.');
        const updated=await deps.advanceManagedVersion(member.id,caller.id,input.expected_version);
        if (!updated) throw new HttpError(409,'This member changed. Refresh the list and try again.');
        // Advance the database version first: old tokens lose data access immediately.
        // If the identity service fails, the account stays locked until the owner retries.
        await deps.resetManagedPassword(member.firebase_user_id,password,updated.managed_auth_version!);
        return Response.json({success:true}, {headers});
      }
      if (input.action === 'updateMember' || input.action === 'deactivateMember') {
        const id = text(input.id, 'member ID');
        const member = await deps.getProfile(id);
        if (!member || member.role !== 'member' || member.parent_user_id !== caller.id) throw new HttpError(403, 'Member not found in this workspace');
        const fields = input.action === 'deactivateMember' ? { is_active: false } : profileFields(input.member);
        if (input.action === 'updateMember' && input.member?.is_active !== undefined) {
          if (typeof input.member.is_active !== 'boolean') throw new HttpError(400, 'Invalid active status');
          fields.is_active = input.member.is_active;
        }
        return Response.json(await deps.updateProfile(id, fields), { headers });
      }
      throw new HttpError(400, 'Unknown action');
    } catch (error) {
      const duplicate=(error as {code?:string})?.code==='auth/email-already-exists';
      const status = error instanceof HttpError ? error.status : duplicate ? 409 : 500;
      return Response.json({ error: error instanceof HttpError ? error.message : duplicate ? 'This Rizz ID or email is already in use.' : 'Account operation failed. Please retry or contact your workspace owner.' }, { status, headers });
    }
  };
}
