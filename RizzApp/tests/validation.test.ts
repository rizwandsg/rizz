import { describe, expect, it } from 'vitest';
import { localDate, parseMoney, validateDate, validateWrite } from '../services/validation';
import { parseFilters } from '../services/queryFilters';
import { authDestination } from '../services/routePolicy';

describe('input and navigation boundaries', () => {
  it.each(['12abc', 'Infinity', '-1', '0', '1e3', '1.001', '', '999999999999'])('rejects invalid amount %s', value => expect(() => parseMoney(value)).toThrow());
  it('accepts rupees and paise without truncating the input', () => { expect(parseMoney(' 12.30 ')).toBe(12.3); expect(parseMoney('0', true)).toBe(0); });
  it('rejects impossible dates and reversed project dates', () => {
    expect(() => validateDate('2026-02-30')).toThrow();
    expect(() => validateWrite('projects', { name: 'Test', start_date: '2026-05-02', end_date: '2026-05-01' }, false)).toThrow();
    expect(localDate(new Date(2026, 10, 7, 0, 15))).toBe('2026-11-07');
  });
  it('preserves periods in email, decimal, and timestamp filters', () => {
    expect(parseFilters('email.eq.a.b@example.com,amount.gte.12.50,created_at.gt.2026-11-07T00:00:00.000Z').map(item => item.value)).toEqual(['a.b@example.com', '12.50', '2026-11-07T00:00:00.000Z']);
    expect(() => parseFilters('name.like.foo')).toThrow();
    expect(() => parseFilters('id.eq.')).toThrow();
  });
  it('reevaluates login, logout, and deep links without a permanent redirect latch', () => {
    expect(authDestination(false, false)).toBe('/(auth)/login');
    expect(authDestination(true, true)).toBe('/(tabs)/home');
    expect(authDestination(true, false)).toBeNull();
    expect(authDestination(false, true)).toBeNull();
    expect(authDestination(false, false)).toBe('/(auth)/login');
  });
});
