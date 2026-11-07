const { Buffer } = require('node:buffer');
function validateEnvironment(env, release = false) {
  const appEnv = env.EXPO_PUBLIC_APP_ENV || 'development';
  if (!['development', 'staging', 'production'].includes(appEnv)) throw new Error('APP_ENV must be development, staging, or production');
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const key = env.EXPO_PUBLIC_SUPABASE_KEY;
  const clerkKey = env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!url || !key || !clerkKey) throw new Error('Configure Supabase URL, public key, and Clerk publishable key');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && !(appEnv === 'development' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) throw new Error('Supabase requires HTTPS outside local development');
  if (key.startsWith('sb_secret_')) throw new Error('A Supabase secret key must never be bundled in the app');
  if (!key.startsWith('sb_publishable_')) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
      if (payload.role !== 'anon') throw new Error('role');
    } catch { throw new Error('Use a Supabase publishable key or legacy anon key'); }
  }
  if (!/^pk_(test|live)_/.test(clerkKey)) throw new Error('Invalid Clerk publishable key');
  if (appEnv === 'production' && !clerkKey.startsWith('pk_live_')) throw new Error('Production requires a live Clerk key');
  if (appEnv !== 'production' && !clerkKey.startsWith('pk_test_')) throw new Error('Development and staging require a test Clerk instance');
  if (release) {
    if (appEnv === 'development') throw new Error('Release builds require staging or production');
    if (env.EXPO_PUBLIC_BACKEND_CONTRACT_VERSION !== '2') throw new Error('Release requires the version 2 backend contract');
    const productionUrl = env.EXPO_PUBLIC_PRODUCTION_SUPABASE_URL;
    if (!productionUrl) throw new Error('Set PRODUCTION_SUPABASE_URL to enforce backend isolation');
    if ((appEnv === 'production') !== (new URL(productionUrl).origin === parsed.origin)) throw new Error('App environment and production backend do not match');
  }
  return { appEnv, supabaseUrl: url, supabaseKey: key };
}

function configEnvironment(env) {
  // EAS reads the project ID before fetching its remote environment. Permit
  // metadata discovery with no runtime keys; Metro and release checks still
  // require the complete configuration before producing an application bundle.
  if (['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_KEY', 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'].some(name => env[name])) {
    return validateEnvironment(env, ['preview', 'production'].includes(env.EAS_BUILD_PROFILE));
  }
  const appEnv = env.EXPO_PUBLIC_APP_ENV || 'development';
  if (!['development', 'staging', 'production'].includes(appEnv)) throw new Error('APP_ENV must be development, staging, or production');
  return { appEnv };
}
module.exports = { validateEnvironment, configEnvironment };
