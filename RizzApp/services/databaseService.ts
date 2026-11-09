import { parseFilters } from './queryFilters';
import { requireAccessToken, supabase } from './supabaseClient';
import { validateWrite } from './validation';

export const TABLES = { PROJECTS: 'projects', EXPENSES: 'expenses', PAYMENTS: 'payments' };
export interface QueryOptions { filter?: string; order?: string; limit?: number }
const PAGE_SIZE = 500;
const USER_COLUMNS = 'id,firebase_user_id,email,rizz_id,managed_login,managed_auth_version,full_name,phone,role,parent_user_id,is_active,created_at,updated_at,last_login';
const readable = new Set(['users', 'projects', 'expenses', 'payments', 'customer_payments', 'vendor_payments', 'project_payment_summary', 'expense_payment_status']);
function assertTable(table: string, write = false) {
  if (!readable.has(table) || (write && (table === 'users' || table.endsWith('_summary') || table.endsWith('_status')))) throw new Error('Unsupported database operation');
}
function failure(error: { message: string; code?: string } | null) {
  if (error) throw new Error(error.code === '42501' ? 'Access denied. Check your workspace permissions.' : error.message);
}
export const database = {
  async loadData<T>(table: string, options?: QueryOptions): Promise<T[]> {
    assertTable(table);
    await requireAccessToken();
    if (options?.limit !== undefined && (!Number.isInteger(options.limit) || options.limit < 1)) throw new Error('Invalid query limit');
    const filters = options?.filter ? parseFilters(options.filter) : [];
    const order = options?.order || (table === 'project_payment_summary' ? 'project_id.asc' : table === 'expense_payment_status' ? 'expense_id.asc' : 'id.asc');
    const match = /^([a-z_][a-z0-9_]*)\.(asc|desc)$/.exec(order);
    if (!match) throw new Error('Invalid query order');
    const results: T[] = [];
    while (true) {
      let query = supabase.from(table).select(table === 'users' ? USER_COLUMNS : '*');
      for (const f of filters) {
        switch (f.operator) {
          case 'eq': query = query.eq(f.column, f.value); break;
          case 'neq': query = query.neq(f.column, f.value); break;
          case 'gt': query = query.gt(f.column, f.value); break;
          case 'gte': query = query.gte(f.column, f.value); break;
          case 'lt': query = query.lt(f.column, f.value); break;
          case 'lte': query = query.lte(f.column, f.value); break;
        }
      }
      query = query.order(match[1], { ascending: match[2] === 'asc' });
      const id = table === 'project_payment_summary' ? 'project_id' : table === 'expense_payment_status' ? 'expense_id' : 'id';
      if (match[1] !== id) query = query.order(id, { ascending: true });
      const count = Math.min(PAGE_SIZE, (options?.limit ?? Infinity) - results.length);
      const { data, error } = await query.range(results.length, results.length + count - 1);
      failure(error);
      const rows = (data ?? []) as T[];
      results.push(...rows);
      if (rows.length < count || results.length === options?.limit) return results;
    }
  },
  async loadDataById<T>(table: string, id: string): Promise<T | null> {
    assertTable(table);
    await requireAccessToken();
    const { data, error } = await supabase.from(table).select(table === 'users' ? USER_COLUMNS : '*').eq('id', id).maybeSingle();
    failure(error);
    return data as T | null;
  },
  async saveData<T>(table: string, data: T): Promise<T> {
    assertTable(table, true);
    await requireAccessToken();
    validateWrite(table, data, false);
    const { data: result, error } = await supabase.from(table).insert(data).select().single();
    if (error?.code === '23505' && (data as { id?: string }).id) {
      const existing = await database.loadDataById<Record<string, unknown>>(table, (data as { id: string }).id);
      if (existing && Object.entries(data as Record<string, unknown>).every(([key, value]) => value === undefined || JSON.stringify(existing[key]) === JSON.stringify(value))) return existing as T;
      throw new Error('This request was already saved with different values. Reload the record before editing.');
    }
    failure(error);
    return result as T;
  },
  async updateData<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    assertTable(table, true);
    await requireAccessToken();
    validateWrite(table, data, true);
    const { updated_at: expectedVersion, ...fields } = data as Record<string, unknown>;
    let query = supabase.from(table).update(fields).eq('id', id);
    if (expectedVersion) query = query.eq('updated_at', expectedVersion);
    const { data: result, error } = await query.select().single();
    if (error?.code === 'PGRST116') throw new Error('Record changed, was removed, or is inaccessible. Reload before editing.');
    failure(error);
    return result as T;
  },
  async upsertData<T>(table: string, data: T): Promise<T> {
    const id = (data as { id?: string }).id;
    return id ? database.updateData<T>(table, id, data) : database.saveData(table, data);
  },
  async deleteData(table: string, id: string): Promise<void> {
    assertTable(table, true);
    await requireAccessToken();
    const { data, error } = await supabase.from(table).delete().eq('id', id).select('id').single();
    failure(error);
    if (!data) throw new Error('Record not found or access denied');
  },
};
