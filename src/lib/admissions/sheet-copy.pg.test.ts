// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';

// A fake spreadsheet: tab titles and rows, as the Sheets API would keep them.
const sheet = vi.hoisted(() => ({ tabs: new Set<string>(), rows: [] as string[][], fail: false }));
vi.mock('@/lib/google-sheets-server', () => ({
  sheetsConfigured: () => true,
  getSheetsClient: () => ({
    spreadsheets: {
      get: async () => ({ data: { sheets: [...sheet.tabs].map((title) => ({ properties: { title } })) } }),
      batchUpdate: async ({ requestBody }: { requestBody: { requests: { addSheet: { properties: { title: string } } }[] } }) => {
        sheet.tabs.add(requestBody.requests[0].addSheet.properties.title);
      },
      values: {
        update: async ({ range, requestBody }: { range: string; requestBody: { values: string[][] } }) => {
          const row = Number(/!A(\d+)$/.exec(range)![1]);
          sheet.rows[row - 1] = requestBody.values[0];
        },
        get: async () => ({ data: { values: sheet.rows.map((r) => [r[0]]) } }),
        append: async ({ requestBody, range }: { requestBody: { values: string[][] }; range: string }) => {
          if (sheet.fail) throw new Error('quota');
          sheet.rows.push(requestBody.values[0]);
          return { data: { updates: { updatedRange: `${range.split('!')[0]}!A${sheet.rows.length}:Z${sheet.rows.length}` } } };
        },
      },
    },
  }),
}));

import { setStatuses } from './admin';
import { syncCycle, type CycleState } from './cycle';
import { createDraft, getByToken, saveDraft, submitDraft } from './drafts';
import { confirmPayment, latestPayment, startPayment } from './payments';
import { copyPendingToSheet, sheetTabName } from './sheet-copy';
import type { FormDocument } from './snapshot';
import { sampleSnapshot } from './testing/fixtures';
import { mockGateway } from './testing/mock-gateway';
import { startTestDb } from './testing/pg';
import type { AdmissionsDb } from './db';

let db: AdmissionsDb;
let stop: () => Promise<void>;
let cycle: CycleState;

beforeAll(async () => {
  ({ db, stop } = await startTestDb());
  vi.stubEnv('FORM_GOOGLE_SHEETS_ID', 'sheet-1');
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await stop();
});
beforeEach(async () => {
  await db.execute(sql`TRUNCATE admission_cycles, applications, application_events, payments, application_serials RESTART IDENTITY CASCADE`);
  sheet.tabs.clear();
  sheet.rows = [];
  sheet.fail = false;
  const s = sampleSnapshot();
  const doc: FormDocument = {
    _rev: 'r1',
    formSettings: { isEnabled: true },
    declarationText: s.settings.declaration,
    cycle: { session: '2027', applicationFee: 500, evaluationFee: 500, closesAt: '2099-01-01T00:00:00Z' },
    sections: structuredClone(s.sections),
  };
  cycle = (await syncCycle(doc))!;
});

async function paidApplication(name: string, mobile: string) {
  const gateway = mockGateway();
  const started = await createDraft(cycle, { mobile, email: 'a@b.co', locale: 'bengali' });
  if (!started.ok) throw new Error('start');
  let app = (await getByToken(started.token))!;
  const file = (k: string) => ({ key: `admissions/${app.id}/${k}`, name: k, size: 1, type: 'image/jpeg' });
  await saveDraft(app, cycle.snapshot, {
    student_photo: file('p'),
    student_name_bn: name,
    student_name_en: 'Student',
    date_of_birth: '2021-03-12',
    class_applied: 'kg',
    birth_certificate: file('b'),
    father_name: 'রফিক',
    father_occupation: 'other',
    father_prayer_location: ['mosque'],
    father_smoking: 'no',
    father_facebook: 'নেই',
    address: 'মিরপুর',
  });
  app = (await getByToken(started.token))!;
  await submitDraft(app, cycle.snapshot, true);
  app = (await getByToken(started.token))!;
  await startPayment(app, cycle.snapshot, 'https://x.org', gateway);
  const p = (await latestPayment(app.id))!;
  await confirmPayment(p.tranId, gateway.complete(p.tranId, 'pay')!, 'ipn', gateway);
  return (await getByToken(started.token))!;
}

describe('sheet copy', () => {
  it('adds each paid application once, then rewrites its row after an office change', async () => {
    const a = await paidApplication('আব্দুল্লাহ', '01712345678');
    await paidApplication('উমর', '01912345678');
    expect(await copyPendingToSheet()).toEqual({ copied: 2, failed: 0 });
    expect([...sheet.tabs]).toEqual([sheetTabName('2027')]);
    expect(sheetTabName('2027')).toBe('ভর্তি ২০২৭');
    expect(sheet.rows.map((r) => r[0])).toEqual(['আবেদন আইডি', 'KG-001', 'KG-002']);
    expect(await copyPendingToSheet()).toEqual({ copied: 0, failed: 0 });

    await setStatuses([a.id], 'admitted');
    expect(await copyPendingToSheet()).toEqual({ copied: 1, failed: 0 });
    expect(sheet.rows).toHaveLength(3);
    expect(sheet.rows[1].slice(0, 2)).toEqual(['KG-001', 'ভর্তি']);
  });

  it('a failed write is retried on the next run', async () => {
    await paidApplication('আব্দুল্লাহ', '01712345678');
    sheet.fail = true;
    expect(await copyPendingToSheet()).toEqual({ copied: 0, failed: 1 });
    sheet.fail = false;
    expect(await copyPendingToSheet()).toEqual({ copied: 1, failed: 0 });
    expect(sheet.rows.map((r) => r[0])).toEqual(['আবেদন আইডি', 'KG-001']);
  });
});
