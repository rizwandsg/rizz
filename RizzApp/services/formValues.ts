import { validateDate } from './validation';

// Date-only database values represent calendar days, not midnight in UTC.
export function parseCalendarDate(value: string): Date {
  validateDate(value);
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
