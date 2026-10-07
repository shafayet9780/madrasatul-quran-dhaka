import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import * as schema from '../schema';
import { setAdmissionsDbForTests, type AdmissionsDb } from '../db';

// In-memory Postgres (PGlite) with every real migration applied, for database tests that run in
// the normal `pnpm test`. Production uses Neon over HTTP, whose `batch` runs statements in one
// transaction; PGlite has a single connection, so BEGIN … COMMIT around the statements is exact.

const MIGRATIONS = join(process.cwd(), 'drizzle');

export async function startTestDb(): Promise<{ db: AdmissionsDb; client: PGlite; stop: () => Promise<void> }> {
  const client = new PGlite();
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    for (const stmt of readFileSync(join(MIGRATIONS, file), 'utf8').split('--> statement-breakpoint')) {
      if (stmt.trim()) await client.exec(stmt);
    }
  }
  const pg = drizzle(client, { schema });
  const batch = async (queries: readonly PromiseLike<unknown>[]) => {
    await pg.execute(sql`BEGIN`);
    try {
      const results: unknown[] = [];
      for (const q of queries) results.push(await q);
      await pg.execute(sql`COMMIT`);
      return results;
    } catch (e) {
      await pg.execute(sql`ROLLBACK`);
      throw e;
    }
  };
  const db = Object.assign(pg, { batch }) as unknown as AdmissionsDb;
  setAdmissionsDbForTests(db);
  return {
    db,
    client,
    stop: async () => {
      setAdmissionsDbForTests(undefined);
      await client.close();
    },
  };
}
