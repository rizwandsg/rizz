import { expect, it } from 'vitest';
import { budgetDistribution } from '../services/budgetDistribution';
it('shows spending and unspent budget as one consistent whole', () => {
  const rows = budgetDistribution([{ category: 'Labor', amount: 30 }, { category: 'Materials', amount: 20 }], 100);
  expect(rows.find(row => row.name === 'Unspent Budget')?.amount).toBe(50);
  expect(rows.reduce((sum, row) => sum + row.percentage, 0)).toBe(100);
});
it('handles overspending, unset budgets, and paise without invented values', () => {
  expect(budgetDistribution([{ amount: .1 }, { amount: .2 }], 0)).toEqual([{ name: 'Other', amount: .3, percentage: 100 }]);
  expect(budgetDistribution([{ amount: 120 }], 100)).toEqual([{ name: 'Other', amount: 120, percentage: 100 }]);
  expect(budgetDistribution([],0)).toEqual([]);
});
