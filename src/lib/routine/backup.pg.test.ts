// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import type { PGlite } from '@electric-sql/pglite';

const { put, list, del } = vi.hoisted(() => ({ put: vi.fn(), list: vi.fn(async () => ({ blobs: [] })), del: vi.fn() }));
vi.mock('@vercel/blob', () => ({ put, list, del }));

import { createPgliteDb, pgliteDrizzle } from '../admissions/testing/pg';
import { backupRoutineTables } from './backup';
import { setRoutineDbForTests, type RoutineDb } from './db';
import * as schema from './schema';

let client: PGlite;

beforeAll(async () => {
  ({ client } = await createPgliteDb());
  setRoutineDbForTests(pgliteDrizzle(client, schema) as unknown as RoutineDb);
  const { loadRoutineFixtures } = await import('./testing/dev-fixtures');
  await loadRoutineFixtures();
});
afterAll(async () => {
  setRoutineDbForTests(undefined);
  vi.unstubAllEnvs();
  await client.close();
});

describe('routine backup', () => {
  it('skips without the private store', async () => {
    vi.stubEnv('PG_BACKUP_BLOB_READ_WRITE_TOKEN', '');
    expect(await backupRoutineTables()).toEqual({ skipped: expect.stringContaining('PG_BACKUP_BLOB_READ_WRITE_TOKEN') });
  });

  it('writes every routine table to routine-backups/<date>.json, privately', async () => {
    vi.stubEnv('PG_BACKUP_BLOB_READ_WRITE_TOKEN', 'token');
    const result = await backupRoutineTables(new Date('2026-10-18T21:00:00Z'));
    expect(result).toMatchObject({ pathname: 'routine-backups/2026-10-18.json', removed: 0 });
    const [pathname, body, options] = put.mock.calls[0] as unknown as [string, string, { access: string }];
    expect(pathname).toBe('routine-backups/2026-10-18.json');
    expect(options.access).toBe('private');
    const tables = Object.values(schema)
      .filter((v) => v instanceof PgTable)
      .map((t) => getTableName(t as PgTable))
      .sort();
    const saved = JSON.parse(body).tables;
    expect(Object.keys(saved).sort()).toEqual(tables);
    expect(saved.routine_teachers.length).toBeGreaterThan(0);
    expect(saved.routine_assignments.length).toBe(29);
  });
});
