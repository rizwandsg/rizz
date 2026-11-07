import { act } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanupScreens, expense, project, refocus, renderScreen, resetSimulation, screenText, sim } from './simulation/harness';

beforeEach(() => { resetSimulation(); vi.spyOn(console, 'log').mockImplementation(() => {}); });
afterEach(async () => { await cleanupScreens(); vi.restoreAllMocks(); });

for (const [name, load, method, original, next] of [
  ['Project details', () => import('../app/ProjectDetails'), 'getProjectById', project, {...project,id:'next-project',name:'Next selected project'}],
  ['Project analytics', () => import('../app/ProjectAnalytics'), 'getProjectById', project, {...project,id:'next-project',name:'Next selected project'}],
  ['Individual analytics', () => import('../app/IndividualProjectAnalytics'), 'getProjectById', project, {...project,id:'next-project',name:'Next selected project'}],
  ['Expense details', () => import('../app/ExpenseDetails'), 'getExpenseById', expense, {...expense,id:'next-expense',description:'Next selected expense'}],
] as const) it(name + ' ignores a late response for the previous route ID', async () => {
  let resolvePrevious!: (value: any) => void;
  sim.api[method].mockImplementationOnce(() => new Promise(resolve => { resolvePrevious = resolve; })).mockResolvedValue(next);
  sim.params = {id:original.id};
  const Component = (await load()).default;
  const tree = await renderScreen(Component);
  sim.params = {id:next.id};
  await refocus(tree, Component);
  const expected = 'name' in next ? next.name : next.description;
  expect(screenText(tree)).toContain(expected);
  await act(async () => { resolvePrevious(original); });
  expect(screenText(tree)).toContain(expected);
  if ('description' in original) expect(screenText(tree)).not.toContain(original.description);
  else expect(screenText(tree)).not.toContain(original.name);
});
