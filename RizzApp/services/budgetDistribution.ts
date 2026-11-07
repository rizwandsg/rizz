export function budgetDistribution(expenses: { category?: string; amount: number }[], budget: number) {
  const totals = new Map<string, number>();
  for (const expense of expenses) totals.set(expense.category || 'Other', (totals.get(expense.category || 'Other') || 0) + Math.round(expense.amount * 100));
  const spent = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  const budgetCents = Math.round(budget * 100);
  const remaining = Math.max(0, budgetCents - spent);
  if (remaining > 0) totals.set('Unspent Budget', remaining);
  const denominator = Math.max(spent, budgetCents);
  return Array.from(totals, ([name, cents]) => ({ name, amount: cents / 100, percentage: denominator > 0 ? cents / denominator * 100 : 0 })).sort((a, b) => b.amount - a.amount);
}
