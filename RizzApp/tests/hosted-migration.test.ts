import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';

const fixture = readFileSync(new URL('./fixtures/hosted-legacy-schema.sql', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/202611070001_secure_workspaces.sql', import.meta.url), 'utf8');
const A = '10000000-0000-4000-8000-000000000001';
const B = '10000000-0000-4000-8000-000000000002';
const M = '10000000-0000-4000-8000-000000000003';
const PA = '20000000-0000-4000-8000-000000000001';
const PB = '20000000-0000-4000-8000-000000000002';
const EA = '30000000-0000-4000-8000-000000000001';
const EB = '30000000-0000-4000-8000-000000000002';
const tables = ['users', 'projects', 'expenses', 'payments', 'customer_payments', 'vendor_payments'];
let db: PGlite;

async function legacyDatabase() {
  const database = new PGlite();
  await database.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;`);
  await database.exec(fixture);
  return database;
}

async function asUser(sub: string, role = 'authenticated') {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub })]);
  await db.exec('SET ROLE ' + role);
}

beforeAll(async () => {
  db = await legacyDatabase();
  await db.exec(`INSERT INTO public.users(id,email,full_name,clerk_user_id,role,parent_user_id,password_hash) VALUES
    ('${A}','a@example.com','Owner A','user_a','owner',null,'synthetic-hash'),
    ('${B}','b@example.com','Owner B','user_b','owner',null,null),
    ('${M}','m@example.com','Member A','user_m','member','${A}',null);
    INSERT INTO public.projects(id,user_id,name,start_date,total_project_cost,scope_of_work) VALUES
    ('${PA}','${A}','A project','2026-11-07',1000,ARRAY['Painting Work']),('${PB}','${B}','B project','2026-11-07',2000,ARRAY['Painting Work']);
    INSERT INTO public.expenses(id,user_id,project_id,amount,description,expense_date,scope_of_work,vendor_name,payment_method) VALUES
    ('${EA}','${M}','${PA}',100,'A expense','2026-11-07','Painting Work','A vendor','Cash'),
    ('${EB}','${B}','${PB}',900,'B expense','2026-11-07','Painting Work','B vendor','Cash');
    INSERT INTO public.payments(user_id,project_id,amount,payment_date,payment_type,payment_mode) VALUES ('${A}','${PA}',200,'2026-11-07','Advance','Cash');
    INSERT INTO public.customer_payments(user_id,project_id,amount,payment_date,payment_method) VALUES ('${M}','${PA}',100,'2026-11-07','Cash');
    INSERT INTO public.vendor_payments(user_id,project_id,expense_id,amount,payment_date,payment_method,vendor_name) VALUES ('${M}','${PA}','${EA}',40,'2026-11-07','Cash','A vendor');
    CREATE SCHEMA reports; GRANT USAGE ON SCHEMA reports TO anon,authenticated;
    CREATE VIEW reports.nested_expenses AS SELECT * FROM public.expense_by_scope;
    GRANT SELECT ON reports.nested_expenses TO PUBLIC,authenticated;
    GRANT SELECT(project_id) ON reports.nested_expenses TO anon;`);
  await db.exec(migration);
});

afterAll(async () => { await db?.close(); });

it('upgrades the hosted schema without dropping accounts or financial records', async () => {
  await db.exec('RESET ROLE');
  const counts = [];
  for (const table of tables) counts.push(Number((await db.query<{ count: number }>(`SELECT count(*) FROM public.${table}`)).rows[0].count));
  expect(counts).toEqual([3, 2, 2, 1, 1, 1]);
  expect((await db.query<{ password_hash: string }>('SELECT password_hash FROM public.users WHERE id=$1', [A])).rows[0].password_hash).toBe('synthetic-hash');
  expect((await db.query('SELECT public.backend_contract_version() AS version')).rows).toEqual([{ version: 2 }]);
  await expect(db.exec(`INSERT INTO public.users(email,full_name,role,parent_user_id) VALUES ('invalid@example.com','Invalid','owner','${A}')`)).rejects.toThrow();
});

it('replaces reviewed cascade links and adds the missing payment creator foreign key', async () => {
  await db.exec('RESET ROLE');
  expect((await db.query("SELECT conname FROM pg_constraint WHERE connamespace='public'::regnamespace AND contype='f' AND confdeltype='c'")).rows).toEqual([]);
  for (const statement of [`DELETE FROM public.users WHERE id='${A}'`, `DELETE FROM public.projects WHERE id='${PA}'`, `DELETE FROM public.expenses WHERE id='${EA}'`]) {
    await expect(db.exec(statement)).rejects.toThrow();
  }
  await expect(db.exec(`INSERT INTO public.payments(user_id,project_id,amount,payment_date,payment_type,payment_mode) VALUES ('10000000-0000-4000-8000-000000000099','${PA}',1,'2026-11-07','Advance','Cash')`)).rejects.toThrow();
});

it('denies anonymous reads through every legacy report and its nested view', async () => {
  await db.exec('RESET ROLE');
  const views = (await db.query<{ schema: string; name: string }>("SELECT schemaname AS schema,viewname AS name FROM pg_views WHERE schemaname IN ('public','reports')")).rows;
  expect(views).toHaveLength(11);
  await asUser('', 'anon');
  for (const view of views) await expect(db.query(`SELECT * FROM ${view.schema}.${view.name}`)).rejects.toThrow();
  await expect(db.query('SELECT project_id FROM reports.nested_expenses')).rejects.toThrow();
});

it('shows owner and member totals through legacy reports while isolating the other workspace', async () => {
  for (const subject of ['user_a', 'user_m']) {
    await asUser(subject);
    expect((await db.query<{ id: string }>('SELECT id FROM public.users_with_parent ORDER BY id')).rows.map(row => row.id)).toEqual([A, M]);
    expect((await db.query<{ owner_id: string }>('SELECT owner_id FROM public.user_team_summary')).rows.map(row => row.owner_id)).toEqual([A]);
    for (const view of ['expense_by_scope', 'project_scope_budget', 'payments_with_project', 'project_payment_summary', 'expense_payment_status', 'payment_timeline']) {
      const rows = (await db.query<{ project_id: string }>(`SELECT project_id FROM public.${view}`)).rows;
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every(row => row.project_id === PA)).toBe(true);
    }
    for (const view of ['expenses_by_vendor', 'expenses_by_payment_method']) {
      expect((await db.query<{ total_amount: string }>(`SELECT total_amount FROM public.${view}`)).rows).toEqual([{ total_amount: '100.00' }]);
    }
    expect((await db.query<{ project_id: string }>('SELECT project_id FROM reports.nested_expenses')).rows).toEqual([{ project_id: PA }]);
    expect((await db.query<{ total_received: string }>('SELECT total_received FROM public.project_payment_summary')).rows).toEqual([{ total_received: '300.00' }]);
    await expect(db.query('SELECT password_hash FROM public.users')).rejects.toThrow();
  }
  await asUser('user_b');
  expect((await db.query<{ project_id: string }>('SELECT project_id FROM public.project_payment_summary')).rows).toEqual([{ project_id: PB }]);
});

it('rolls back when an unreviewed cascading relationship is present', async () => {
  const other = await legacyDatabase();
  try {
    await other.exec('ALTER TABLE public.expenses ADD COLUMN reviewer_id uuid REFERENCES public.users(id) ON DELETE CASCADE');
    await expect(other.exec(migration)).rejects.toThrow('cascading');
    await other.exec('ROLLBACK');
    expect((await other.query("SELECT to_regprocedure('public.backend_contract_version()') AS function")).rows).toEqual([{ function: null }]);
    expect((await other.query("SELECT conname FROM pg_constraint WHERE conname='projects_user_id_fkey' AND confdeltype='c'")).rows).toHaveLength(1);
  } finally { await other.close(); }
});

it('refuses a materialized report that cannot enforce workspace row security', async () => {
  const other = await legacyDatabase();
  try {
    await other.exec('CREATE MATERIALIZED VIEW public.cached_projects AS SELECT * FROM public.projects; GRANT SELECT ON public.cached_projects TO anon');
    await expect(other.exec(migration)).rejects.toThrow('materialized');
    await other.exec('ROLLBACK');
    expect((await other.query("SELECT to_regprocedure('public.backend_contract_version()') AS function")).rows).toEqual([{ function: null }]);
  } finally { await other.close(); }
});

it('rolls back when a legacy payment refers to a missing creator', async () => {
  const other = await legacyDatabase();
  try {
    await other.exec(`INSERT INTO public.users(id,email,full_name) VALUES ('${A}','a@example.com','A');
      INSERT INTO public.projects(id,user_id,name,start_date) VALUES ('${PA}','${A}','A project','2026-11-07');
      INSERT INTO public.payments(user_id,project_id,amount,payment_date,payment_type,payment_mode)
      VALUES ('${B}','${PA}',100,'2026-11-07','Advance','Cash');`);
    await expect(other.exec(migration)).rejects.toThrow('payments_user_id_workspace_fkey');
    await other.exec('ROLLBACK');
    expect((await other.query('SELECT count(*)::integer AS count FROM public.payments')).rows).toEqual([{ count: 1 }]);
    expect((await other.query("SELECT to_regprocedure('public.backend_contract_version()') AS function")).rows).toEqual([{ function: null }]);
  } finally { await other.close(); }
});
