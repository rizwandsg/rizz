import { readFileSync } from 'node:fs';
import ignore from 'ignore';
import { expect, it } from 'vitest';
const rules=ignore().add(readFileSync(new URL('../../.easignore',import.meta.url),'utf8'));
it.each([
 '.git/config','.git/objects/pack/history.pack',
 'RizzApp/.env','RizzApp/.env.local','RizzApp/.env.production.local','RizzApp/.env.deploy.local',
 'RizzApp/test-results/hosted-audit/application-snapshot.json',
 'RizzApp/test-results/auth-migration/firebase-service-account-private.json',
 'RizzApp/.vercel/project.json','RizzApp/.expo/types/router.d.ts',
 'RizzApp/firebase-debug.log','RizzApp/credentials.json','RizzApp/signing.p12',
 'RizzApp/supabase/.temp/project-ref','RizzApp/node_modules/firebase/package.json',
])('excludes private or generated input from the monorepo archive: %s',file=>{expect(rules.ignores(file)).toBe(true);});
it.each([
 'RizzApp/app.config.js','RizzApp/config/runtime-config.cjs','RizzApp/package-lock.json',
 'RizzApp/services/firebaseIdentity.ts','RizzApp/tests/role-simulation.test.ts',
 'RizzApp/tests/fixtures/hosted-legacy-schema.sql','RizzApp/assets/icon.png',
])('retains required build and verification input: %s',file=>{expect(rules.ignores(file)).toBe(false);});
