import { createClient } from 'npm:@supabase/supabase-js@2.75.1';
import { createAccountHandler } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const columns = 'id,clerk_user_id,email,full_name,phone,role,parent_user_id,is_active,created_at,updated_at,last_login';
async function result(query: any) { const { data, error } = await query; if (error) throw new Error('Database operation failed'); return data; }
const handler = createAccountHandler({
  async identity(token) {
    // The Supabase gateway verifies issuer/signature using the configured Clerk integration.
    const caller = createClient(url, anonKey, { accessToken: async () => token });
    const { data, error } = await caller.rpc('request_identity');
    return error ? null : data;
  },
  findProfile: id => result(admin.from('users').select(columns).eq('clerk_user_id', id).maybeSingle()),
  getProfile: id => result(admin.from('users').select(columns).eq('id', id).maybeSingle()),
  insertProfile: data => result(admin.from('users').insert(data).select(columns).single()),
  updateProfile: (id, data) => result(admin.from('users').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select(columns).single()),
  async clerk(path, method = 'GET', body) {
    const response = await fetch('https://api.clerk.com/v1' + path, { method, headers: { Authorization: 'Bearer ' + Deno.env.get('CLERK_SECRET_KEY'), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw new Error('Identity operation failed');
    return response.status === 204 ? null : response.json();
  },
});
Deno.serve(handler);
