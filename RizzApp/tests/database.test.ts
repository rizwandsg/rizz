import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), token: vi.fn() }));
vi.mock('../services/supabaseClient', () => ({ supabase: { from: mocks.from }, requireAccessToken: mocks.token }));
import { database } from '../services/databaseService';
beforeEach(() => { vi.resetAllMocks(); mocks.token.mockResolvedValue('verified-token'); });
function query() {
  const builder: any = {};
  for (const method of ['select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'order', 'insert', 'update', 'delete']) builder[method] = vi.fn(() => builder);
  builder.range = vi.fn(); builder.single = vi.fn(); builder.maybeSingle = vi.fn();
  mocks.from.mockReturnValue(builder);
  return builder;
}
it('loads every page so large financial totals are not silently truncated', async () => {
  const q = query();
  q.range.mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, id) => ({ id })), error: null }).mockResolvedValueOnce({ data: [{ id: 500 }], error: null });
  expect(await database.loadData('expenses', { filter: 'amount.gte.12.50', order: 'expense_date.desc' })).toHaveLength(501);
  expect(q.gte).toHaveBeenCalledWith('amount', '12.50');
  expect(q.range.mock.calls).toEqual([[0,499],[500,999]]);
  expect(q.order).toHaveBeenCalledWith('id', { ascending: true });
});
it('does not send unauthenticated, invalid, or privileged writes', async () => {
  mocks.token.mockRejectedValueOnce(new Error('Sign in'));
  await expect(database.loadData('projects')).rejects.toThrow('Sign in');
  await expect(database.saveData('users', {})).rejects.toThrow();
  await expect(database.saveData('expenses', { amount: Infinity })).rejects.toThrow();
  expect(mocks.from).not.toHaveBeenCalled();
});
it('returns null for missing records and propagates read failures', async () => {
  const q = query();
  q.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
  expect(await database.loadDataById('projects', 'missing')).toBeNull();
  q.range.mockResolvedValue({ data: null, error: { message: 'Network unavailable' } });
  await expect(database.loadData('expenses')).rejects.toThrow('Network unavailable');
});
it('reports failed deletes and never resurrects a missing record during an edit', async () => {
  const q = query();
  q.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows' } });
  await expect(database.deleteData('expenses', 'missing')).rejects.toThrow('No rows');
  await expect(database.upsertData('expenses', { id: 'missing', amount: 50 })).rejects.toThrow('Reload before editing');
  expect(q.update).toHaveBeenCalled(); expect(q.insert).not.toHaveBeenCalled();
});
it('compares the loaded record version and does not write a client timestamp', async () => {
  const q = query();
  q.single.mockResolvedValue({ data: { id: 'expense', amount: 20 }, error: null });
  await database.updateData('expenses', 'expense', { amount: 20, updated_at: '2026-11-07T10:00:00Z' });
  expect(q.eq).toHaveBeenCalledWith('updated_at', '2026-11-07T10:00:00Z');
  expect(q.update).toHaveBeenCalledWith({ amount: 20 });
});
it('recovers an identical insert after a lost response but rejects changed retries', async () => {
  const q = query();
  const data = { id: 'request-id', project_id: 'project', amount: 20, description: 'Materials', expense_date: '2026-11-07' };
  q.single.mockResolvedValue({ error: { code: '23505', message: 'Duplicate' } });
  q.maybeSingle.mockResolvedValue({ data, error: null });
  expect(await database.saveData('expenses', data)).toEqual(data);
  await expect(database.saveData('expenses', { ...data, amount: 30 })).rejects.toThrow('different values');
});
