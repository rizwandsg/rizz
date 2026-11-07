const { execFileSync } = require('node:child_process');
const { readFileSync, existsSync, readdirSync } = require('node:fs');
const path = require('node:path');
let tracked = [], all = [];
try {
  tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).split('\0').filter(Boolean);
  all = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
} catch {
  // EAS source archives may omit .git; CI is responsible for the tracking check.
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (['node_modules','dist','.git','.expo','myClerkApp','coverage','android','ios'].includes(entry.name) || entry.name.startsWith('.env')) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(?:[cm]?[jt]sx?|json|ya?ml|md|sql|toml)$/.test(file)) all.push(file);
    }
  }
  walk('.');
  console.log('Source archive: Git tracking checks are handled in CI.');
}
const errors = [];
for (const file of tracked) {
  if (/(^|\/)\.env($|\.)/.test(file) && !file.endsWith('.example')) errors.push(file + ': environment file is tracked');
}
for (const file of new Set(all)) {
  if (!existsSync(file) || /package-lock\.json$|\.(png|jpg|webp|ttf)$/.test(file)) continue;
  const content = readFileSync(file, 'utf8');
  if (/sk_(?:live|test)_[A-Za-z0-9]{20,}|sb_secret_[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) errors.push(file + ': possible embedded secret');
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Secret checks passed (working files only; rotate previously committed credentials).');
