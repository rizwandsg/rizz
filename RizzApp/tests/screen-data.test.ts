import { expect, it } from 'vitest';
import { canManageMembers } from '../services/routePolicy';
import { projectExpenseSummaries, receiptRows } from '../services/screenData';

it('only active workspace owners can reach team management', () => {
  expect(canManageMembers({role:'owner', is_active:true})).toBe(true);
  for (const user of [null, {role:'member', is_active:true}, {role:'owner', is_active:false}, {role:'owner', is_active:true, parent_user_id:'other'}]) expect(canManageMembers(user)).toBe(false);
});
it('shows both receipt sources with independent keys and correct edit destinations', () => {
  const rows = receiptRows([
    {id:'same-id',project_id:'p',amount:100,payment_date:'2026-11-01',payment_type:'Advance',payment_mode:'Cash'},
  ], [
    {id:'same-id',project_id:'p',amount:50.25,payment_date:'2026-11-02',payment_method:'UPI',notes:'Receipt reference'},
  ]);
  expect(rows.map(row => row.editRoute)).toEqual(['/AddCustomerPayment','/AddPayment']);
  expect(new Set(rows.map(row => row.key)).size).toBe(2);
  expect(rows.reduce((sum,row) => sum+row.amount,0)).toBe(150.25);
  expect(rows[0].notes).toBe('Receipt reference');
});
it('expense summaries retain paise and use the latest transaction date, not today', () => {
  const rows = projectExpenseSummaries([{id:'p',name:'Project',start_date:'2026-01-01'},{id:'empty',name:'Empty',start_date:'2026-01-01'}], [
    {id:'a',project_id:'p',amount:0.1,description:'A',expense_date:'2026-10-01'},
    {id:'b',project_id:'p',amount:0.2,description:'B',expense_date:'2026-10-03'},
  ]);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({totalAmount:0.3,expenseCount:2,lastExpenseDate:'2026-10-03'});
});
