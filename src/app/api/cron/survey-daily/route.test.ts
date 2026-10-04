import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mirrorPending, backupSurveyTables, pruneDryRuns } = vi.hoisted(() => ({ mirrorPending: vi.fn(), backupSurveyTables: vi.fn(), pruneDryRuns: vi.fn() }));
vi.mock('@/lib/survey/sheets-mirror', () => ({ mirrorPending }));
vi.mock('@/lib/survey/backup', () => ({ backupSurveyTables }));
vi.mock('@/lib/survey/erp-import-server', () => ({ pruneDryRuns }));

import { GET } from './route';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const request = (secret?: string) =>
  new NextRequest('https://school.test/api/cron/survey-daily', { headers: secret ? { authorization: `Bearer ${secret}` } : {} });

describe('survey daily cron', () => {
  it('needs the cron secret', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await GET(request('x'))).status).toBe(503);
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request('wrong'))).status).toBe(401);
    expect(mirrorPending).not.toHaveBeenCalled();
  });

  it('retries sheet copies and backs up', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    mirrorPending.mockResolvedValue({ mirrored: 2, failed: 0 });
    backupSurveyTables.mockResolvedValue({ pathname: 'survey-backups/2026-10-04.json', bytes: 10, removed: 0 });
    pruneDryRuns.mockResolvedValue(3);
    const response = await GET(request('cron-secret'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sheet: { mirrored: 2, failed: 0 },
      backup: { pathname: 'survey-backups/2026-10-04.json', bytes: 10, removed: 0 },
      prunedDryRuns: 3,
    });
  });

  it('still backs up when the sheet copy throws, and reports failure', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    mirrorPending.mockRejectedValue(new Error('quota'));
    backupSurveyTables.mockResolvedValue({ pathname: 'p', bytes: 1, removed: 0 });
    const response = await GET(request('cron-secret'));
    expect(response.status).toBe(500);
    expect(backupSurveyTables).toHaveBeenCalled();
    expect((await response.json()).sheet).toEqual({ error: 'quota' });
  });

  it('fails in production when the backup or sheet copy is not configured', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    vi.stubEnv('VERCEL_ENV', 'production');
    mirrorPending.mockResolvedValue({ mirrored: 0, failed: 0 });
    backupSurveyTables.mockResolvedValue({ skipped: 'SURVEY_BACKUP_BLOB_READ_WRITE_TOKEN is not set (private Blob store)' });
    pruneDryRuns.mockResolvedValue(0);
    expect((await GET(request('cron-secret'))).status).toBe(500);
  });
});
