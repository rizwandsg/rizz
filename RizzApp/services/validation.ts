export function parseMoney(value: string, allowZero = false): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error('Enter an amount with at most two decimal places');
  const result = Number(value.trim());
  assertMoney(result, allowZero);
  return result;
}
export function assertMoney(value: unknown, allowZero = false): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (!allowZero && value === 0) || value > 9999999999.99 || Math.abs(value * 100 - Math.round(value * 100)) > 0.0001) throw new Error('Enter a valid amount with at most two decimal places');
}
export function localDate(date: Date): string {
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid date');
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validateDate(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('Invalid date');
}
export function validateWrite(table: string, input: unknown, partial: boolean) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected one record');
  const data = input as Record<string, unknown>;
  if (table === 'projects') {
    if ((!partial || data.name !== undefined) && (typeof data.name !== 'string' || !data.name.trim())) throw new Error('Project name is required');
    if (!partial || data.start_date !== undefined) validateDate(data.start_date);
    if (data.end_date) validateDate(data.end_date);
    if (data.end_date && data.start_date && String(data.end_date) < String(data.start_date)) throw new Error('End date must follow start date');
    if (data.total_project_cost != null) assertMoney(data.total_project_cost, true);
  } else {
    if (!partial || data.amount !== undefined) assertMoney(data.amount);
    const dateField = table === 'expenses' ? 'expense_date' : 'payment_date';
    if (!partial || data[dateField] !== undefined) validateDate(data[dateField]);
    if (!partial && !data.project_id) throw new Error('Project is required');
    if (table === 'expenses' && (!partial || data.description !== undefined) && (typeof data.description !== 'string' || !data.description.trim())) throw new Error('Description is required');
  }
}
