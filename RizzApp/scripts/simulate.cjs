/* global __dirname */
// Run all isolated simulations and retain machine-readable evidence for review.
const { spawnSync } = require('node:child_process');
const { mkdirSync, readFileSync, writeFileSync, readdirSync } = require('node:fs');
const { createHash } = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-results');
mkdirSync(output, { recursive: true });
const result = spawnSync(process.execPath, [path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs'), 'run', '--reporter=default', '--reporter=json', '--outputFile.json=test-results/simulation.json'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, EXPO_NO_DOTENV: '1', APP_ENV: 'development', EAS_BUILD_PROFILE: '',
    EXPO_PUBLIC_SUPABASE_URL: 'https://simulation.invalid', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_simulation',
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'rizz-simulation' },
});
const files = ['app','api','components','context','hooks','services','supabase','tests','config','scripts','types'].flatMap(directory =>
  readdirSync(path.join(root,directory), { recursive: true }).map(String)
    .filter(file => /\.(tsx?|sql|cjs)$/.test(file)).map(file => path.join(directory,file))
).concat(['package.json','package-lock.json','vitest.config.mts','app.config.js','metro.config.js','eas.json','.easignore','../.easignore','.vercelignore','vercel.json']).sort();
const hash = createHash('sha256');
for (const file of files) { hash.update(file.replaceAll('\\','/')); hash.update('\0'); hash.update(readFileSync(path.join(root,file))); }
writeFileSync(path.join(output,'simulation-manifest.json'), JSON.stringify({
  completedAt: new Date().toISOString(), node: process.version, platform: process.platform,
  sourceSha256: hash.digest('hex'), exitCode: result.status ?? 1,
  boundaries: 'React screen components with mocked native/API/Firebase adapters; real SQL migrations in isolated PGlite. No device or hosted authentication verification.',
  resultFile: 'simulation.json',
}, null, 2) + '\n');
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
