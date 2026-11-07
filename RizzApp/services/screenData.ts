import type { CustomerPayment } from '../api/customerPaymentsApi';
import type { Expense } from '../api/expensesApi';
import type { Payment } from '../api/paymentsApi';
import type { Project } from '../api/projectsApi';

export interface ReceiptRow {
  id?: string;
  key: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  payment_mode: string;
  received_from?: string;
  notes?: string;
  reference_number?: string;
  editRoute: '/AddPayment' | '/AddCustomerPayment';
}
export function receiptRows(payments: Payment[], customerPayments: CustomerPayment[]): ReceiptRow[] {
  return [
    ...payments.map(row => ({ ...row, key: 'payment:' + row.id, editRoute: '/AddPayment' as const })),
    ...customerPayments.map(row => ({ ...row, key: 'customer:' + row.id, payment_type: 'Customer', payment_mode: row.payment_method, editRoute: '/AddCustomerPayment' as const })),
  ].sort((a, b) => b.payment_date.localeCompare(a.payment_date) || a.key.localeCompare(b.key));
}
export function projectExpenseSummaries(projects: Project[], expenses: Expense[]) {
  return projects.filter(project => project.id).map(project => {
    const rows = expenses.filter(expense => expense.project_id === project.id);
    return {
      projectId: project.id!, projectName: project.name, expenses: rows,
      expenseCount: rows.length,
      totalAmount: rows.reduce((sum, expense) => sum + Math.round(expense.amount * 100), 0) / 100,
      lastExpenseDate: rows.reduce((latest, expense) => expense.expense_date > latest ? expense.expense_date : latest, ''),
    };
  }).filter(row => row.expenseCount > 0).sort((a, b) => b.totalAmount - a.totalAmount);
}
