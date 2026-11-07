require('dotenv').config({ quiet: true });
const { validateEnvironment } = require('../config/runtime-config.cjs');
const runtime = validateEnvironment(process.env, true);
async function check() {
  const response = await fetch(runtime.supabaseUrl.replace(/\/$/,'') + '/rest/v1/rpc/backend_contract_version', { method: 'POST', headers: { apikey: runtime.supabaseKey, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000) });
  if (!response.ok || await response.json() !== 2) throw new Error('The configured backend has not passed the version 2 migration');
  console.log('Release environment and backend contract passed. Device acceptance is a separate gate.');
}
check().catch(error => { console.error(error.message); process.exitCode = 1; });
