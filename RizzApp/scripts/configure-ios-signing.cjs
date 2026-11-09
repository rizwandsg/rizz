/* global __dirname */
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadProductionEnvironment } = require('./production-env.cjs');
try {
  const root=path.resolve(__dirname,'..');
  const env=loadProductionEnvironment(root);
  const result=spawnSync(process.platform==='win32'?'eas.cmd':'eas',
    ['credentials:configure-build','--platform','ios','--profile','production'],
    {cwd:root,env,stdio:'inherit',shell:process.platform==='win32'});
  if(result.error)throw result.error;
  process.exitCode=result.status??1;
} catch(error){console.error(error.message);process.exitCode=1;}
