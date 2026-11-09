/** Native adapters are mocked; actual screen components and their effects/handlers run.
 * This is not device rendering or a live identity/database integration test. */
import React from 'react';
import { act, create, type ReactTestRenderer, type ReactTestInstance } from 'react-test-renderer';
import { vi } from 'vitest';

const sim = vi.hoisted(() => ({
  params: {} as Record<string, string>, user: null as any, loading: false, error: null as string | null,
  focused: true, focusVersion: 0, identityLoaded: true, unverified: false,
  signInIdentity: vi.fn(), signUpIdentity: vi.fn(), resetPassword: vi.fn(), sendVerification: vi.fn(), refreshIdentity: vi.fn(),
  router: { push: vi.fn(), replace: vi.fn(), back: vi.fn(), canGoBack: vi.fn(() => true) },
  navigation: { setOptions: vi.fn() }, alert: vi.fn(),
  signOut: vi.fn(), updatePassword: vi.fn(), retry: vi.fn(),
  storage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), multiRemove: vi.fn() },
  api: {
    getCurrentUser: vi.fn(), getSubUsers: vi.fn(), createSubUser: vi.fn(), updateSubUser: vi.fn(), deleteSubUser: vi.fn(), resetSubUserPassword: vi.fn(), updateProfile: vi.fn(), logout: vi.fn(), changePassword: vi.fn(),
    getProjects: vi.fn(), getProjectById: vi.fn(), createProject: vi.fn(), updateProject: vi.fn(), deleteProject: vi.fn(),
    getExpenses: vi.fn(), getExpensesByProject: vi.fn(), getExpenseById: vi.fn(), getTopExpenseCategories: vi.fn(), getUniqueVendors: vi.fn(), createExpense: vi.fn(), updateExpense: vi.fn(), deleteExpense: vi.fn(),
    getPaymentsByProject: vi.fn(), getPaymentSummary: vi.fn(), getPaymentById: vi.fn(), createPayment: vi.fn(), updatePayment: vi.fn(), deletePayment: vi.fn(),
    getCustomerPaymentsByProject: vi.fn(), getCustomerPaymentById: vi.fn(), createCustomerPayment: vi.fn(), updateCustomerPayment: vi.fn(), deleteCustomerPayment: vi.fn(),
  },
  exports: { downloadCategoriesData: vi.fn(), downloadProjectCostData: vi.fn(), generateAndSavePDF: vi.fn(), generateAndSharePDF: vi.fn() },
  notifications: { checkNotificationPermissions: vi.fn(), forceEnableNotifications: vi.fn(), registerForPushNotificationsAsync: vi.fn(), sendAppNotification: vi.fn(), testNotificationSystem: vi.fn() },
  realtime: { subscribeToAll: vi.fn(), unsubscribeFromAll: vi.fn() },
}));
export { sim };

vi.mock('react-native', async () => {
  const R = await import('react');
  const host = (name: string) => { const Component = ({ children, ...props }: any) => R.createElement(name, props, children); Component.displayName = name; return Component; };
  const names = ['View','Text','TextInput','Button','TouchableOpacity','TouchableHighlight','Pressable','ScrollView','ActivityIndicator','KeyboardAvoidingView','Switch','Image','RefreshControl','SafeAreaView'];
  const components = Object.fromEntries(names.map(name => [name, host(name)]));
  return { ...components,
    Modal: ({ visible, children }: any) => visible ? R.createElement('Modal', {}, children) : null,
    FlatList: ({ data = [], renderItem, ListEmptyComponent, ListHeaderComponent, ...props }: any) => R.createElement('FlatList', props, ListHeaderComponent, data.length ? data.map((item: any, index: number) => R.createElement(R.Fragment, {key: item.id || index}, renderItem({item, index}))) : (typeof ListEmptyComponent === 'function' ? R.createElement(ListEmptyComponent) : ListEmptyComponent)),
    StyleSheet: { create: (styles: any) => styles, flatten: (style: any) => style, hairlineWidth: 1, absoluteFillObject: {} },
    Platform: { OS: 'android', select: (choices: any) => choices.android ?? choices.native ?? choices.default },
    Alert: { alert: sim.alert }, Dimensions: { get: () => ({width: 390, height: 844}) },
    useWindowDimensions: () => ({width: 390, height: 844}),
    Linking: { openURL: vi.fn().mockResolvedValue(undefined), canOpenURL: vi.fn().mockResolvedValue(true) },
    Keyboard: { dismiss: vi.fn() }, AppState: { addEventListener: () => ({remove: vi.fn()}) },
  };
});
vi.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon', Ionicons: 'Icon', FontAwesome: 'Icon' }));
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
vi.mock('@react-native-community/datetimepicker', () => ({ default: 'DateTimePicker' }));
vi.mock('react-native-modal-datetime-picker', () => ({ default: 'DateTimePicker' }));
vi.mock('react-native-chart-kit', () => ({ LineChart: 'LineChart', PieChart: 'PieChart', BarChart: 'BarChart', ProgressChart: 'ProgressChart' }));
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}), SafeAreaView: 'SafeAreaView', SafeAreaProvider: 'SafeAreaProvider' }));
vi.mock('expo-crypto', () => ({ randomUUID: () => '90000000-0000-4000-8000-000000000001' }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: sim.storage }));
vi.mock('expo-router', async () => {
  const R = await import('react');
  const Navigator = ({children}: any) => R.createElement('Navigator', {}, children);
  Navigator.Screen = (props: any) => R.createElement('Route', props);
  Navigator.Protected = function Protected({guard, children}: any) { return guard ? children : null; };
  return { router: sim.router, useRouter: () => sim.router, useNavigation: () => sim.navigation, useFocusEffect: (callback: () => any) => R.useEffect(() => sim.focused ? callback() : undefined, [callback, sim.focused, sim.focusVersion]), useLocalSearchParams: () => sim.params, Stack: Navigator, Tabs: Navigator, Link: 'Link', Redirect: ({href}: any) => { R.useEffect(() => {sim.router.replace(href);}, [href]); return R.createElement('Redirect', {href}); } };
});
vi.mock('../../context/IdentityContext', () => ({ useIdentity: () => ({isLoaded: sim.identityLoaded, isSignedIn: !!sim.user || sim.unverified, emailVerified: !!sim.user && !sim.unverified, email: 'account@example.test', signOut: sim.signOut}) }));
vi.mock('../../services/firebaseIdentity', () => ({
  signInIdentity: sim.signInIdentity, signUpIdentity: sim.signUpIdentity, resetIdentityPassword: sim.resetPassword,
  sendVerificationEmail: sim.sendVerification, refreshIdentity: sim.refreshIdentity, changeIdentityPassword: sim.updatePassword,
  identityError: (error: any) => error.message || 'Unable to authenticate. Please try again.',
}));
vi.mock('../../context/AuthContext', () => ({ useAccount: () => ({user: sim.user, loading: sim.loading, error: sim.error, retry: sim.retry}), AuthProvider: ({children}: any) => children }));
vi.mock('../../api/authApi', () => ({...sim.api}));
vi.mock('../../api/projectsApi', async (original) => ({...await original<any>(), ...sim.api}));
vi.mock('../../api/expensesApi', async (original) => ({...await original<any>(), ...sim.api}));
vi.mock('../../api/paymentsApi', async (original) => ({...await original<any>(), ...sim.api}));
vi.mock('../../api/customerPaymentsApi', async (original) => ({...await original<any>(), ...sim.api}));
// Prevent accidental network access even through an unmocked API export.
vi.mock('../../services/databaseService', () => ({ TABLES: {}, database: new Proxy({}, {get: (_target, operation) => () => {throw new Error('Unmocked database operation in screen simulation: ' + String(operation));}}) }));
vi.mock('../../services/exportService', () => sim.exports);
vi.mock('../../services/notificationService', () => ({...sim.notifications, NotificationType: {PROJECT_CREATED: 'project_created', EXPENSE_ADDED: 'expense_added'}, areNotificationsEnabled: vi.fn().mockResolvedValue(false)}));
vi.mock('../../services/websocketService', () => sim.realtime);

export const owner = { id: 'owner-a', firebase_user_id: 'user_a', role: 'owner', parent_user_id: null, is_active: true, email: 'owner-a@example.test', full_name: 'Owner A', created_at: '2026-11-01T00:00:00Z' };
export const member = { ...owner, id: 'member-a', firebase_user_id: 'user_member_a', role: 'member', parent_user_id: owner.id, email: 'member-a@example.test', full_name: 'Member A' };
export const project = { id: 'project-a', user_id: owner.id, name: 'Workspace A Renovation', client_name: 'Client A', location: 'Site A', start_date: '2026-11-01', status: 'active', total_project_cost: 1000, created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-07T00:00:00Z', scope_of_work: ['Electrical'] };
export const expense = { id: 'expense-a', user_id: member.id, project_id: project.id, description: 'Copper wiring', amount: 125.50, expense_date: '2026-11-06', category: 'materials', scope_of_work: 'Electrical', vendor_name: 'Vendor A', payment_method: 'Cash', payment_status: 'Unpaid', updated_at: '2026-11-07T00:00:00Z' };
export const payment = { id: 'payment-a', user_id: owner.id, project_id: project.id, amount: 300, payment_date: '2026-11-05', payment_type: 'Advance', payment_mode: 'Cash', received_from: 'Original payer', notes: 'Legacy receipt', updated_at: '2026-11-07T00:00:00Z' };
export const customerPayment = { id: 'customer-a', user_id: member.id, project_id: project.id, amount: 200, payment_date: '2026-11-06', payment_method: 'UPI', reference_number: 'RECEIPT-A-2', notes: 'Customer receipt', updated_at: '2026-11-07T00:00:00Z' };

export function resetSimulation(role: 'owner' | 'member' | 'guest' = 'owner') {
  vi.clearAllMocks();
  Object.values(sim.api).forEach(fn => fn.mockReset());
  sim.user = role === 'guest' ? null : {...(role === 'owner' ? owner : member)};
  sim.identityLoaded = true; sim.unverified = false;
  sim.params = {}; sim.loading = false; sim.error = null; sim.focused = true; sim.focusVersion = 0;
  sim.storage.getItem.mockResolvedValue(null); sim.storage.setItem.mockResolvedValue(undefined);
  sim.storage.removeItem.mockResolvedValue(undefined); sim.storage.multiRemove.mockResolvedValue(undefined);
  sim.api.getCurrentUser.mockImplementation(async () => sim.user);
  sim.api.getSubUsers.mockResolvedValue([member]); sim.api.getProjects.mockResolvedValue([project]); sim.api.getProjectById.mockResolvedValue(project);
  sim.api.getExpenses.mockResolvedValue([expense]); sim.api.getExpensesByProject.mockResolvedValue([expense]); sim.api.getExpenseById.mockResolvedValue(expense);
  sim.api.getTopExpenseCategories.mockResolvedValue([{category:'materials', totalAmount:125.50, expenseCount:1, percentage:100}]); sim.api.getUniqueVendors.mockResolvedValue([]);
  sim.api.getPaymentsByProject.mockResolvedValue([payment]); sim.api.getPaymentById.mockResolvedValue(payment);
  sim.api.getCustomerPaymentsByProject.mockResolvedValue([customerPayment]); sim.api.getCustomerPaymentById.mockResolvedValue(customerPayment);
  sim.api.getPaymentSummary.mockResolvedValue({total_received:500, total_expenses:125.50, project_cost:1000, remaining_amount:500, profit_loss:374.50, payment_count:2});
  sim.realtime.subscribeToAll.mockResolvedValue(undefined); sim.realtime.unsubscribeFromAll.mockResolvedValue(undefined);
  sim.notifications.registerForPushNotificationsAsync.mockResolvedValue(null);
  sim.signInIdentity.mockReset().mockResolvedValue({emailVerified:true});
  sim.signUpIdentity.mockReset().mockResolvedValue(undefined); sim.resetPassword.mockReset().mockResolvedValue(undefined);
  sim.sendVerification.mockReset().mockResolvedValue(undefined); sim.refreshIdentity.mockReset().mockResolvedValue(true);
  sim.signOut.mockReset().mockResolvedValue(undefined);
  sim.updatePassword.mockReset().mockResolvedValue(undefined);
}

const mounted = new Set<ReactTestRenderer>();
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true, React});
export async function renderScreen(Component: React.ComponentType) {
  const {ThemeProvider} = await import('../../context/ThemeContext');
  let tree!: ReactTestRenderer;
  await act(async () => { tree = create(React.createElement(ThemeProvider as React.ComponentType<React.PropsWithChildren>, null, React.createElement(Component))); });
  mounted.add(tree);
  return tree;
}
export async function cleanupScreens() { for (const tree of mounted) await act(async () => tree.unmount()); mounted.clear(); }
export function screenText(tree: ReactTestRenderer) {
  function text(node: any): string { if (node == null) return ''; if (typeof node !== 'object') return String(node); if (Array.isArray(node)) return node.map(text).join(' '); return text(node.children); }
  return text(tree.toJSON());
}
export function byTestId(tree: ReactTestRenderer, id: string) { return tree.root.findAll(node => typeof node.type === 'string' && node.props.testID === id)[0]; }
export async function pressText(tree: ReactTestRenderer, text: string) {
  for (const node of tree.root.findAll(node => String(node.type) === 'Text' && node.children.join('').trim() === text)) {
    let button: ReactTestInstance | null = node;
    while (button && typeof button.props.onPress !== 'function') button = button.parent;
    if (button && !button.props.disabled) {
      await act(async () => { await button!.props.onPress(); });
      return;
    }
  }
  throw new Error('Enabled button not found: ' + text);
}
export async function refocus(tree: ReactTestRenderer, Component: React.ComponentType) {
  const {ThemeProvider} = await import('../../context/ThemeContext');
  sim.focusVersion++;
  await act(async () => tree.update(React.createElement(ThemeProvider as React.ComponentType<React.PropsWithChildren>, null, React.createElement(Component))));
}
