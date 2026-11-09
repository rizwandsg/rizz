// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', 'test-results/**', '.vercel/**', '.firebase/**', 'myClerkApp/**', 'supabase/functions/account/index.ts'],
  },
]);
