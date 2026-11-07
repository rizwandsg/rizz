export const defaultNotificationSettings = {
  pushNotifications: true, emailNotifications: false, projectUpdates: true,
  expenseAlerts: true, paymentReminders: false, weeklyReports: false,
};
export function parseNotificationSettings(raw: string | null) {
  const result = {...defaultNotificationSettings};
  if (!raw) return result;
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const key of Object.keys(result) as (keyof typeof result)[]) {
    const stored = (value as Record<string, unknown>)[key];
    if (typeof stored === 'boolean') result[key] = stored;
  }
  // These delivery services are not implemented. Do not show a saved promise to deliver.
  result.emailNotifications = false; result.paymentReminders = false; result.weeklyReports = false;
  return result;
}
