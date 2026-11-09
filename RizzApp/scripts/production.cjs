/* global __dirname */
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadProductionEnvironment } = require('./production-env.cjs');

const root = path.resolve(__dirname, '..');
const action = process.argv[2] || 'check';
if (!['check', 'android', 'android-apk', 'ios'].includes(action)) {
  console.error('Use: node scripts/production.cjs [check|android|android-apk|ios]');
  process.exit(1);
}

try {
  const env = loadProductionEnvironment(root);
  const run = (command, args) => {
    const result = spawnSync(process.platform === 'win32' ? `${command}.cmd` : command, args,
      { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  };
  // All release checks run locally before an EAS build can consume a build slot.
  run('npm', ['run', 'check:release']);
  run('npm', ['run', 'audit:release']);
  run('npm', ['run', 'verify']);
  run('npm', ['run', 'bundle:check', '--', 'ios']);
  if (action !== 'check') {
    // The same complete public configuration must be available to the remote
    // worker. Validate the file alone before uploading it; never upload .env.
    loadProductionEnvironment(root, {});
    run('eas', ['env:push', 'production', '--path', '.env.production.local', '--force']);
    run('eas', ['build', '--platform', action === 'android-apk' ? 'android' : action, '--profile', action === 'android-apk' ? 'production-apk' : 'production']);
  } else {
    console.log('Production preflight passed. Store signing and device acceptance remain separate checks.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
