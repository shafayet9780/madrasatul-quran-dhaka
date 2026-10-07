import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export type AdmissionsDb = NeonHttpDatabase<typeof schema>;

let db: AdmissionsDb | undefined;
let testDb: AdmissionsDb | undefined;

/**
 * Neon over HTTP with the pooled URL (same database as the survey). No interactive transactions:
 * multi-statement writes use `db.batch([...])`, which runs as one transaction.
 */
export function getAdmissionsDb(): AdmissionsDb {
  if (testDb) return testDb;
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    db = drizzle(neon(url), { schema });
  }
  return db;
}

/** Tests swap in an in-memory Postgres (see testing/pg.ts). */
export function setAdmissionsDbForTests(next: AdmissionsDb | undefined) {
  testDb = next;
}
