import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { afterAll, beforeAll, expect, it } from 'vitest';
let db: PGlite;
const A = '10000000-0000-4000-8000-000000000001';
const B = '10000000-0000-4000-8000-000000000002';
const M = '10000000-0000-4000-8000-000000000003';
const PA = '20000000-0000-4000-8000-000000000001';
const PB = '20000000-0000-4000-8000-000000000002';
const EA = '30000000-0000-4000-8000-000000000001';
const EB = '30000000-0000-4000-8000-000000000002';
async function asUser(sub: string, role = 'authenticated') {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub, role })]);
  await db.exec('SET ROLE ' + role);
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    GRANT EXECUTE ON FUNCTION auth.jwt() TO authenticated;`);
  await db.exec(readFileSync(new URL('../supabase/migrations/202611070001_secure_workspaces.sql', import.meta.url), 'utf8'));
  await db.exec(`INSERT INTO public.users(id,email,full_name,clerk_user_id,role,parent_user_id) VALUES
    ('${A}','a@example.com','A','user_a','owner',null),('${B}','b@example.com','B','user_b','owner',null),('${M}','member@example.com','Member','user_member','member','${A}');
    INSERT INTO public.projects(id,user_id,name,start_date,total_project_cost) VALUES ('${PA}','${A}','A project','2026-11-07',1000),('${PB}','${B}','B project','2026-11-07',1000);
    INSERT INTO public.expenses(id,user_id,project_id,amount,description,expense_date) VALUES ('${EA}','${A}','${PA}',100,'A expense','2026-11-07'),('${EB}','${B}','${PB}',100,'B expense','2026-11-07');`);
});
afterAll(async () => { await db?.close(); });
it('denies anonymous access and keeps two owners isolated across tables and summaries', async () => {
  await asUser('', 'anon');
  await expect(db.query('SELECT * FROM public.projects')).rejects.toThrow();
  await asUser('user_a');
  expect((await db.query<{ id: string }>('SELECT id FROM public.projects')).rows.map(row => row.id)).toEqual([PA]);
  expect((await db.query<{ project_id: string }>('SELECT * FROM public.project_payment_summary')).rows.map(row => row.project_id)).toEqual([PA]);
  expect((await db.query('SELECT * FROM public.expense_payment_status')).rows).toHaveLength(1);
  expect((await db.query(`UPDATE public.projects SET name='stolen' WHERE id='${PB}' RETURNING id`)).rows).toHaveLength(0);
  expect((await db.query(`DELETE FROM public.expenses WHERE id='${EB}' RETURNING id`)).rows).toHaveLength(0);
  await expect(db.exec(`INSERT INTO public.customer_payments(project_id,user_id,amount,payment_date,payment_method) VALUES ('${PB}','${A}',10,'2026-11-07','Cash')`)).rejects.toThrow();
});
it('lets active members share workspace data without changing roles or forging creators', async () => {
  await asUser('user_member');
  expect((await db.query('SELECT * FROM public.expenses')).rows).toHaveLength(1);
  expect((await db.query('SELECT id,role FROM public.users')).rows).toHaveLength(2);
  await expect(db.exec(`UPDATE public.users SET role='owner',parent_user_id=null WHERE id='${M}'`)).rejects.toThrow();
  await expect(db.exec(`INSERT INTO public.projects(user_id,name,start_date) VALUES ('${A}','Forged','2026-11-07')`)).rejects.toThrow();
  await expect(db.exec(`UPDATE public.projects SET user_id='${M}' WHERE id='${PA}'`)).rejects.toThrow();
});
it('enforces payment/expense relationships, paise precision, balances, and safe deletion', async () => {
  await asUser('user_a');
  await expect(db.exec(`INSERT INTO public.vendor_payments(expense_id,project_id,user_id,amount,payment_date,payment_method,vendor_name) VALUES ('${EB}','${PA}','${A}',10,'2026-11-07','Cash','Vendor')`)).rejects.toThrow();
  for (const amount of ['-1','0','1.001',"'NaN'::numeric"]) {
    await expect(db.exec(`INSERT INTO public.customer_payments(project_id,user_id,amount,payment_date,payment_method) VALUES ('${PA}','${A}',${amount},'2026-11-07','Cash')`)).rejects.toThrow();
  }
  await db.exec(`INSERT INTO public.vendor_payments(expense_id,project_id,user_id,amount,payment_date,payment_method,vendor_name) VALUES ('${EA}','${PA}','${A}',60,'2026-11-07','Cash','Vendor')`);
  await expect(db.exec(`INSERT INTO public.vendor_payments(expense_id,project_id,user_id,amount,payment_date,payment_method,vendor_name) VALUES ('${EA}','${PA}','${A}',50,'2026-11-07','Cash','Vendor')`)).rejects.toThrow('outstanding');
  await expect(db.exec(`UPDATE public.expenses SET amount=50 WHERE id='${EA}'`)).rejects.toThrow('below payments');
  await expect(db.exec(`DELETE FROM public.projects WHERE id='${PA}'`)).rejects.toThrow();
  await db.exec(`INSERT INTO public.customer_payments(project_id,user_id,amount,payment_date,payment_method) VALUES ('${PA}','${A}',100,'2026-11-07','Cash');
    INSERT INTO public.payments(project_id,user_id,amount,payment_date,payment_type,payment_mode) VALUES ('${PA}','${A}',50,'2026-11-07','Advance','Cash');`);
  const summary = (await db.query<{ total_received: string; total_expenses: string; outstanding_to_vendors: string }>('SELECT * FROM public.project_payment_summary')).rows[0];
  expect(Number(summary.total_received)).toBe(150); expect(Number(summary.total_expenses)).toBe(100); expect(Number(summary.outstanding_to_vendors)).toBe(40);
});
it('revokes a deactivated member and an inactive workspace immediately', async () => {
  await db.exec(`RESET ROLE; UPDATE public.users SET is_active=false WHERE id='${M}'`);
  await asUser('user_member');
  expect((await db.query('SELECT * FROM public.projects')).rows).toHaveLength(0);
  await db.exec(`RESET ROLE; UPDATE public.users SET is_active=true WHERE id='${M}'; UPDATE public.users SET is_active=false WHERE id='${A}'`);
  await asUser('user_member');
  expect((await db.query('SELECT * FROM public.expenses')).rows).toHaveLength(0);
  await asUser('user_b');
  expect((await db.query<{ id: string }>('SELECT id FROM public.projects')).rows.map(row => row.id)).toEqual([PB]);
});
