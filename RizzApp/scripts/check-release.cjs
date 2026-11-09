if (process.env.EXPO_NO_DOTENV !== '1') require('dotenv').config({ quiet: true });
const { validateEnvironment } = require('../config/runtime-config.cjs');
const runtime = validateEnvironment(process.env, true);
async function check() {
  const response = await fetch(runtime.supabaseUrl.replace(/\/$/,'') + '/rest/v1/rpc/backend_contract_version', { method: 'POST', headers: { apikey: runtime.supabaseKey, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000) });
  if (!response.ok || await response.json() !== 3) throw new Error('The configured backend has not passed the version 3 migration');
  const identity = await fetch(runtime.supabaseUrl.replace(/\/$/,'') + '/rest/v1/rpc/backend_auth_configuration', { method: 'POST', headers: { apikey: runtime.supabaseKey, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000) });
  const configuration = identity.ok ? await identity.json() : null;
  if (configuration?.provider !== 'firebase' || configuration.project_id !== runtime.firebaseProject) throw new Error('Backend Firebase project does not match this release');
  console.log('Release environment and backend contract passed. Device acceptance is a separate gate.');
}
check().catch(error => { console.error(error.message); process.exitCode = 1; });
