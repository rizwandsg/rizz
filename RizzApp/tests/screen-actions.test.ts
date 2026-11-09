import { act } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanupScreens, expense, member, pressText, project, renderScreen, resetSimulation, screenText, sim } from './simulation/harness';

beforeEach(() => {
  resetSimulation();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(async () => { await cleanupScreens(); vi.restoreAllMocks(); });
async function fill(tree: ReactTestRenderer, placeholder: string, value: string) {
  const input = tree.root.findAll(node => String(node.type) === 'TextInput' && node.props.placeholder === placeholder)[0];
  expect(input, placeholder).toBeDefined();
  await act(async () => input.props.onChangeText(value));
}
async function chooseAlert(text: string) {
  const buttons = sim.alert.mock.calls.at(-1)?.[2] || [];
  const choice = buttons.find((item: any) => item.text === text);
  expect(choice, text).toBeDefined();
  await act(async () => choice.onPress());
}
async function pressIcon(tree: ReactTestRenderer, name: string) {
  let node = tree.root.findAll(node => String(node.type) === 'Icon' && node.props.name === name)[0];
  while (node && !node.props.onPress) node = node.parent!;
  expect(node, name).toBeDefined();
  await act(async () => node.props.onPress());
}

for (const role of ['owner', 'member'] as const) {
  it(role + ' can navigate every profile menu entry', async () => {
    resetSimulation(role);
    const tree = await renderScreen((await import('../app/(tabs)/profile')).default);
    for (const [label, route] of [['Edit Profile','/EditProfile'], ['Change Password','/ChangePassword'], ['Notifications','/Notifications'], ['Theme','/Theme'], ['Help & Support','/HelpSupport'], ['About','/About']]) {
      await pressText(tree, label); expect(sim.router.push).toHaveBeenLastCalledWith(route);
    }
  });
  it(role + ' saves only editable profile fields and reports failed writes', async () => {
    resetSimulation(role); sim.api.updateProfile.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce({...sim.user, full_name:'Updated Name'});
    const tree = await renderScreen((await import('../app/EditProfile')).default);
    expect(tree.root.findAll(node => String(node.type) === 'TextInput' && node.props.value === sim.user.email)[0].props.editable).toBe(false);
    await fill(tree, 'Enter your full name', '  Updated Name  ');
    await fill(tree, 'Enter your phone number', '');
    await pressText(tree, 'Save Changes');
    expect(sim.alert.mock.calls.at(-1)?.[0]).toBe('Error');
    expect(sim.router.back).not.toHaveBeenCalled();
    await pressText(tree, 'Save Changes');
    expect(sim.api.updateProfile).toHaveBeenLastCalledWith({full_name:'Updated Name', phone:''});
    expect(sim.alert.mock.calls.at(-1)?.[0]).toBe('Success');
  });
  it(role + ' validates and changes password through Clerk and clears fields', async () => {
    resetSimulation(role);
    const tree = await renderScreen((await import('../app/ChangePassword')).default);
    await pressText(tree, 'Change Password'); expect(sim.updatePassword).not.toHaveBeenCalled();
    await fill(tree, 'Enter current password', 'oldpassword');
    await fill(tree, 'Enter new password', 'newpassword');
    await fill(tree, 'Confirm new password', 'different');
    await pressText(tree, 'Change Password'); expect(sim.updatePassword).not.toHaveBeenCalled();
    await fill(tree, 'Confirm new password', 'newpassword');
    await pressText(tree, 'Change Password');
    expect(sim.updatePassword).toHaveBeenCalledWith('oldpassword', 'newpassword');
    expect(sim.api.changePassword).not.toHaveBeenCalled();
    expect(tree.root.findAll(node => String(node.type) === 'TextInput').every(node => node.props.value === '')).toBe(true);
  });
}
it('failed logout remains visible and cannot report local-only success', async () => {
  sim.signOut.mockRejectedValueOnce(new Error('Offline'));
  const tree = await renderScreen((await import('../app/(tabs)/profile')).default);
  await pressText(tree, 'Logout'); await chooseAlert('Logout');
  expect(sim.api.logout).not.toHaveBeenCalled(); expect(sim.alert.mock.calls.at(-1)?.[0]).toBe('Error');
  await pressText(tree, 'Logout'); await chooseAlert('Logout');
  expect(sim.api.logout).toHaveBeenCalledTimes(1);
});
it('owner can deactivate a member and reset requires verified recovery', async () => {
  const tree = await renderScreen((await import('../app/(tabs)/users')).default);
  await pressText(tree, 'Reset');
  expect(sim.alert.mock.calls.at(-1)?.[1]).toContain('verify their email');
  expect(sim.api.resetSubUserPassword).not.toHaveBeenCalled();
  await pressText(tree, 'Disable');
  expect(sim.api.updateSubUser).toHaveBeenCalledWith(member.id, {is_active:false});
  await pressText(tree, 'Deactivate');
  expect(sim.alert.mock.calls.at(-1)?.[1]).toContain('records will be retained');
  await chooseAlert('Deactivate');
  expect(sim.api.deleteSubUser).toHaveBeenCalledWith(member.id);
});
it('owner can create and edit a team member through the modal', async () => {
  const tree = await renderScreen((await import('../app/(tabs)/users')).default);
  await pressIcon(tree, 'plus');
  await pressText(tree, 'Create'); expect(sim.api.createSubUser).not.toHaveBeenCalled();
  await fill(tree, 'name@example.com', 'new-member@example.test');
  await fill(tree, 'Minimum 8 characters', 'test-password');
  await fill(tree, 'John Doe', 'New Member');
  await pressText(tree, 'Create');
  expect(sim.api.createSubUser).toHaveBeenCalledWith(expect.objectContaining({email:'new-member@example.test', full_name:'New Member'}));
  await pressText(tree, 'Edit');
  await fill(tree, 'John Doe', 'Renamed Member');
  await pressText(tree, 'Update');
  expect(sim.api.updateSubUser).toHaveBeenCalledWith(member.id, {full_name:'Renamed Member', phone:'', is_active:true});
});
for (const [label, load, recordId, destination, remove] of [
  ['Project', () => import('../app/ProjectDetails'), project.id, '/AddProject', 'deleteProject'],
  ['Expense', () => import('../app/ExpenseDetails'), expense.id, '/AddExpense', 'deleteExpense'],
] as const) it(label + ' native header edit/delete handlers work and a rejected delete preserves the screen', async () => {
  sim.params = {id:recordId};
  const tree = await renderScreen((await load()).default);
  const header = await renderScreen(sim.navigation.setOptions.mock.calls.at(-1)?.[0].headerRight);
  await pressIcon(header, 'pencil');
  expect(JSON.stringify(sim.router.push.mock.calls.at(-1))).toContain(destination);
  sim.api[remove].mockRejectedValueOnce(new Error('Dependent financial records'));
  await pressIcon(header, 'delete'); await chooseAlert('Delete');
  expect(sim.api[remove]).toHaveBeenCalledWith(recordId);
  expect(sim.alert.mock.calls.at(-1)?.[0]).toBe('Error');
  expect(sim.router.back).not.toHaveBeenCalled();
  expect(screenText(tree)).toContain(label === 'Project' ? project.name : expense.description);
});
it('theme persists and a failed preference write retains the current theme', async () => {
  const tree = await renderScreen((await import('../app/Theme')).default);
  await pressText(tree, 'Blue Ocean');
  expect(sim.storage.setItem).toHaveBeenCalledWith('@rizzapp_theme', 'blue');
  sim.storage.setItem.mockRejectedValueOnce(new Error('Storage unavailable'));
  await pressText(tree, 'Fresh Green');
  expect(sim.alert.mock.calls.at(-1)?.[0]).toBe('Error');
  expect(screenText(tree)).toContain('Blue Ocean');
});
it('notification preferences load safely from malformed saved content', async () => {
  sim.storage.getItem.mockImplementation(async (key: string) => key === '@rizzapp_notification_settings' ? 'null' : null);
  const tree = await renderScreen((await import('../app/Notifications')).default);
  const switches = tree.root.findAll(node => String(node.type) === 'Switch');
  expect(switches).toHaveLength(6); expect(switches[0].props.value).toBe(true);
  for (const index of [1,4,5]) { expect(switches[index].props.disabled).toBe(true); expect(switches[index].props.value).toBe(false); }
  expect(screenText(tree)).not.toContain('Push Token');
});
it('notification settings save and failed persistence rolls the toggle back', async () => {
  const tree = await renderScreen((await import('../app/Notifications')).default);
  const switches = () => tree.root.findAll(node => String(node.type) === 'Switch');
  await act(async () => switches()[0].props.onValueChange(false));
  expect(switches()[0].props.value).toBe(false);
  expect(JSON.parse(sim.storage.setItem.mock.calls.at(-1)?.[1]).pushNotifications).toBe(false);
  sim.storage.setItem.mockRejectedValueOnce(new Error('Full storage'));
  await act(async () => switches()[0].props.onValueChange(true));
  expect(switches()[0].props.value).toBe(false);
  expect(sim.alert.mock.calls.at(-1)?.[0]).toBe('Error');
});
it('project PDF action passes only actual expenses and reconciled totals', async () => {
  sim.params = {id:project.id};
  const tree = await renderScreen((await import('../app/ProjectAnalytics')).default);
  await pressText(tree, 'PDF'); await chooseAlert('Share');
  const report = sim.exports.generateAndSharePDF.mock.calls[0][0];
  expect(report.totalReceived).toBe(500); expect(report.totalExpenses).toBe(125.50);
  expect(report.expensesByCategory.reduce((total: number, row: any) => total + row.amount, 0)).toBe(125.50);
  expect(report.expensesByCategory.some((row: any) => row.category === 'Unspent Budget')).toBe(false);
});
it('both receipt types navigate to their corresponding edit forms', async () => {
  sim.params = {id:project.id};
  const tree = await renderScreen((await import('../app/ProjectDetails')).default);
  await pressText(tree, 'Legacy receipt');
  expect(sim.router.push).toHaveBeenLastCalledWith({pathname:'/AddPayment', params:{id:'payment-a', projectId:project.id}});
  await pressText(tree, 'Customer receipt');
  expect(sim.router.push).toHaveBeenLastCalledWith({pathname:'/AddCustomerPayment', params:{id:'customer-a', projectId:project.id}});
});
it('project and expense cards navigate with the visible record ID', async () => {
  const home = await renderScreen((await import('../app/(tabs)/home')).default);
  await pressText(home, project.name);
  expect(JSON.stringify(sim.router.push.mock.calls.at(-1))).toContain(project.id);
  const expenses = await renderScreen((await import('../app/(tabs)/expense')).default);
  await pressText(expenses, project.name);
  expect(sim.router.push).toHaveBeenLastCalledWith('/ProjectDetails?id=' + project.id);
});
it('profile totals preserve amounts smaller than one thousand', async () => {
  const tree = await renderScreen((await import('../app/(tabs)/profile')).default);
  expect(screenText(tree)).toContain('125.50');
  expect(screenText(tree)).not.toContain('0K');
});
it('help uses an explicit workspace support fallback and has no inert controls', async () => {
  const tree = await renderScreen((await import('../app/HelpSupport')).default);
  await pressText(tree, 'Contact Support');
  expect(sim.alert.mock.calls.at(-1)?.[1]).toContain('workspace owner');
  expect(screenText(tree)).not.toContain('10000001');
  expect(tree.root.findAll(node => String(node.type) === 'TouchableOpacity' && !node.props.onPress)).toHaveLength(0);
});
it('about clearly marks unavailable documents instead of presenting dead links', async () => {
  const tree = await renderScreen((await import('../app/About')).default);
  expect(screenText(tree)).toContain('documents have not been provided');
  expect(tree.root.findAll(node => String(node.type) === 'TouchableOpacity' && !node.props.onPress)).toHaveLength(0);
});
