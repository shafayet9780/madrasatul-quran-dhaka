import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import * as schema from '../schema';
import { setAdmissionsDbForTests, type AdmissionsDb } from '../db';

// In-memory Postgres (PGlite) with every real migration applied, for database tests that run in
// the normal `pnpm test` and for the local preview (see local.ts). Production uses Neon over HTTP,
// whose `batch` runs statements in one transaction; PGlite has a single connection, so
// BEGIN … COMMIT around the statements is exact.

const MIGRATIONS = join(process.cwd(), 'drizzle');

export async function createPgliteDb(): Promise<{ db: AdmissionsDb; client: PGlite }> {
  const client = new PGlite();
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    for (const stmt of readFileSync(join(MIGRATIONS, file), 'utf8').split('--> statement-breakpoint')) {
      if (stmt.trim()) await client.exec(stmt);
    }
  }
  return { db: pgliteDrizzle(client, schema) as unknown as AdmissionsDb, client };
}

/** Drizzle over a PGlite client with Neon's `batch`; also gives the survey its view of the same database. */
export function pgliteDrizzle<S extends Record<string, unknown>>(client: PGlite, tables: S) {
  const pg = drizzle(client, { schema: tables });
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
  return Object.assign(pg, { batch });
}

export async function startTestDb(): Promise<{ db: AdmissionsDb; client: PGlite; stop: () => Promise<void> }> {
  const { db, client } = await createPgliteDb();
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
