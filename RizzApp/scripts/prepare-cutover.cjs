/* global __dirname */
// Generate a reviewable, atomic cutover. This command never contacts a database.
const fs = require('node:fs');
const path = require('node:path');
const tables = ['users','projects','expenses','payments','customer_payments','vendor_payments'];
const root = path.resolve(__dirname, '..');
const readJson = filename => {
  const bytes = fs.readFileSync(filename);
  return JSON.parse(bytes.toString(bytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
};
const literal = value => "'" + String(value).replaceAll("'", "''") + "'";
function prepareCutover(snapshot, mappings, firebaseProject) {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(firebaseProject)) throw new Error('Invalid Firebase project');
  if (!tables.every(table => Array.isArray(snapshot[table]))) throw new Error('Incomplete application snapshot');
  if (!Array.isArray(mappings) || mappings.length !== snapshot.users.length) throw new Error('Review every existing account before cutover');
  const seen = new Set(), identities = new Set();
  for (const mapping of mappings) {
    const user = snapshot.users.find(user => user.id === mapping.profileId);
    if (!user || seen.has(user.id)) throw new Error('Unknown or duplicate profile mapping');
    seen.add(user.id);
    if (mapping.action === 'map') {
      if (typeof mapping.firebaseId !== 'string' || !mapping.firebaseId.length || mapping.firebaseId.length > 128 || identities.has(mapping.firebaseId)) throw new Error('Invalid or duplicate Firebase identity');
      if (mapping.email?.toLowerCase() !== user.email?.toLowerCase()) throw new Error('Reviewed account email mismatch');
      identities.add(mapping.firebaseId);
    } else if (mapping.action !== 'deactivate') throw new Error('Unsupported account action');
  }
  const statements = [
    "BEGIN; SET LOCAL lock_timeout = '15s'; SET LOCAL statement_timeout = '120s';",
    'LOCK TABLE ' + tables.map(table=>'public.'+table).join(',') + ' IN SHARE ROW EXCLUSIVE MODE;',
    'CREATE TEMP TABLE rizz_cutover_snapshot (table_name text PRIMARY KEY, records jsonb NOT NULL) ON COMMIT DROP;',
    ...tables.map(table=>'INSERT INTO rizz_cutover_snapshot VALUES ('+literal(table)+','+literal(JSON.stringify(snapshot[table]))+'::jsonb);'),
    `DO $$ DECLARE item record; actual jsonb; BEGIN
      FOR item IN SELECT * FROM rizz_cutover_snapshot LOOP
        EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),''[]''::jsonb) FROM public.%I t',item.table_name) INTO actual;
        IF actual IS DISTINCT FROM item.records THEN RAISE EXCEPTION 'Snapshot changed for %. Refresh backup and rehearse again.',item.table_name; END IF;
      END LOOP;
    END $$;`,
  ];
  const migrations = ['202611070001_secure_workspaces.sql','202611080001_firebase_identity.sql','202611090001_managed_rizz_ids.sql','202611090002_non_deliverable_rizz_logins.sql'];
  for (const file of migrations) statements.push(fs.readFileSync(path.join(root,'supabase/migrations',file),'utf8').replace(/^\s*(?:BEGIN|COMMIT);\s*$/gm,''));
  statements.push('INSERT INTO private.identity_configuration(firebase_project_id) VALUES ('+literal(firebaseProject)+');');
  for (const mapping of mappings) {
    if (mapping.action === 'map') statements.push('UPDATE public.users SET firebase_user_id='+literal(mapping.firebaseId)+' WHERE id='+literal(mapping.profileId)+'::uuid;');
    else statements.push('UPDATE public.users SET is_active=false WHERE id='+literal(mapping.profileId)+'::uuid;');
  }
  const expectedUsers=snapshot.users.map(user=>{
    const mapping=mappings.find(mapping=>mapping.profileId===user.id);
    return {...user,rizz_id:null,managed_login:false,managed_auth_version:0,firebase_user_id:mapping.action==='map'?mapping.firebaseId:null,...(mapping.action==='deactivate'?{is_active:false}:{})};
  });
  statements.push('UPDATE rizz_cutover_snapshot SET records='+literal(JSON.stringify(expectedUsers))+'::jsonb WHERE table_name=\'users\';');
  statements.push(`DO $$ DECLARE item record; actual jsonb; BEGIN
    FOR item IN SELECT * FROM rizz_cutover_snapshot LOOP
      EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),''[]''::jsonb) FROM public.%I t',item.table_name) INTO actual;
      IF actual IS DISTINCT FROM item.records THEN RAISE EXCEPTION 'Unexpected record change in %. Cutover rolled back.',item.table_name; END IF;
    END LOOP;
    IF EXISTS (SELECT 1 FROM public.users WHERE is_active AND firebase_user_id IS NULL) THEN RAISE EXCEPTION 'Active identity is unmapped'; END IF;
    IF public.backend_contract_version() <> 5 THEN RAISE EXCEPTION 'Backend contract is not ready'; END IF;
  END $$;`);
  statements.push('CREATE SCHEMA IF NOT EXISTS supabase_migrations; CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version text PRIMARY KEY, statements text[], name text);');
  for(const file of migrations) {
    const version=file.split('_')[0], name=file.slice(version.length+1,-4);
    statements.push('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES ('+literal(version)+','+literal(name)+',ARRAY['+literal(fs.readFileSync(path.join(root,'supabase/migrations',file),'utf8'))+']);');
  }
  statements.push("NOTIFY pgrst, 'reload schema'; COMMIT;");
  return statements.join('\n\n')+'\n';
}
module.exports = { prepareCutover };
if (require.main === module) {
  try {
    const [snapshotFile,mappingsFile,firebaseProject,outputFile] = process.argv.slice(2);
    if (!outputFile) throw new Error('Usage: node scripts/prepare-cutover.cjs SNAPSHOT_JSON MAPPINGS_JSON FIREBASE_PROJECT OUTPUT_SQL');
    const snapshot=readJson(snapshotFile).rows[0].application_data;
    fs.writeFileSync(outputFile,prepareCutover(snapshot,readJson(mappingsFile),firebaseProject),{flag:'wx'});
    console.log('Cutover prepared. Rehearse this exact file before applying it. It contains private snapshot data; keep it out of source control and deployment uploads.');
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
