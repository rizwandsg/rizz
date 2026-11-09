import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { afterEach, expect, it } from 'vitest';
const { prepareCutover } = createRequire(import.meta.url)('../scripts/prepare-cutover.cjs');
const A='10000000-0000-4000-8000-000000000001',M='10000000-0000-4000-8000-000000000002';
let db:PGlite;
async function fixture(){
  db=new PGlite();
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;`);
  await db.exec(readFileSync(new URL('./fixtures/hosted-legacy-schema.sql',import.meta.url),'utf8'));
  await db.exec(`INSERT INTO public.users(id,email,full_name,role,parent_user_id) VALUES ('${A}','a@example.test','Owner','owner',NULL),('${M}','m@example.test','Member','member','${A}');
    INSERT INTO public.projects(user_id,name,start_date,total_project_cost) VALUES ('${M}','Retained member project','2026-11-08',1000);`);
  const snapshot:Record<string,unknown[]>= {};
  for(const table of ['users','projects','expenses','payments','customer_payments','vendor_payments'])snapshot[table]=(await db.query<{row:unknown}>(`SELECT to_jsonb(t) AS row FROM public.${table} t ORDER BY id`)).rows.map(row=>row.row);
  return {snapshot,mappings:[{profileId:A,email:'a@example.test',firebaseId:'firebase-owner',action:'map'},{profileId:M,action:'deactivate'}]};
}
afterEach(async()=>{await db?.close();});
it('executes the exact generated cutover, preserves member records and records all migration versions',async()=>{
  const {snapshot,mappings}=await fixture();await db.exec(prepareCutover(snapshot,mappings,'rizz-test-project'));
  expect((await db.query<{version:number}>('SELECT public.backend_contract_version() AS version')).rows[0].version).toBe(5);
  expect((await db.query<{is_active:boolean}>('SELECT is_active FROM public.users WHERE id=$1',[M])).rows[0].is_active).toBe(false);
  expect((await db.query<{user_id:string}>('SELECT user_id FROM public.projects')).rows[0].user_id).toBe(M);
  expect((await db.query('SELECT version FROM supabase_migrations.schema_migrations ORDER BY version')).rows).toEqual([{version:'202611070001'},{version:'202611080001'},{version:'202611090001'},{version:'202611090002'}]);
});
it('rolls back a stale snapshot before changing schema or access',async()=>{
  const {snapshot,mappings}=await fixture();await db.exec("UPDATE public.projects SET name='New live update'");
  await expect(db.exec(prepareCutover(snapshot,mappings,'rizz-test-project'))).rejects.toThrow('Snapshot changed');
  await db.exec('ROLLBACK');
  expect((await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='firebase_user_id'")).rows).toEqual([]);
  expect((await db.query<{name:string}>('SELECT name FROM public.projects')).rows[0].name).toBe('New live update');
});
it('rejects missing, duplicate and mismatched mappings before emitting SQL',async()=>{
  const {snapshot,mappings}=await fixture();
  expect(()=>prepareCutover(snapshot,[mappings[0]],'rizz-test-project')).toThrow('every existing account');
  expect(()=>prepareCutover(snapshot,[mappings[0],mappings[0]],'rizz-test-project')).toThrow('duplicate profile');
  expect(()=>prepareCutover(snapshot,[{...mappings[0],email:'attacker@example.test'},mappings[1]],'rizz-test-project')).toThrow('email mismatch');
});
