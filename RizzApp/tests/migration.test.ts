import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { expect, it } from 'vitest';
const migration = readFileSync(new URL('../supabase/migrations/202611070001_secure_workspaces.sql', import.meta.url), 'utf8');
async function legacyDatabase(invalid = false) {
  const db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;`);
  const snapshot = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
  const tables = Array.from(snapshot.matchAll(/CREATE TABLE public\.(\w+) \([\s\S]*?\n\);/g));
  for (const name of ['users', 'projects', 'expenses']) {
    await db.exec(tables.find(match => match[1] === name)![0].replaceAll('uuid_generate_v4()', 'gen_random_uuid()'));
  }
  await db.exec('GRANT SELECT(password_hash) ON public.users TO authenticated;');
  await db.exec(`INSERT INTO public.users(id,email,password_hash,full_name) VALUES ('10000000-0000-4000-8000-000000000001','legacy@example.com','retained-legacy-hash','Legacy');
    INSERT INTO public.projects(user_id,name,start_date) VALUES (${invalid ? 'NULL' : "'10000000-0000-4000-8000-000000000001'"},'Existing project','2026-11-07');`);
  return db;
}
it('migrates the checked-in legacy schema without deleting records or exposing hashes', async () => {
  const db = await legacyDatabase();
  try {
    await db.exec(migration);
    expect((await db.query('SELECT * FROM public.projects')).rows).toHaveLength(1);
    expect((await db.query<{ password_hash: string }>('SELECT password_hash FROM public.users')).rows[0].password_hash).toBe('retained-legacy-hash');
    await db.exec(`UPDATE public.users SET clerk_user_id='user_legacy'; SELECT set_config('request.jwt.claims','{"sub":"user_legacy"}',false); SET ROLE authenticated;`);
    expect((await db.query('SELECT id,email FROM public.users')).rows).toHaveLength(1);
    await expect(db.query('SELECT password_hash FROM public.users')).rejects.toThrow();
    expect((await db.query('SELECT * FROM public.projects')).rows).toHaveLength(1);
  } finally { await db.close(); }
});
it('rolls back the entire migration when legacy records are invalid', async () => {
  const db = await legacyDatabase(true);
  try {
    await expect(db.exec(migration)).rejects.toThrow();
    await db.exec('ROLLBACK');
    expect((await db.query('SELECT * FROM public.projects')).rows).toHaveLength(1);
    expect((await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='clerk_user_id'")).rows).toHaveLength(0);
  } finally { await db.close(); }
});
