const { Buffer } = require('node:buffer');
function validateEnvironment(env, release = false) {
  const appEnv = env.EXPO_PUBLIC_APP_ENV || 'development';
  if (!['development', 'staging', 'production'].includes(appEnv)) throw new Error('APP_ENV must be development, staging, or production');
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const key = env.EXPO_PUBLIC_SUPABASE_KEY;
  const firebaseProject = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!url || !key || !firebaseProject || !env.EXPO_PUBLIC_FIREBASE_API_KEY || !env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || !env.EXPO_PUBLIC_FIREBASE_APP_ID) throw new Error('Configure Supabase and Firebase public settings');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && !(appEnv === 'development' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) throw new Error('Supabase requires HTTPS outside local development');
  if (key.startsWith('sb_secret_')) throw new Error('A Supabase secret key must never be bundled in the app');
  if (!key.startsWith('sb_publishable_')) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
      if (payload.role !== 'anon') throw new Error('role');
    } catch { throw new Error('Use a Supabase publishable key or legacy anon key'); }
  }
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(firebaseProject)) throw new Error('Invalid Firebase project ID');
  if (env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN !== firebaseProject + '.firebaseapp.com') throw new Error('Firebase auth domain must match the project');
  if (!/^AIza[A-Za-z0-9_-]{35}$/.test(env.EXPO_PUBLIC_FIREBASE_API_KEY)) throw new Error('Invalid Firebase public API key');
  if (!/^1:\d+:web:[a-f0-9]+$/.test(env.EXPO_PUBLIC_FIREBASE_APP_ID)) throw new Error('Use the Firebase web SDK app ID');
  const productionFirebase = env.EXPO_PUBLIC_PRODUCTION_FIREBASE_PROJECT_ID;
  if (productionFirebase && ((appEnv === 'production') !== (firebaseProject === productionFirebase))) throw new Error('App environment and production Firebase project do not match');
  if (release) {
    if (appEnv === 'development') throw new Error('Release builds require staging or production');
    if (env.EXPO_PUBLIC_BACKEND_CONTRACT_VERSION !== '5') throw new Error('Release requires the version 5 backend contract');
    if (!productionFirebase) throw new Error('Set PRODUCTION_FIREBASE_PROJECT_ID to enforce identity isolation');
    const productionUrl = env.EXPO_PUBLIC_PRODUCTION_SUPABASE_URL;
    if (!productionUrl) throw new Error('Set PRODUCTION_SUPABASE_URL to enforce backend isolation');
    if ((appEnv === 'production') !== (new URL(productionUrl).origin === parsed.origin)) throw new Error('App environment and production backend do not match');
  }
  return { appEnv, supabaseUrl: url, supabaseKey: key, firebaseProject };
}

function configEnvironment(env) {
  // EAS reads the project ID before fetching its remote environment. Permit
  // metadata discovery with no runtime keys; Metro and release checks still
  // require the complete configuration before producing an application bundle.
  if (['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_KEY', 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'].some(name => env[name])) {
    return validateEnvironment(env, ['preview', 'production', 'production-apk'].includes(env.EAS_BUILD_PROFILE));
  }
  const appEnv = env.EXPO_PUBLIC_APP_ENV || 'development';
  if (!['development', 'staging', 'production'].includes(appEnv)) throw new Error('APP_ENV must be development, staging, or production');
  return { appEnv };
}
module.exports = { validateEnvironment, configEnvironment };
