export const protectedScreens = ['(tabs)', 'About', 'AddCustomerPayment', 'AddExpense', 'AddPayment', 'AddProject', 'ChangePassword', 'ClerkConditionalExample', 'EditProfile', 'ExpenseDetails', 'HelpSupport', 'IndividualProjectAnalytics', 'Notifications', 'ProjectAnalytics', 'ProjectDetails', 'Theme'] as const;
// These screens rely on the navigator for back/edit/delete controls.
export const nativeHeaderTitles: Partial<Record<typeof protectedScreens[number], string>> = {
  AddProject: 'Project', AddExpense: 'Expense', AddPayment: 'Payment',
  ProjectDetails: 'Project Details', ExpenseDetails: 'Expense Details',
  IndividualProjectAnalytics: 'Project Analytics', ClerkConditionalExample: 'Account',
};
export function routeAccess(authenticated: boolean, loading: boolean, failed: boolean) {
  return { public: !authenticated && !loading && !failed, private: authenticated && !loading && !failed };
}
export function authDestination(signedIn: boolean, inAuthGroup: boolean): '/(auth)/login' | '/(tabs)/home' | null {
  if (!signedIn && !inAuthGroup) return '/(auth)/login';
  if (signedIn && inAuthGroup) return '/(tabs)/home';
  return null;
}
export function canManageMembers(user: { role?: string; parent_user_id?: string | null; is_active?: boolean } | null) {
  return !!user && user.role === 'owner' && !user.parent_user_id && user.is_active === true;
}
