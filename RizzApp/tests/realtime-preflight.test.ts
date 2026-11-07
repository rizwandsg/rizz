import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('read-only preflight refuses private-table DELETE publication and accepts insert/update only', async () => {
  const db=new PGlite();
  try {
    const sql=readFileSync('supabase/preflight.sql','utf8').split('-- BEGIN REALTIME DELETE SAFETY CHECK')[1];
    await db.exec('CREATE TABLE public.projects(id integer); CREATE PUBLICATION supabase_realtime FOR TABLE public.projects;');
    await expect(db.exec(sql)).rejects.toThrow('Unsafe Realtime DELETE publication');
    await db.exec("ALTER PUBLICATION supabase_realtime SET (publish='insert, update');");
    await expect(db.exec(sql)).resolves.toBeDefined();
  } finally { await db.close(); }
});
