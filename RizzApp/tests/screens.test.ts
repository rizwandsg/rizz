import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupScreens, expense, member, pressText, project, refocus, renderScreen, resetSimulation, screenText, sim } from './simulation/harness';

const businessScreens = [
  ['Projects', () => import('../app/(tabs)/home'), {}, 'Workspace A Renovation'],
  ['Expenses', () => import('../app/(tabs)/expense'), {}, 'Workspace A Renovation'],
  ['Analytics', () => import('../app/(tabs)/analytics'), {}, 'Analytics'],
  ['Profile', () => import('../app/(tabs)/profile'), {}, '@example.test'],
  ['Project details', () => import('../app/ProjectDetails'), {id: project.id}, 'Workspace A Renovation'],
  ['Expense details', () => import('../app/ExpenseDetails'), {id: expense.id}, 'Copper wiring'],
  ['Project analytics', () => import('../app/ProjectAnalytics'), {id: project.id, projectId: project.id}, 'Workspace A Renovation'],
  ['Individual project analytics', () => import('../app/IndividualProjectAnalytics'), {id: project.id, projectId: project.id}, 'Workspace A Renovation'],
  ['Edit profile', () => import('../app/EditProfile'), {}, 'Edit Profile'],
  ['Change password', () => import('../app/ChangePassword'), {}, 'Change Password'],
  ['Notifications', () => import('../app/Notifications'), {}, 'Notifications'],
  ['Theme', () => import('../app/Theme'), {}, 'Theme'],
  ['About', () => import('../app/About'), {}, 'About'],
  ['Help', () => import('../app/HelpSupport'), {}, 'Help'],
  ['Session example', () => import('../app/ClerkConditionalExample'), {}, 'You are signed in'],
] as const;
beforeEach(() => {
  resetSimulation();
  // Expected application logging is silenced; exceptions and assertions still fail.
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(async () => { await cleanupScreens(); vi.restoreAllMocks(); });
for (const role of ['owner', 'member'] as const) describe(role + ' screen simulation', () => {
  for (const [name, load, params, visible] of businessScreens) it(name + ' renders fixture content without crashing', async () => {
    resetSimulation(role); sim.params = {...params};
    const tree = await renderScreen((await load()).default);
    expect(screenText(tree)).toContain(visible);
    expect(tree.root.findAll(node => String(node.type) === 'ActivityIndicator')).toHaveLength(0);
  });
});
it('owner can see team members and member deep links cannot load team administration', async () => {
  const Users = (await import('../app/(tabs)/users')).default;
  const ownerTree = await renderScreen(Users);
  expect(screenText(ownerTree)).toContain(member.full_name);
  await cleanupScreens(); resetSimulation('member');
  const memberTree = await renderScreen(Users);
  expect(sim.api.getSubUsers).not.toHaveBeenCalled();
  expect(screenText(memberTree)).not.toContain(member.email);
  expect(sim.router.replace).toHaveBeenCalled();
});
it('project detail displays receipts from both storage paths', async () => {
  sim.params = {id: project.id};
  const tree = await renderScreen((await import('../app/ProjectDetails')).default);
  expect(screenText(tree)).toContain('Original payer');
  expect(screenText(tree)).toContain('200');
  expect(sim.api.getCustomerPaymentsByProject).toHaveBeenCalledWith(project.id);
});
for (const [name, load, params, method] of [
  ['Projects', () => import('../app/(tabs)/home'), {}, 'getProjects'],
  ['Expenses', () => import('../app/(tabs)/expense'), {}, 'getExpenses'],
  ['Analytics', () => import('../app/(tabs)/analytics'), {}, 'getExpenses'],
  ['Profile', () => import('../app/(tabs)/profile'), {}, 'getExpenses'],
  ['Project details', () => import('../app/ProjectDetails'), {id: project.id}, 'getProjectById'],
  ['Expense details', () => import('../app/ExpenseDetails'), {id: expense.id}, 'getExpenseById'],
  ['Project analytics', () => import('../app/ProjectAnalytics'), {id: project.id}, 'getProjectById'],
  ['Individual project analytics', () => import('../app/IndividualProjectAnalytics'), {id: project.id}, 'getProjectById'],
] as const) {
  it(name + ' reloads data when returning from an edit', async () => {
    sim.params = {...params}; const Component = (await load()).default;
    const tree = await renderScreen(Component);
    const before = sim.api[method].mock.calls.length;
    await refocus(tree, Component);
    expect(sim.api[method].mock.calls.length).toBeGreaterThan(before);
  });
  it(name + ' shows a failure instead of empty or zero data when offline', async () => {
    sim.params = {...params}; sim.api[method].mockRejectedValue(new Error('Simulation network unavailable'));
    const tree = await renderScreen((await load()).default);
    expect(screenText(tree)).toMatch(/failed|unable|could not|couldn't|unavailable/i);
    expect(screenText(tree)).not.toContain('No projects yet');
  });
}
for (const role of ['owner','member'] as const) it(role + ' receives only the permitted navigation tabs', async () => {
  resetSimulation(role);
  const tree = await renderScreen((await import('../app/(tabs)/_layout')).default);
  const routes = tree.root.findAll(node => String(node.type) === 'Route').map(node => node.props.name);
  expect(routes).toEqual(role === 'owner' ? ['home','expense','analytics','users','profile'] : ['home','expense','analytics','profile']);
});
for (const [label, load] of [
  ['Project details', () => import('../app/ProjectDetails')],
  ['Expense details', () => import('../app/ExpenseDetails')],
  ['Project analytics', () => import('../app/ProjectAnalytics')],
  ['Individual analytics', () => import('../app/IndividualProjectAnalytics')],
] as const) it(label + ' handles a missing deep-link ID without spinning or showing old data', async () => {
  const tree = await renderScreen((await load()).default);
  expect(tree.root.findAll(node => String(node.type) === 'ActivityIndicator')).toHaveLength(0);
  expect(screenText(tree)).not.toContain(project.name);
  expect(screenText(tree)).not.toContain(expense.description);
  expect(sim.api.getProjectById).not.toHaveBeenCalled();
  expect(sim.api.getExpenseById).not.toHaveBeenCalled();
});
for (const [label, load, visible] of [
  ['Projects', () => import('../app/(tabs)/home'), 'No projects yet'],
  ['Expenses', () => import('../app/(tabs)/expense'), 'No expenses'],
  ['Analytics', () => import('../app/(tabs)/analytics'), 'No data available yet'],
  ['Profile', () => import('../app/(tabs)/profile'), '0.00'],
  ['Users', () => import('../app/(tabs)/users'), 'No team members yet'],
] as const) it(label + ' handles a new empty workspace', async () => {
  sim.api.getProjects.mockResolvedValue([]); sim.api.getExpenses.mockResolvedValue([]);
  sim.api.getTopExpenseCategories.mockResolvedValue([]); sim.api.getSubUsers.mockResolvedValue([]);
  const tree = await renderScreen((await load()).default);
  expect(screenText(tree)).toContain(visible);
  expect(screenText(tree)).not.toMatch(/NaN|Infinity|Invalid Date/);
});
it('a failed project load can recover through the visible Retry action', async () => {
  sim.api.getProjects.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce([project]);
  const tree = await renderScreen((await import('../app/(tabs)/home')).default);
  expect(screenText(tree)).toContain('Failed');
  await pressText(tree, 'Retry');
  expect(screenText(tree)).toContain(project.name);
});
