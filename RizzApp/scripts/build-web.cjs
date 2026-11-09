/* global __dirname */
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadProductionEnvironment } = require('./production-env.cjs');
try {
  const root = path.resolve(__dirname, '..');
  const env = { ...loadProductionEnvironment(root), CI: '1' };
  for (const args of [
    [path.join(root,'scripts/check-release.cjs')],
    [path.join(root,'node_modules/expo/bin/cli'),'export','--platform','web','--max-workers','2','--output-dir','dist'],
  ]) {
    const result = spawnSync(process.execPath, args, {cwd:root, env, stdio:'inherit'});
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
} catch (error) { console.error(error.message); process.exitCode=1; }
