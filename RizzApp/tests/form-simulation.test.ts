import { sim, resetSimulation, renderScreen, cleanupScreens, screenText, byTestId, pressText, project, expense, payment, customerPayment } from './simulation/harness';
import { act, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AddProject from '../app/AddProject';
import AddExpense from '../app/AddExpense';
import AddPayment from '../app/AddPayment';
import AddCustomerPayment from '../app/AddCustomerPayment';
import { parseCalendarDate } from '../services/formValues';
import { localDate } from '../services/validation';

beforeEach(() => resetSimulation());
afterEach(cleanupScreens);

async function change(tree: ReactTestRenderer, id: string, value: string) {
  await act(async () => byTestId(tree, id).props.onChangeText(value));
}
async function changePlaceholder(tree: ReactTestRenderer, placeholder: string, value: string) {
  const input = tree.root.findAll(node => typeof node.type === 'string' && node.props.placeholder === placeholder)[0];
  expect(input).toBeTruthy();
  await act(async () => input.props.onChangeText(value));
}
async function save(tree: ReactTestRenderer, id: string) {
  const button = byTestId(tree, id);
  expect(button.props.disabled).toBeFalsy();
  await act(async () => button.props.onPress());
}

describe.each(['owner', 'member'] as const)('%s financial forms', role => {
  beforeEach(() => resetSimulation(role));
  it.each(['1st Payment','2nd Payment','3rd Payment'])('records a received amount at stage %s',async stage=>{
    sim.params={projectId:project.id};const tree=await renderScreen(AddPayment);
    await change(tree,'payment-amount','125.50');
    await act(async()=>byTestId(tree,'payment-type').props.onPress());await pressText(tree,stage);
    await save(tree,'payment-save');
    expect(sim.api.createPayment).toHaveBeenCalledWith(expect.objectContaining({project_id:project.id,amount:125.50,payment_type:stage,received_from:project.client_name}));
  });
  it('validates an arbitrary payment number before saving and supports later stages',async()=>{
    sim.params={projectId:project.id};const tree=await renderScreen(AddPayment);
    await change(tree,'payment-amount','125.50');await act(async()=>byTestId(tree,'payment-type').props.onPress());await pressText(tree,'Another Payment Number');
    await change(tree,'payment-number','0');await save(tree,'payment-save');expect(sim.api.createPayment).not.toHaveBeenCalled();
    await change(tree,'payment-number','21');await save(tree,'payment-save');
    expect(sim.api.createPayment).toHaveBeenCalledWith(expect.objectContaining({amount:125.50,payment_type:'21st Payment'}));
  });
  it('edits a saved later-stage receipt without changing its stage or amount',async()=>{
    sim.params={id:payment.id};sim.api.getPaymentById.mockResolvedValue({...payment,payment_type:'12th Payment'});
    const tree=await renderScreen(AddPayment);expect(byTestId(tree,'payment-number').props.value).toBe('12');
    await save(tree,'payment-save');expect(sim.api.updatePayment).toHaveBeenCalledWith(payment.id,expect.objectContaining({payment_type:'12th Payment',amount:payment.amount,updated_at:payment.updated_at}));
  });
  it('creates a project and prevents a second submit before leaving success', async () => {
    const tree = await renderScreen(AddProject);
    await change(tree, 'project-name', 'Test project');
    await change(tree, 'project-cost', '1000.25');
    await save(tree, 'project-save');
    expect(sim.api.createProject).toHaveBeenCalledWith(expect.objectContaining({name: 'Test project', total_project_cost: 1000.25, id: expect.any(String)}));
    await act(async () => byTestId(tree, 'project-save').props.onPress());
    expect(sim.api.createProject).toHaveBeenCalledTimes(1);
    expect(sim.alert).toHaveBeenCalledWith('Success', expect.any(String), expect.any(Array));
  });

  it('creates an expense for a project without scopes and keeps retry identity stable', async () => {
    sim.api.getProjects.mockResolvedValue([{...project, scope_of_work: []}]);
    sim.api.createExpense.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(expense);
    const tree = await renderScreen(AddExpense);
    expect(screenText(tree)).toContain(project.name);
    await change(tree, 'expense-description', 'Materials delivery');
    await change(tree, 'expense-amount', '50.25');
    await save(tree, 'expense-save');
    expect(sim.alert).toHaveBeenLastCalledWith('Error', 'Offline');
    await save(tree, 'expense-save');
    const first = sim.api.createExpense.mock.calls[0][0];
    expect(first).toMatchObject({project_id: project.id, amount: 50.25, category: 'general', scope_of_work: 'Other'});
    expect(sim.api.createExpense.mock.calls[1][0].id).toBe(first.id);
  });

  it.each([
    [AddPayment, 'payment-amount', 'payment-save', 'createPayment'],
    [AddCustomerPayment, 'customer-payment-amount', 'customer-payment-save', 'createCustomerPayment'],
  ] as const)('records a receipt with the visible project and validated amount', async (Component, amountId, saveId, method) => {
    sim.params = { projectId: project.id };
    const tree = await renderScreen(Component);
    expect(screenText(tree)).toContain(project.name);
    await change(tree, amountId, '12junk');
    await save(tree, saveId);
    expect(sim.api[method]).not.toHaveBeenCalled();
    await change(tree, amountId, '25.50');
    await save(tree, saveId);
    expect(sim.api[method]).toHaveBeenCalledWith(expect.objectContaining({project_id: project.id, amount: 25.5, id: expect.any(String)}));
  });
});

it('clears saved project fields, scopes and end date instead of silently retaining them', async () => {
  sim.params = {id: project.id};
  sim.api.getProjectById.mockResolvedValue({...project, scope_of_work: ['Electrical Work'], description: 'Old description', end_date: '2026-12-01'});
  const tree = await renderScreen(AddProject);
  await changePlaceholder(tree, 'Enter client name', '');
  await changePlaceholder(tree, 'Enter project description (optional)', '');
  await change(tree, 'project-cost', '');
  await act(async () => byTestId(tree, 'project-clear-scopes').props.onPress());
  await act(async () => byTestId(tree, 'project-clear-end-date').props.onPress());
  await save(tree, 'project-save');
  expect(sim.api.updateProject).toHaveBeenCalledWith(project.id, expect.objectContaining({updated_at: project.updated_at, client_name: '', description: '', total_project_cost: 0, end_date: null, scope_of_work: [], start_date: project.start_date}));
});

it('loads an edited expense independently of project-list completion and preserves its category', async () => {
  sim.params = {id: expense.id};
  let resolveProjects!: (value: any) => void;
  sim.api.getProjects.mockReturnValue(new Promise(resolve => {resolveProjects = resolve;}));
  sim.api.getExpenseById.mockResolvedValue({...expense, scope_of_work: undefined, category: 'transport', vendor_contact: '123'});
  const tree = await renderScreen(AddExpense);
  expect(screenText(tree)).toContain('Loading form');
  expect(byTestId(tree, 'expense-save')).toBeUndefined();
  await act(async () => resolveProjects([{...project, id: 'first-project', name: 'Wrong project', scope_of_work: []}, {...project, scope_of_work: []}]));
  expect(screenText(tree)).toContain(project.name);
  expect(screenText(tree)).toMatch(/Selected:\s+transport/);
  await save(tree, 'expense-save');
  expect(sim.api.updateExpense).toHaveBeenCalledWith(expense.id, expect.objectContaining({project_id: project.id, category: 'transport', expense_date: expense.expense_date, updated_at: expense.updated_at}));
});

it.each([
  [AddPayment, 'getPaymentById', 'updatePayment', payment, 'payment-save'],
  [AddCustomerPayment, 'getCustomerPaymentById', 'updateCustomerPayment', customerPayment, 'customer-payment-save'],
] as const)('loads edit receipts by their saved project and clears optional fields', async (Component, getMethod, updateMethod, receipt, saveId) => {
  sim.params = {id: receipt.id};
  sim.api[getMethod].mockResolvedValue({...receipt, reference_number: 'Old reference', notes: 'Old notes'});
  const tree = await renderScreen(Component);
  expect(screenText(tree)).toContain(project.name);
  if (Component === AddPayment) expect(byTestId(tree, 'payment-received-from').props.value).toBe(payment.received_from);
  const reference = tree.root.findAll(node => typeof node.type === 'string' && node.props.value === 'Old reference')[0];
  const notes = tree.root.findAll(node => typeof node.type === 'string' && node.props.value === 'Old notes')[0];
  await act(async () => {reference.props.onChangeText(''); notes.props.onChangeText('');});
  await save(tree, saveId);
  expect(sim.api[updateMethod]).toHaveBeenCalledWith(receipt.id, expect.objectContaining({project_id: project.id, reference_number: '', notes: '', payment_date: receipt.payment_date, updated_at: receipt.updated_at}));
});

it.each([
  [AddProject, 'getProjectById', project.id, 'project-save'],
  [AddExpense, 'getExpenseById', expense.id, 'expense-save'],
  [AddPayment, 'getPaymentById', payment.id, 'payment-save'],
  [AddCustomerPayment, 'getCustomerPaymentById', customerPayment.id, 'customer-payment-save'],
] as const)('blocks inaccessible edits and allows a safe retry', async (Component, getMethod, id, saveId) => {
  sim.params = {id};
  sim.api[getMethod].mockResolvedValueOnce(null);
  const tree = await renderScreen(Component);
  expect(screenText(tree)).toContain('not found or access denied');
  expect(byTestId(tree, saveId)).toBeUndefined();
  await pressText(tree, 'Retry');
  expect(byTestId(tree, saveId)).toBeTruthy();
});

it.each([AddPayment, AddCustomerPayment])('rejects mismatched receipt/project links', async Component => {
  sim.params = {id: 'receipt-id', projectId: 'another-project'};
  const tree = await renderScreen(Component);
  expect(screenText(tree)).toContain('does not belong to this project');
  expect(sim.api.updatePayment).not.toHaveBeenCalled();
  expect(sim.api.updateCustomerPayment).not.toHaveBeenCalled();
});

it('distinguishes offline project loading from an empty workspace', async () => {
  sim.api.getProjects.mockRejectedValueOnce(new Error('Network unavailable'));
  const tree = await renderScreen(AddExpense);
  expect(screenText(tree)).toContain('Network unavailable');
  expect(screenText(tree)).not.toContain('No projects found');
  expect(byTestId(tree, 'expense-save')).toBeUndefined();
  await pressText(tree, 'Retry');
  expect(screenText(tree)).toContain(project.name);
});

it('blocks rapid repeated submits while the first request is pending', async () => {
  sim.params = {projectId: project.id};
  let finish!: () => void;
  sim.api.createPayment.mockReturnValue(new Promise<void>(resolve => {finish = resolve;}));
  const tree = await renderScreen(AddPayment);
  await change(tree, 'payment-amount', '10');
  const handler = byTestId(tree, 'payment-save').props.onPress;
  await act(async () => { const first = handler(); const second = handler(); expect(sim.api.createPayment).toHaveBeenCalledTimes(1); finish(); await Promise.all([first, second]); });
  expect(byTestId(tree, 'payment-save').props.disabled).toBe(true);
});

it.each([
  [AddPayment, 'payment-save'],
  [AddCustomerPayment, 'customer-payment-save'],
] as const)('blocks creation without a project and holds the form until its project loads', async (Component, saveId) => {
  const missing = await renderScreen(Component);
  expect(screenText(missing)).toContain('Project is required');
  expect(byTestId(missing, saveId)).toBeUndefined();
  await cleanupScreens();
  sim.params = {projectId: project.id};
  let finish!: (value: any) => void;
  sim.api.getProjectById.mockReturnValueOnce(new Promise(resolve => {finish = resolve;}));
  const pending = await renderScreen(Component);
  expect(screenText(pending)).toContain('Loading form');
  expect(byTestId(pending, saveId)).toBeUndefined();
  await act(async () => finish(null));
  expect(screenText(pending)).toContain('Project not found or access denied');
  expect(byTestId(pending, saveId)).toBeUndefined();
});

it.each([
  [AddProject, 'getProjectById', project, 'project-save'],
  [AddExpense, 'getExpenseById', expense, 'expense-save'],
  [AddPayment, 'getPaymentById', payment, 'payment-save'],
  [AddCustomerPayment, 'getCustomerPaymentById', customerPayment, 'customer-payment-save'],
] as const)('refuses unversioned edits instead of bypassing conflict checks', async (Component, getMethod, record, saveId) => {
  sim.params = {id: record.id};
  sim.api[getMethod].mockResolvedValueOnce({...record, updated_at: undefined});
  const tree = await renderScreen(Component);
  expect(screenText(tree)).toContain('version is missing');
  expect(byTestId(tree, saveId)).toBeUndefined();
});

it.each([
  [AddProject, project, 'updateProject', 'project-save'],
  [AddExpense, expense, 'updateExpense', 'expense-save'],
  [AddPayment, payment, 'updatePayment', 'payment-save'],
  [AddCustomerPayment, customerPayment, 'updateCustomerPayment', 'customer-payment-save'],
] as const)('reports stale-edit conflicts without navigating or showing success', async (Component, record, method, saveId) => {
  sim.params = {id: record.id};
  sim.api[method].mockRejectedValueOnce(new Error('Record changed. Reload before editing.'));
  const tree = await renderScreen(Component);
  await save(tree, saveId);
  expect(sim.alert).toHaveBeenLastCalledWith('Error', 'Record changed. Reload before editing.');
  expect(sim.router.back).not.toHaveBeenCalled();
  expect(byTestId(tree, saveId).props.disabled).toBe(false);
});

it('clears saved vendor text when the edit fields are emptied', async () => {
  sim.params = {id: expense.id};
  sim.api.getExpenseById.mockResolvedValue({...expense, vendor_contact: 'Old phone'});
  const tree = await renderScreen(AddExpense);
  await pressText(tree, expense.vendor_name);
  const name = tree.root.findAll(node => typeof node.type === 'string' && node.props.value === expense.vendor_name)[0];
  await act(async () => name.props.onChangeText(''));
  await save(tree, 'expense-save');
  expect(sim.api.updateExpense).toHaveBeenCalledWith(expense.id, expect.objectContaining({vendor_name: '', vendor_contact: ''}));
});

it('requires a chosen scope when creating an expense for a multi-scope project', async () => {
  sim.api.getProjects.mockResolvedValue([{...project, scope_of_work: ['Electrical Work', 'Painting Work']}]);
  const tree = await renderScreen(AddExpense);
  await change(tree, 'expense-description', 'New work');
  await change(tree, 'expense-amount', '20');
  await save(tree, 'expense-save');
  expect(sim.api.createExpense).not.toHaveBeenCalled();
  expect(sim.alert).toHaveBeenLastCalledWith('Error', 'Please select a scope of work');
  await pressText(tree, 'Select scope of work');
  await pressText(tree, 'Painting Work');
  await save(tree, 'expense-save');
  expect(sim.api.createExpense).toHaveBeenCalledWith(expect.objectContaining({scope_of_work: 'Painting Work', amount: 20}));
});

it('keeps date-only values at local midnight and rejects invalid calendar days', () => {
  for (const value of ['2026-01-01', '2024-02-29', '2026-11-07']) {
    expect(localDate(parseCalendarDate(value))).toBe(value);
    expect(parseCalendarDate(value).getHours()).toBe(0);
  }
  expect(() => parseCalendarDate('2026-02-30')).toThrow('Invalid date');
});
