import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// This runs the actual migration and PostgreSQL policies. Claims are simulated;
// Firebase signatures and hosted Supabase transport require staging acceptance.
let db: PGlite;
const uuid = (kind: number, value: number) => `${kind}0000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
const users = {
  ownerA: { id: uuid(1, 1), sub: 'user_owner_a', workspace: 'A' },
  memberA: { id: uuid(1, 2), sub: 'user_member_a', workspace: 'A' },
  ownerB: { id: uuid(1, 3), sub: 'user_owner_b', workspace: 'B' },
  memberB: { id: uuid(1, 4), sub: 'user_member_b', workspace: 'B' },
  inactiveMember: { id: uuid(1, 5), sub: 'user_inactive_member', workspace: 'A' },
  inactiveOwner: { id: uuid(1, 6), sub: 'user_inactive_owner', workspace: 'C' },
  memberOfInactiveOwner: { id: uuid(1, 7), sub: 'user_inactive_workspace_member', workspace: 'C' },
};
const active = [users.ownerA, users.memberA, users.ownerB, users.memberB];
const financialTables = ['projects', 'expenses', 'payments', 'customer_payments', 'vendor_payments'] as const;
type FinancialTable = typeof financialTables[number];
const surfaces = [
  { table: 'users', key: 'id', kind: 1 },
  { table: 'projects', key: 'id', kind: 2 },
  { table: 'expenses', key: 'id', kind: 3 },
  { table: 'payments', key: 'id', kind: 4 },
  { table: 'customer_payments', key: 'id', kind: 5 },
  { table: 'vendor_payments', key: 'id', kind: 6 },
  { table: 'project_payment_summary', key: 'project_id', kind: 2 },
  { table: 'expense_payment_status', key: 'expense_id', kind: 3 },
] as const;

async function asIdentity(sub: string, role: 'anon' | 'authenticated' = 'authenticated', extraClaims: Record<string, unknown> = {}) {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claims', $1, false)", [JSON.stringify({ iss:'https://securetoken.google.com/rizz-simulation', aud:'rizz-simulation', email_verified:true, ...extraClaims, sub, role })]);
  await db.exec(`SET ROLE ${role}`);
}

function record(table: FinancialTable, index: number, creator: string, project = uuid(2, index), expense = uuid(3, index)) {
  const common = { id: uuid(financialTables.indexOf(table) + 2, index), user_id: creator };
  switch (table) {
    case 'projects': return { ...common, name: `Simulation project ${index}`, start_date: '2026-11-07', total_project_cost: 1000 };
    case 'expenses': return { ...common, project_id: project, amount: 100, description: 'Simulation materials', expense_date: '2026-11-07' };
    case 'payments': return { ...common, project_id: project, amount: 50, payment_date: '2026-11-07', payment_type: 'Advance', payment_mode: 'Cash' };
    case 'customer_payments': return { ...common, project_id: project, amount: 100, payment_date: '2026-11-07', payment_method: 'UPI' };
    case 'vendor_payments': return { ...common, project_id: project, expense_id: expense, amount: 40, payment_date: '2026-11-07', payment_method: 'Cash', vendor_name: 'Simulation vendor' };
  }
}

async function insert(table: FinancialTable, data: Record<string, unknown>) {
  const columns = Object.keys(data);
  return db.query<{ id: string }>(`INSERT INTO public.${table}(${columns.join(',')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(',')}) RETURNING id`, Object.values(data));
}

async function visible(surface: typeof surfaces[number]) {
  return (await db.query<Record<string, string>>(`SELECT ${surface.key} FROM public.${surface.table} ORDER BY ${surface.key}`)).rows.map(row => row[surface.key]);
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    GRANT EXECUTE ON FUNCTION auth.jwt() TO authenticated;`);
  await db.exec(readFileSync(new URL('../supabase/migrations/202611070001_secure_workspaces.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/migrations/202611080001_firebase_identity.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/migrations/202611090001_managed_rizz_ids.sql', import.meta.url), 'utf8'));
  await db.exec("INSERT INTO private.identity_configuration(firebase_project_id) VALUES ('rizz-simulation')");
});

beforeEach(async () => {
  await db.exec('RESET ROLE; TRUNCATE public.vendor_payments,public.customer_payments,public.payments,public.expenses,public.projects,public.users CASCADE');
  for (const [key, user] of Object.entries(users)) {
    const owner = key === 'ownerA' || key === 'ownerB' || key === 'inactiveOwner';
    const parent = owner ? null : user.workspace === 'A' ? users.ownerA.id : user.workspace === 'B' ? users.ownerB.id : users.inactiveOwner.id;
    await db.query('INSERT INTO public.users(id,email,full_name,firebase_user_id,role,parent_user_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7)', [user.id, `${key}@example.invalid`, key, user.sub, owner ? 'owner' : 'member', parent, key !== 'inactiveMember' && key !== 'inactiveOwner']);
  }
  // Each workspace has both owner- and member-created projects and entries.
  // Crossed creators prove filtering by the current user would lose real data.
  for (const [offset, owner, member] of [[0, users.ownerA, users.memberA], [2, users.ownerB, users.memberB], [4, users.inactiveOwner, users.memberOfInactiveOwner]] as const) {
    for (let n = 1; n <= 2; n++) {
      const index = offset + n;
      await insert('projects', record('projects', index, n === 1 ? owner.id : member.id));
      for (const table of financialTables.slice(1)) {
        await insert(table, record(table, index, n === 1 ? member.id : owner.id));
      }
    }
  }
});

afterAll(async () => { await db?.close(); });

it.each([
  {iss:'https://regular-gnu-87.clerk.accounts.dev'},
  {iss:'https://securetoken.google.com/foreign-project'},
  {aud:'foreign-project'},
  {email_verified:false},
  {email_verified:'true'},
  {email_verified:null},
])('denies mismatched issuer, audience or unverified email: %j', async claims => {
  await asIdentity(users.ownerA.sub,'authenticated',claims);
  expect(await visible(surfaces[1])).toEqual([]);
  expect(await visible(surfaces[6])).toEqual([]);
});
it('fails closed until the Firebase project is configured', async () => {
  await db.exec('RESET ROLE; DELETE FROM private.identity_configuration');
  try {
    await asIdentity(users.ownerA.sub);
    expect(await visible(surfaces[1])).toEqual([]);
    expect((await db.query<{version:number}>('SELECT public.backend_contract_version() AS version')).rows[0].version).toBe(0);
    await expect(db.exec("INSERT INTO private.identity_configuration(firebase_project_id) VALUES ('foreign-project')")).rejects.toThrow();
  } finally {
    await db.exec("RESET ROLE; INSERT INTO private.identity_configuration(firebase_project_id) VALUES ('rizz-simulation')");
  }
});

describe('role and data visibility matrix', () => {
  it.each(active)('$sub sees every workspace table and view, including teammates’ entries', async (user) => {
    await asIdentity(user.sub);
    const indexes = user.workspace === 'A' ? [1, 2] : [3, 4];
    for (const surface of surfaces) {
      const expected = surface.table === 'users'
        ? (user.workspace === 'A' ? [users.ownerA.id, users.memberA.id, users.inactiveMember.id] : [users.ownerB.id, users.memberB.id])
        : indexes.map(index => uuid(surface.kind, index));
      expect(await visible(surface), `${user.sub}: ${surface.table}`).toEqual(expected);
    }
    const totals = (await db.query<{ total_received: string; total_expenses: string; total_paid_to_vendors: string; outstanding_from_customer: string; outstanding_to_vendors: string; payment_count: number }>('SELECT * FROM public.project_payment_summary ORDER BY project_id')).rows;
    for (const total of totals) {
      expect(Number(total.total_received)).toBe(150);
      expect(Number(total.total_expenses)).toBe(100);
      expect(Number(total.total_paid_to_vendors)).toBe(40);
      expect(Number(total.outstanding_from_customer)).toBe(850);
      expect(Number(total.outstanding_to_vendors)).toBe(60);
      expect(Number(total.payment_count)).toBe(2);
    }
    const statuses = (await db.query<{ payment_status: string; total_paid: string; outstanding_amount: string; payment_progress_percentage: string }>('SELECT * FROM public.expense_payment_status')).rows;
    expect(statuses).toHaveLength(2);
    for (const status of statuses) {
      expect(status.payment_status).toBe('Partial');
      expect(Number(status.total_paid)).toBe(40);
      expect(Number(status.outstanding_amount)).toBe(60);
      expect(Number(status.payment_progress_percentage)).toBe(40);
    }
  });

  it.each([
    { sub: 'user_unmapped' },
    { sub: '' },
    users.inactiveMember,
    users.inactiveOwner,
    users.memberOfInactiveOwner,
  ])('$sub cannot read data or write financial records', async (user) => {
    await asIdentity(user.sub, 'authenticated', { workspace_id: users.ownerA.id, user_id: users.ownerA.id });
    for (const surface of surfaces) expect(await visible(surface), surface.table).toEqual([]);
    for (const table of financialTables) {
      expect((await db.query(`UPDATE public.${table} SET updated_at=now() RETURNING id`)).rows).toEqual([]);
      expect((await db.query(`DELETE FROM public.${table} RETURNING id`)).rows).toEqual([]);
      await expect(insert(table, record(table, 90, users.ownerA.id, uuid(2, 1), uuid(3, 1)))).rejects.toThrow();
    }
  });

  it('denies anonymous access even when claims contain a valid owner subject', async () => {
    await asIdentity(users.ownerA.sub, 'anon');
    for (const surface of surfaces) await expect(visible(surface)).rejects.toThrow('permission denied');
    for (const table of financialTables) {
      await expect(insert(table, record(table, 90, users.ownerA.id, uuid(2, 1), uuid(3, 1)))).rejects.toThrow('permission denied');
      await expect(db.query(`UPDATE public.${table} SET updated_at=now()`)).rejects.toThrow('permission denied');
      await expect(db.query(`DELETE FROM public.${table}`)).rejects.toThrow('permission denied');
    }
    await expect(db.query('SELECT public.request_identity()')).rejects.toThrow('permission denied');
    expect((await db.query<{ version: number }>('SELECT public.backend_contract_version() AS version')).rows[0].version).toBe(4);
  });

  it.each(active)('$sub cannot inspect or mutate another workspace using known record IDs', async (user) => {
    await asIdentity(user.sub);
    const other = user.workspace === 'A' ? 3 : 1;
    for (const surface of surfaces) {
      const id = surface.table === 'users' ? (user.workspace === 'A' ? users.ownerB.id : users.ownerA.id) : uuid(surface.kind, other);
      expect((await db.query(`SELECT ${surface.key} FROM public.${surface.table} WHERE ${surface.key}=$1`, [id])).rows).toEqual([]);
    }
    for (const table of financialTables) {
      const id = uuid(financialTables.indexOf(table) + 2, other);
      expect((await db.query(`UPDATE public.${table} SET updated_at=now() WHERE id=$1 RETURNING id`, [id])).rows).toEqual([]);
      expect((await db.query(`DELETE FROM public.${table} WHERE id=$1 RETURNING id`, [id])).rows).toEqual([]);
      if (table !== 'projects') {
        await expect(insert(table, record(table, 90, user.id, uuid(2, other), uuid(3, other)))).rejects.toThrow();
        const ownId = uuid(financialTables.indexOf(table) + 2, user.workspace === 'A' ? 1 : 3);
        await expect(db.query(`UPDATE public.${table} SET project_id=$1 WHERE id=$2`, [uuid(2, other), ownId])).rejects.toThrow();
      }
    }
  });

  it.each(active)('$sub cannot modify profiles or grant itself owner privileges through SQL', async (user) => {
    await asIdentity(user.sub);
    await expect(db.query("UPDATE public.users SET role='owner',parent_user_id=null WHERE id=$1", [user.id])).rejects.toThrow('permission denied');
    await expect(db.query('DELETE FROM public.users WHERE id=$1', [user.id])).rejects.toThrow('permission denied');
    await expect(db.query("INSERT INTO public.users(email,full_name) VALUES ('intruder@example.invalid','Intruder')")).rejects.toThrow('permission denied');
    for (const surface of surfaces.filter(value => value.table.endsWith('summary') || value.table.endsWith('status'))) {
      await expect(db.query(`DELETE FROM public.${surface.table}`)).rejects.toThrow();
    }
  });
});

describe('complete financial workflow by role', () => {
  it.each(active)('$sub creates, reads, edits, reconciles, and safely deletes a complete project', async (user) => {
    const index = 90;
    const project = uuid(2, index);
    const expense = uuid(3, index);
    await asIdentity(user.sub);
    for (const table of financialTables) {
      expect((await insert(table, record(table, index, user.id))).rows).toEqual([{ id: uuid(financialTables.indexOf(table) + 2, index) }]);
    }
    // The teammate must see the complete transaction immediately, regardless of creator.
    const teammate = user.workspace === 'A' ? (user.id === users.ownerA.id ? users.memberA : users.ownerA) : (user.id === users.ownerB.id ? users.memberB : users.ownerB);
    await asIdentity(teammate.sub);
    for (const table of financialTables) {
      const rows = (await db.query<{ user_id: string }>(`SELECT user_id FROM public.${table} WHERE id=$1`, [uuid(financialTables.indexOf(table) + 2, index)])).rows;
      expect(rows).toEqual([{ user_id: user.id }]);
    }
    await db.query('UPDATE public.projects SET name=$1,total_project_cost=1500 WHERE id=$2', ['Revised collaborative project', project]);
    await db.query('UPDATE public.expenses SET amount=120 WHERE id=$1', [expense]);
    await db.query('UPDATE public.payments SET amount=70 WHERE id=$1', [uuid(4, index)]);
    await db.query('UPDATE public.customer_payments SET amount=130 WHERE id=$1', [uuid(5, index)]);
    await db.query('UPDATE public.vendor_payments SET amount=60 WHERE id=$1', [uuid(6, index)]);
    const total = (await db.query<{ total_received: string; total_expenses: string; total_paid_to_vendors: string; outstanding_from_customer: string; outstanding_to_vendors: string }>('SELECT * FROM public.project_payment_summary WHERE project_id=$1', [project])).rows[0];
    expect(Number(total.total_received)).toBe(200);
    expect(Number(total.total_expenses)).toBe(120);
    expect(Number(total.total_paid_to_vendors)).toBe(60);
    expect(Number(total.outstanding_from_customer)).toBe(1300);
    expect(Number(total.outstanding_to_vendors)).toBe(60);
    await expect(db.query('DELETE FROM public.projects WHERE id=$1', [project])).rejects.toThrow();
    await expect(db.query('DELETE FROM public.expenses WHERE id=$1', [expense])).rejects.toThrow();
    for (const table of [...financialTables].reverse()) {
      expect((await db.query(`DELETE FROM public.${table} WHERE id=$1 RETURNING id`, [uuid(financialTables.indexOf(table) + 2, index)])).rows).toHaveLength(1);
    }
    expect((await db.query('SELECT * FROM public.project_payment_summary WHERE project_id=$1', [project])).rows).toEqual([]);
    expect((await db.query('SELECT * FROM public.expense_payment_status WHERE expense_id=$1', [expense])).rows).toEqual([]);
  });

  it.each([users.ownerA, users.memberA])('$sub cannot forge or rewrite financial record identity', async (user) => {
    await asIdentity(user.sub);
    const forgedCreator = user.id === users.ownerA.id ? users.memberA.id : users.ownerA.id;
    for (const table of financialTables) {
      await expect(insert(table, record(table, 90, forgedCreator, uuid(2, 1), uuid(3, 1)))).rejects.toThrow('Invalid creator');
      const id = uuid(financialTables.indexOf(table) + 2, 1);
      const original = (await db.query<{ user_id: string }>(`SELECT user_id FROM public.${table} WHERE id=$1`, [id])).rows[0].user_id;
      await expect(db.query(`UPDATE public.${table} SET user_id=$1 WHERE id=$2`, [original === users.ownerA.id ? users.memberA.id : users.ownerA.id, id])).rejects.toThrow('identity is immutable');
      await expect(db.query(`UPDATE public.${table} SET id=$1 WHERE id=$2`, [uuid(financialTables.indexOf(table) + 2, 91), id])).rejects.toThrow('identity is immutable');
      await expect(db.query(`UPDATE public.${table} SET created_at='2000-01-01' WHERE id=$1`, [id])).rejects.toThrow('identity is immutable');
    }
  });

  it('member deactivation removes access while preserving their records and workspace totals', async () => {
    await db.query('UPDATE public.users SET is_active=false WHERE id=$1', [users.memberA.id]);
    await asIdentity(users.memberA.sub);
    for (const surface of surfaces) expect(await visible(surface)).toEqual([]);
    await asIdentity(users.ownerA.sub);
    expect((await db.query('SELECT id FROM public.projects WHERE user_id=$1', [users.memberA.id])).rows).toEqual([{ id: uuid(2, 2) }]);
    expect((await db.query('SELECT id FROM public.expenses WHERE user_id=$1', [users.memberA.id])).rows).toEqual([{ id: uuid(3, 1) }]);
    expect((await db.query<{ total: string }>('SELECT sum(total_received) AS total FROM public.project_payment_summary')).rows[0].total).toBe('300');
    // Reactivation restores access without changing IDs or duplicating financial records.
    await db.exec('RESET ROLE');
    await db.query('UPDATE public.users SET is_active=true WHERE id=$1', [users.memberA.id]);
    await asIdentity(users.memberA.sub);
    expect(await visible(surfaces[1])).toEqual([uuid(2, 1), uuid(2, 2)]);
  });

  it('deactivating an owner revokes the entire workspace without affecting the other workspace', async () => {
    await db.query('UPDATE public.users SET is_active=false WHERE id=$1', [users.ownerA.id]);
    for (const user of [users.ownerA, users.memberA]) {
      await asIdentity(user.sub);
      for (const surface of surfaces) expect(await visible(surface)).toEqual([]);
    }
    for (const user of [users.ownerB, users.memberB]) {
      await asIdentity(user.sub);
      expect(await visible(surfaces[1])).toEqual([uuid(2, 3), uuid(2, 4)]);
      expect((await db.query<{ total: string }>('SELECT sum(total_received) AS total FROM public.project_payment_summary')).rows[0].total).toBe('300');
    }
  });
});
