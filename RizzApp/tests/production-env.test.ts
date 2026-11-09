import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, expect, it } from 'vitest';
import { firebasePublic } from './fixtures/public-config';
const { loadProductionEnvironment } = createRequire(import.meta.url)('../scripts/production-env.cjs');
const directories: string[] = [];
const production = {
  ...firebasePublic, EXPO_PUBLIC_APP_ENV: 'production', EXPO_PUBLIC_FIREBASE_PROJECT_ID:'rizz-production', EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:'rizz-production.firebaseapp.com',
  EXPO_PUBLIC_SUPABASE_URL: 'https://production.example.com', EXPO_PUBLIC_SUPABASE_KEY: 'sb_publishable_example',
  EXPO_PUBLIC_PRODUCTION_SUPABASE_URL: 'https://production.example.com', EXPO_PUBLIC_BACKEND_CONTRACT_VERSION: '3',
};
function fixture(values?: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'rizz-production-'));
  directories.push(root);
  if (values) writeFileSync(join(root, '.env.production.local'), Object.entries(values).map(([name, value]) => `${name}=${value}`).join('\n'));
  return root;
}
afterEach(() => { for (const root of directories.splice(0)) rmSync(root, { recursive: true, force: true }); });
it('ignores legacy .env and reports missing configuration before a build', () => {
  const root = fixture();
  writeFileSync(join(root, '.env'), 'EXPO_PUBLIC_APP_ENV=development\nCLERK_SECRET_KEY=server-only');
  expect(() => loadProductionEnvironment(root, {})).toThrow('Missing production settings');
});
it('uses the explicit production file over an inherited development shell', () => {
  const env = loadProductionEnvironment(fixture(production), { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_example' });
  expect(env.EXPO_PUBLIC_APP_ENV).toBe('production');
  expect(env.EXPO_PUBLIC_FIREBASE_PROJECT_ID).toBe('rizz-production');
  expect(env.EXPO_NO_DOTENV).toBe('1');
  expect(env.EAS_BUILD_PROFILE).toBe('production');
});
it('refuses server credentials in the client configuration without printing their value', () => {
  expect(() => loadProductionEnvironment(fixture({ ...production, CLERK_SECRET_KEY: 'never-print-this' }), {}))
    .toThrow('Remove: CLERK_SECRET_KEY');
});
it('rejects staging credentials and placeholder production values', () => {
  expect(() => loadProductionEnvironment(fixture({ ...production, EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'rizz-staging', EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:'rizz-staging.firebaseapp.com' }), {})).toThrow('production Firebase');
  expect(() => loadProductionEnvironment(fixture({ ...production, EXPO_PUBLIC_SUPABASE_KEY: 'sb_publishable_replace_with_key' }), {})).toThrow('Replace the production example');
});
