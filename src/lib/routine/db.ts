import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { localOverrides } from '../admissions/local';
import * as schema from './schema';

export type RoutineDb = NeonHttpDatabase<typeof schema>;

let db: RoutineDb | undefined;
let testDb: RoutineDb | undefined;

/**
 * Neon over HTTP with the pooled URL (same database as the survey and admissions). No interactive
 * transactions: multi-statement writes use `db.batch([...])`, which runs as one transaction.
 */
export function getRoutineDb(): RoutineDb {
  if (testDb) return testDb;
  // The local preview (ADMISSIONS_LOCAL=1) shares its in-memory database.
  const local = localOverrides()?.routineDb;
  if (local) return local;
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    db = drizzle(neon(url), { schema });
  }
  return db;
}

/** Tests swap in an in-memory Postgres (see ../admissions/testing/pg.ts). */
export function setRoutineDbForTests(next: RoutineDb | undefined) {
  testDb = next;
}
