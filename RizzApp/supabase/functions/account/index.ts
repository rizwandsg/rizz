import { createClient } from 'npm:@supabase/supabase-js@2.75.1';
import { cert, initializeApp } from 'npm:firebase-admin@13.10.0/app';
import { getAuth } from 'npm:firebase-admin@13.10.0/auth';
import { createAccountHandler } from './handler.ts';

const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
const credential = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON') || '{}');
if (!projectId || credential.project_id !== projectId) throw new Error('Firebase server project is not configured');
const identity = getAuth(initializeApp({ projectId, credential: cert(credential) }));
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const columns = 'id,firebase_user_id,email,full_name,phone,role,parent_user_id,is_active,created_at,updated_at,last_login';
async function result(query: any) { const { data, error } = await query; if (error) throw new Error('Database operation failed'); return data; }
const handler = createAccountHandler({
  async identity(token) {
    try {
      // Firebase Admin pins signature, issuer, audience and checks revoked/disabled accounts.
      const claims = await identity.verifyIdToken(token, true);
      const user = await identity.getUser(claims.uid);
      return { uid: claims.uid, email: user.email || '', emailVerified: claims.email_verified === true && user.emailVerified && claims.email === user.email, name: user.displayName };
    } catch { return null; }
  },
  findProfile: id => result(admin.from('users').select(columns).eq('firebase_user_id', id).maybeSingle()),
  getProfile: id => result(admin.from('users').select(columns).eq('id', id).maybeSingle()),
  insertProfile: data => result(admin.from('users').insert(data).select(columns).single()),
  updateProfile: (id, data) => result(admin.from('users').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select(columns).single()),
  createIdentity: data => identity.createUser({ ...data, emailVerified: false }),
  deleteIdentity: uid => identity.deleteUser(uid),
  async authorizeIdentity(uid) {
    const user = await identity.getUser(uid);
    if (user.customClaims?.role !== 'authenticated') {
      await identity.setCustomUserClaims(uid, { ...user.customClaims, role: 'authenticated' });
    }
  },
});
Deno.serve(handler);
