const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('dotenv');
const { validateEnvironment } = require('../config/runtime-config.cjs');

const publicNames = [
  'EXPO_PUBLIC_APP_ENV', 'EXPO_PUBLIC_APP_NAME',
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY', 'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_KEY', 'EXPO_PUBLIC_PRODUCTION_SUPABASE_URL',
  'EXPO_PUBLIC_BACKEND_CONTRACT_VERSION',
];

function loadProductionEnvironment(root, inherited = process.env) {
  const filename = path.join(root, '.env.production.local');
  const configured = fs.existsSync(filename) ? parse(fs.readFileSync(filename)) : {};
  const unexpected = Object.keys(configured).filter(name => !publicNames.includes(name));
  if (unexpected.length) throw new Error(`Only approved public settings belong in .env.production.local. Remove: ${unexpected.join(', ')}`);
  // A dedicated production file wins over development values in the calling shell.
  // Never fall back to the legacy .env, which may contain server credentials.
  const env = { ...inherited, ...configured, EAS_BUILD_PROFILE: 'production' };
  const required = publicNames.filter(name => name !== 'EXPO_PUBLIC_APP_NAME');
  const missing = required.filter(name => !env[name]);
  if (missing.length) throw new Error(`Missing production settings: ${missing.join(', ')}. Complete .env.production.local using .env.production.example.`);
  const runtime = validateEnvironment(env, true);
  if (runtime.appEnv !== 'production') throw new Error('Store builds require production settings');
  if (env.EXPO_PUBLIC_SUPABASE_URL.includes('your-production-project') || env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('replace_with') || env.EXPO_PUBLIC_SUPABASE_KEY.includes('replace_with')) {
    throw new Error('Replace the production example values before building');
  }
  return env;
}

module.exports = { loadProductionEnvironment, publicNames };
