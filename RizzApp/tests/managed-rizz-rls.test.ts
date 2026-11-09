import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,it,expect} from 'vitest';
import {normalizeRizzId} from '../services/rizzId';
let db:PGlite;
const A='10000000-0000-4000-8000-000000000001',M='10000000-0000-4000-8000-000000000002';
beforeAll(async()=>{
 db=new PGlite();await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;`);
 for(const file of ['202611070001_secure_workspaces.sql','202611080001_firebase_identity.sql','202611090001_managed_rizz_ids.sql'])await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
 await db.exec(`INSERT INTO private.identity_configuration(firebase_project_id) VALUES ('rizz-simulation');
 INSERT INTO public.users(id,email,full_name,firebase_user_id,role,parent_user_id,rizz_id,managed_login,managed_auth_version) VALUES
 ('${A}','owner@example.test','Owner','owner','owner',NULL,NULL,false,0),
 ('${M}','fuwad@rizz.com','Fuwad','member','member','${A}','fuwad@rizz.com',true,1);
 INSERT INTO public.projects(user_id,name,start_date,total_project_cost) VALUES('${A}','Visible owner data','2026-11-09',1000);`);
});
afterAll(async()=>{await db?.close();});
async function visible(extra:Record<string,unknown>){
 await db.exec('RESET ROLE');await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:'member',role:'authenticated',iss:'https://securetoken.google.com/rizz-simulation',aud:'rizz-simulation',email_verified:false,email:'fuwad@rizz.com',rizz_managed:true,rizz_auth_version:1,...extra})]);await db.exec('SET ROLE authenticated');
 return (await db.query('SELECT id FROM public.projects')).rows.length;
}
it('allows an owner-provisioned Rizz ID without pretending its email is verified',async()=>{expect(await visible({})).toBe(1);});
it.each([{rizz_managed:false},{rizz_managed:'true'},{rizz_auth_version:'1'},{rizz_auth_version:2},{email:'other@rizz.com'},{aud:'other-project'},{iss:'https://securetoken.google.com/other'}])('denies forged or stale managed claims %j',async claims=>{expect(await visible(claims)).toBe(0);});
it('prevents client changes to the account version and immediately revokes existing JWT access on reset',async()=>{
 await visible({});await expect(db.exec(`UPDATE public.users SET managed_auth_version=2 WHERE id='${M}'`)).rejects.toThrow();
 await db.exec(`RESET ROLE;UPDATE public.users SET managed_auth_version=2 WHERE id='${M}'`);
 expect(await visible({})).toBe(0);expect(await visible({rizz_auth_version:2})).toBe(1);
 await db.exec(`RESET ROLE;UPDATE public.users SET managed_auth_version=1 WHERE id='${M}'`);
});
it('requires the workspace owner to remain active',async()=>{
 await db.exec(`RESET ROLE;UPDATE public.users SET is_active=false WHERE id='${A}'`);expect(await visible({})).toBe(0);
 await db.exec(`RESET ROLE;UPDATE public.users SET is_active=true WHERE id='${A}'`);
});
it.each(['','ab','a..b','one@else.com','bad space','../private','x'.repeat(41)])('rejects invalid Rizz ID %j',id=>{expect(()=>normalizeRizzId(id)).toThrow();});
it('normalizes the optional fixed suffix without accepting a different domain',()=>{expect(normalizeRizzId(' FuWad@Rizz.com ')).toBe('fuwad@rizz.com');});
