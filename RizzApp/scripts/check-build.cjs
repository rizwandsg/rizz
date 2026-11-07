const { spawnSync } = require('node:child_process');
function run(script) {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run('verify');
if (['preview','production'].includes(process.env.EAS_BUILD_PROFILE)) run('check:release');
if (process.env.EAS_BUILD_PROFILE === 'production') run('audit:release');
