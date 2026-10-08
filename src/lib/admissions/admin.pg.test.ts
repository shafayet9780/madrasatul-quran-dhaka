// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { addNote, adminCycle, applicationCounts, applicationDetail, deleteUnpaid, listApplications, overview, setEvaluationDay, setStatuses } from './admin';
import { syncCycle, type CycleState } from './cycle';
import { createDraft, getByToken, saveDraft, submitDraft, type Application } from './drafts';
import { acceptHeldPayment, confirmPayment, latestPayment, startPayment } from './payments';
import { applicationEvents, applications } from './schema';
import type { FormDocument } from './snapshot';
import { sampleSnapshot } from './testing/fixtures';
import { mockGateway, type MockGateway } from './testing/mock-gateway';
import { startTestDb } from './testing/pg';
import type { AdmissionsDb } from './db';
import type { BlobStore } from './uploads';

let db: AdmissionsDb;
let stop: () => Promise<void>;
let cycle: CycleState;
let gateway: MockGateway;

beforeAll(async () => {
  ({ db, stop } = await startTestDb());
});
afterAll(async () => stop());
beforeEach(async () => {
  await db.execute(sql`TRUNCATE admission_cycles, applications, application_events, payments, application_serials RESTART IDENTITY CASCADE`);
  const s = sampleSnapshot();
  const doc: FormDocument = {
    _rev: 'r1',
    formSettings: { isEnabled: true },
    declarationText: s.settings.declaration,
    cycle: { session: '2027', applicationFee: 500, evaluationFee: 500, closesAt: '2099-01-01T00:00:00Z' },
    sections: structuredClone(s.sections),
  };
  cycle = (await syncCycle(doc))!;
  gateway = mockGateway();
});

async function application(opts: { name: string; mobile: string; classValue?: string; pay?: 'pay' | 'risky' | false; submit?: boolean }): Promise<Application> {
  const started = await createDraft(cycle, { mobile: opts.mobile, email: 'a@b.co', locale: 'bengali' });
  if (!started.ok) throw new Error('start');
  let app = (await getByToken(started.token))!;
  const file = (k: string, type = 'image/jpeg') => ({ key: `admissions/${app.id}/${k}-x`, name: k, size: 1, type });
  await saveDraft(app, cycle.snapshot, {
    student_photo: file('student_photo'),
    student_name_bn: opts.name,
    student_name_en: 'Student',
    date_of_birth: '2021-03-12',
    class_applied: opts.classValue ?? 'kg',
    birth_certificate: file('birth_certificate', 'application/pdf'),
    father_name: 'রফিক',
    father_occupation: 'other',
    father_prayer_location: ['mosque'],
    father_smoking: 'no',
    father_facebook: 'নেই',
    address: 'মিরপুর',
  });
  if (opts.submit === false) return (await getByToken(started.token))!;
  app = (await getByToken(started.token))!;
  await submitDraft(app, cycle.snapshot, true);
  app = (await getByToken(started.token))!;
  if (opts.pay) {
    await startPayment(app, cycle.snapshot, 'https://x.org', gateway);
    const p = (await latestPayment(app.id))!;
    await confirmPayment(p.tranId, gateway.complete(p.tranId, opts.pay)!, 'ipn', gateway);
  }
  return (await getByToken(started.token))!;
}

describe('admin queries', () => {
  it('lists paid and unpaid applications with search and filters', async () => {
    const a = await application({ name: 'আব্দুল্লাহ', mobile: '01712345678', pay: 'pay' });
    await application({ name: 'আয়েশা', mobile: '01812345678', classValue: 'nursery', pay: 'pay' });
    await application({ name: 'উমর', mobile: '01912345678' });
    await application({ name: 'হাসান', mobile: '01612345678', submit: false });

    expect((await adminCycle())!.session).toBe('2027');
    expect(await applicationCounts(cycle.cycleId)).toEqual({ paid: 2, unpaid: 2 });
    const paid = await listApplications(cycle.cycleId, { tab: 'paid' });
    expect(paid.rows.map((r) => r.publicRef)).toEqual(['N-001', 'KG-001']);
    expect(paid.rows[1].paymentAttempts).toBe(1);
    expect((await listApplications(cycle.cycleId, { tab: 'paid', q: 'kg 1', classCodes: ['N', 'KG', 'C1', 'C4'] })).rows.map((r) => r.id)).toEqual([a.id]);
    expect((await listApplications(cycle.cycleId, { tab: 'paid', q: '০১৭১২' })).rows.map((r) => r.id)).toEqual([a.id]);
    expect((await listApplications(cycle.cycleId, { tab: 'paid', q: 'আয়েশা' })).total).toBe(1);
    expect((await listApplications(cycle.cycleId, { tab: 'paid', classCode: 'N' })).total).toBe(1);
    expect((await listApplications(cycle.cycleId, { tab: 'unpaid' })).total).toBe(2);
    expect((await listApplications(cycle.cycleId, { tab: 'unpaid', status: 'draft' })).rows.map((r) => r.studentNameBn)).toEqual(['হাসান']);
  });

  it('changes status, marks evaluation day, keeps notes, and logs each', async () => {
    const a = await application({ name: 'আব্দুল্লাহ', mobile: '01712345678', pay: 'pay' });
    const unpaid = await application({ name: 'উমর', mobile: '01912345678' });
    expect(await setStatuses([a.id, unpaid.id], 'interview')).toBe(1);
    expect(await setStatuses([a.id], 'interview')).toBe(0);
    expect(await setEvaluationDay(a.id, 'attended', true)).toBe(true);
    expect(await setEvaluationDay(a.id, 'evalFee', true, 'R-102')).toBe(true);
    expect(await setEvaluationDay(unpaid.id, 'attended', true)).toBe(false);
    expect(await addNote(a.id, '  পরিবহন দরকার  ')).toBe(true);
    expect(await addNote(a.id, '   ')).toBe(false);

    const detail = (await applicationDetail(a.id))!;
    expect(detail.app).toMatchObject({ status: 'interview' });
    expect(detail.app.attendedAt).not.toBeNull();
    expect(detail.app.evalFeeReceivedAt).not.toBeNull();
    expect(detail.payments).toHaveLength(1);
    expect(detail.events.map((e) => e.kind)).toEqual(expect.arrayContaining(['note', 'eval_fee', 'attended', 'status', 'paid']));
    expect(detail.events.find((e) => e.kind === 'eval_fee')!.detail).toEqual({ receiptNo: 'R-102' });
    expect(detail.events.find((e) => e.kind === 'note')!.detail).toEqual({ text: 'পরিবহন দরকার' });
    expect(await applicationDetail('nope')).toBeNull();
  });

  it('deletes an unpaid application with its documents, never a paid one', async () => {
    const deleted: string[] = [];
    const store: BlobStore = { put: async () => {}, get: async () => null, del: async (p) => void deleted.push(p) };
    const paid = await application({ name: 'আব্দুল্লাহ', mobile: '01712345678', pay: 'pay' });
    const unpaid = await application({ name: 'উমর', mobile: '01912345678' });
    expect(await deleteUnpaid(paid.id, store)).toBe('paid');
    expect(await deleteUnpaid(unpaid.id, store)).toBe('deleted');
    expect(deleted.sort()).toEqual([`admissions/${unpaid.id}/birth_certificate-x`, `admissions/${unpaid.id}/student_photo-x`]);
    expect(await db.select().from(applications).where(eq(applications.id, unpaid.id))).toEqual([]);
    const log = await db.select().from(applicationEvents).where(eq(applicationEvents.kind, 'deleted'));
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ applicationId: null, label: 'উমর' });
    expect(await deleteUnpaid(unpaid.id, store)).toBe('not_found');
  });

  it('a held payment accepted by the office gets the next ID', async () => {
    const risky = await application({ name: 'আয়েশা', mobile: '01812345678', pay: 'risky' });
    expect(risky.publicRef).toBeNull();
    const p = (await latestPayment(risky.id))!;
    expect(p.status).toBe('held');
    expect(await deleteUnpaid(risky.id)).toBe('paid');
    expect(await acceptHeldPayment(p.id)).toMatchObject({ outcome: 'paid', publicRef: 'KG-001' });
    expect(await acceptHeldPayment(p.id)).toEqual({ outcome: 'not_valid' });
  });

  it('summarises the cycle for the overview', async () => {
    const a = await application({ name: 'আব্দুল্লাহ', mobile: '01712345678', pay: 'pay' });
    await application({ name: 'আয়েশা', mobile: '01812345678', classValue: 'nursery', pay: 'pay' });
    await application({ name: 'উমর', mobile: '01912345678' });
    await setEvaluationDay(a.id, 'attended', true);
    const o = await overview(cycle.cycleId, null);
    expect(o).toMatchObject({ paid: 2, unpaid: 1, drafts: 0, attended: 1, evalFees: 0 });
    expect(o.byClass.sort((x, y) => x.classCode.localeCompare(y.classCode))).toEqual([
      { classCode: 'KG', count: 1 },
      { classCode: 'N', count: 1 },
    ]);
    expect(o.byDay).toHaveLength(1);
    expect(o.byDay[0].count).toBe(2);
    expect(o.recent).toHaveLength(2);
  });
});
