import { createRequire } from 'node:module';
import { expect, it } from 'vitest';
const { validateEnvironment } = createRequire(import.meta.url)('../config/runtime-config.cjs');
const base = { EXPO_PUBLIC_SUPABASE_URL: 'https://staging.example.com', EXPO_PUBLIC_SUPABASE_KEY: 'sb_publishable_test', EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_example', EXPO_PUBLIC_APP_ENV: 'staging', EXPO_PUBLIC_BACKEND_CONTRACT_VERSION: '2', EXPO_PUBLIC_PRODUCTION_SUPABASE_URL: 'https://production.example.com' };
it('allows an isolated preview and rejects live credentials in preview', () => {
  expect(validateEnvironment(base, true).appEnv).toBe('staging');
  expect(() => validateEnvironment({ ...base, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_example' }, true)).toThrow();
  expect(() => validateEnvironment({ ...base, EXPO_PUBLIC_SUPABASE_URL: base.EXPO_PUBLIC_PRODUCTION_SUPABASE_URL }, true)).toThrow();
});
it('rejects service credentials, missing settings, and incomplete release setup', () => {
  expect(() => validateEnvironment({ ...base, EXPO_PUBLIC_SUPABASE_KEY: 'sb_secret_leak' })).toThrow();
  expect(() => validateEnvironment({ ...base, EXPO_PUBLIC_SUPABASE_URL: 'http://remote.example.com' })).toThrow();
  expect(() => validateEnvironment({})).toThrow();
  expect(() => validateEnvironment({ ...base, EXPO_PUBLIC_BACKEND_CONTRACT_VERSION: '' }, true)).toThrow();
  const key = 'a.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url') + '.c';
  expect(() => validateEnvironment({ ...base, EXPO_PUBLIC_SUPABASE_KEY: key })).toThrow();
});
