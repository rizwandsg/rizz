/* global __dirname */
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const fs=require('node:fs');
const {assertWebRuntime}=require('../config/bundle-environment.cjs');
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
  const scripts=path.join(root,'dist/_expo/static/js/web');
  const content=fs.readdirSync(scripts,{recursive:true}).map(String).filter(file=>file.endsWith('.js')).map(file=>fs.readFileSync(path.join(scripts,file),'utf8')).join('\n');
  assertWebRuntime(content,env);
  console.log('Exported web settings match the production services.');
} catch (error) { console.error(error.message); process.exitCode=1; }
