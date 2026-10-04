import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export type SurveyDb = NeonHttpDatabase<typeof schema>;

let db: SurveyDb | undefined;

/**
 * Neon over HTTP with the pooled URL. The HTTP driver has no interactive transactions;
 * multi-statement writes use `db.batch([...])`, which runs as one transaction.
 */
export function getDb(): SurveyDb {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    db = drizzle(neon(url), { schema });
  }
  return db;
}
