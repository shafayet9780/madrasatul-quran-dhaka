// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { syncCycle, type CycleState } from './cycle';
import { createDraft, getByToken, saveDraft, submitDraft, type Application } from './drafts';
import { closePayment, confirmPayment, latestPayment, reconcilePending, startPayment } from './payments';
import { retryConfirmationEmails, sendConfirmationEmail, type MailMessage } from './mail';
import { applicationEvents, applications, payments } from './schema';
import type { FormDocument } from './snapshot';
import { sampleSnapshot } from './testing/fixtures';
import { mockGateway, type MockGateway } from './testing/mock-gateway';
import { startTestDb } from './testing/pg';
import type { AdmissionsDb } from './db';

let db: AdmissionsDb;
let stop: () => Promise<void>;
let cycle: CycleState;
let gateway: MockGateway;
const ORIGIN = 'https://www.example.org';

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

/** A submitted (unpaid) application for the given class. */
async function submitted(classValue = 'kg', mobile = '01712345678'): Promise<{ app: Application; token: string }> {
  const started = await createDraft(cycle, { mobile, email: 'a@b.co', locale: 'bengali' });
  if (!started.ok) throw new Error('start failed');
  let app = (await getByToken(started.token))!;
  const file = (k: string, type = 'image/jpeg') => ({ key: `admissions/${app.id}/${k}-x`, name: k, size: 1, type });
  await saveDraft(app, cycle.snapshot, {
    student_photo: file('student_photo'),
    student_name_bn: 'আব্দুল্লাহ',
    student_name_en: 'Abdullah',
    date_of_birth: '2021-03-12',
    class_applied: classValue,
    birth_certificate: file('birth_certificate', 'application/pdf'),
    father_name: 'রফিক',
    father_occupation: 'other',
    father_prayer_location: ['mosque'],
    father_smoking: 'no',
    father_facebook: 'নেই',
    address: 'মিরপুর',
  });
  app = (await getByToken(started.token))!;
  const result = await submitDraft(app, cycle.snapshot, true);
  if (!result.ok) throw new Error(`submit failed: ${JSON.stringify(result)}`);
  return { app: (await getByToken(started.token))!, token: started.token };
}

async function pay(app: Application) {
  const started = await startPayment(app, cycle.snapshot, ORIGIN, gateway);
  if (!started.ok) throw new Error(`pay failed: ${started.reason}`);
  return (await latestPayment(app.id))!;
}

const events = async (id: string) => (await db.select().from(applicationEvents).where(eq(applicationEvents.applicationId, id))).map((e) => e.kind);

describe('startPayment', () => {
  it('opens a session for an unpaid application with the fee from the form, never for a draft', async () => {
    const { app, token } = await submitted();
    expect(await startPayment(app, cycle.snapshot, ORIGIN, null)).toEqual({ ok: false, reason: 'not_configured' });
    const started = await startPayment(app, cycle.snapshot, ORIGIN, gateway);
    expect(started.ok && started.gatewayUrl).toMatch(/^https:\/\/www\.example\.org\/api\/admissions\/sslcommerz\/mock\?tran_id=MQ27-[0-9a-f]{16}$/);
    const payment = (await latestPayment(app.id))!;
    expect(payment).toMatchObject({ status: 'initiated', amount: 500, currency: 'BDT' });
    const session = gateway.attempts.get(payment.tranId)!.request;
    expect(session).toMatchObject({ amount: 500, ipnUrl: `${ORIGIN}/api/admissions/sslcommerz/ipn`, reference: app.id });

    await saveDraft(app, cycle.snapshot, { address: 'উত্তরা' });
    expect(await startPayment((await getByToken(token))!, cycle.snapshot, ORIGIN, gateway)).toEqual({ ok: false, reason: 'not_payable' });
  });

  it('closes the attempt when SSLCommerz refuses the session', async () => {
    const { app } = await submitted();
    gateway.setDown(true);
    expect(await startPayment(app, cycle.snapshot, ORIGIN, gateway)).toEqual({ ok: false, reason: 'gateway' });
    expect((await latestPayment(app.id))!.status).toBe('failed');
  });
});

describe('confirmPayment', () => {
  it('marks the application paid with the next serial for its class, once', async () => {
    const first = await submitted('kg');
    const second = await submitted('kg', '01812345678');
    const nursery = await submitted('nursery', '01912345678');

    const p1 = await pay(first.app);
    const val1 = gateway.complete(p1.tranId, 'pay')!;
    // IPN and the browser return arrive together.
    const results = await Promise.all([confirmPayment(p1.tranId, val1, 'ipn', gateway), confirmPayment(p1.tranId, val1, 'return', gateway)]);
    expect(results.map((r) => r.outcome).sort()).toEqual(['already_paid', 'paid']);
    expect(results.find((r) => r.outcome === 'paid')!.publicRef).toBe('KG-001');

    const p2 = await pay(second.app);
    expect((await confirmPayment(p2.tranId, gateway.complete(p2.tranId, 'pay')!, 'return', gateway)).publicRef).toBe('KG-002');
    const p3 = await pay(nursery.app);
    expect((await confirmPayment(p3.tranId, gateway.complete(p3.tranId, 'pay')!, 'return', gateway)).publicRef).toBe('N-001');

    const [row] = await db.select().from(applications).where(eq(applications.id, first.app.id));
    expect(row).toMatchObject({ status: 'paid', publicRef: 'KG-001', serial: 1 });
    expect(row.paidAt).not.toBeNull();
    expect((await latestPayment(first.app.id))!).toMatchObject({ status: 'valid', cardType: 'BKASH-BKash' });
    expect(await events(first.app.id)).toContain('paid');
    expect(await startPayment(row, cycle.snapshot, ORIGIN, gateway)).toEqual({ ok: false, reason: 'already_paid' });
  });

  it('never trusts the callback: an unknown val_id, a wrong amount or a risky payment does not mark it paid', async () => {
    const { app } = await submitted();
    const p = await pay(app);
    expect((await confirmPayment(p.tranId, 'FORGED', 'return', gateway)).outcome).toBe('not_valid');
    expect(await confirmPayment('MQ27-unknown', 'x', 'ipn', gateway)).toEqual({ outcome: 'unknown_payment' });

    const cheap = gateway.complete(p.tranId, 'wrong_amount')!;
    expect((await confirmPayment(p.tranId, cheap, 'ipn', gateway)).outcome).toBe('held');
    const [row] = await db.select().from(applications).where(eq(applications.id, app.id));
    expect(row.status).toBe('unpaid');
    expect(await events(app.id)).toContain('payment_mismatch');
    expect(await startPayment(row, cycle.snapshot, ORIGIN, gateway)).toEqual({ ok: false, reason: 'under_review' });

    const other = await submitted('kg', '01812345678');
    const p2 = await pay(other.app);
    expect((await confirmPayment(p2.tranId, gateway.complete(p2.tranId, 'risky')!, 'ipn', gateway)).outcome).toBe('held');
    expect(await events(other.app.id)).toContain('payment_held_risk');
  });

  it('leaves the attempt open when SSLCommerz cannot be reached', async () => {
    const { app } = await submitted();
    const p = await pay(app);
    const val = gateway.complete(p.tranId, 'pay')!;
    gateway.setDown(true);
    expect((await confirmPayment(p.tranId, val, 'return', gateway)).outcome).toBe('unreachable');
    expect((await latestPayment(app.id))!.status).toBe('initiated');
    gateway.setDown(false);
    expect((await confirmPayment(p.tranId, val, 'ipn', gateway)).outcome).toBe('paid');
  });

  it('flags a second successful payment for refund', async () => {
    const { app, token } = await submitted();
    const p1 = await pay(app);
    const p2 = await pay(app);
    expect((await confirmPayment(p1.tranId, gateway.complete(p1.tranId, 'pay')!, 'return', gateway)).outcome).toBe('paid');
    const second = await confirmPayment(p2.tranId, gateway.complete(p2.tranId, 'pay')!, 'ipn', gateway);
    expect(second).toMatchObject({ outcome: 'double_payment', publicRef: 'KG-001' });
    expect(await events(app.id)).toContain('double_payment');
    expect((await getByToken(token))!.serial).toBe(1);
  });
});

describe('closing and reconciling attempts', () => {
  it('a fail or cancel return is checked with SSLCommerz first', async () => {
    const { app } = await submitted();
    const p = await pay(app);
    gateway.complete(p.tranId, 'cancel');
    await closePayment(p.tranId, 'failed', gateway);
    expect((await latestPayment(app.id))!.status).toBe('cancelled');

    const p2 = await pay(app);
    const val = gateway.complete(p2.tranId, 'pay')!;
    // A forged "fail" post for a payment that actually went through.
    expect((await closePayment(p2.tranId, 'failed', gateway)).outcome).toBe('paid');
    expect(val).toBeTruthy();
  });

  it('the daily job settles payments whose browser never came back and closes abandoned ones', async () => {
    const a = await submitted('kg');
    const b = await submitted('kg', '01812345678');
    const c = await submitted('kg', '01912345678');
    const pa = await pay(a.app);
    const pb = await pay(b.app);
    const pc = await pay(c.app);
    gateway.complete(pa.tranId, 'pay');
    gateway.complete(pb.tranId, 'fail');
    const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);
    await db.update(payments).set({ createdAt: hoursAgo(1) }).where(eq(payments.id, pa.id));
    await db.update(payments).set({ createdAt: hoursAgo(1) }).where(eq(payments.id, pb.id));
    await db.update(payments).set({ createdAt: hoursAgo(3) }).where(eq(payments.id, pc.id));

    expect(await reconcilePending(30, 50, gateway)).toEqual({ paid: 1, not_valid: 2 });
    expect((await getByToken(a.token))!.publicRef).toBe('KG-001');
    expect((await latestPayment(b.app.id))!.status).toBe('failed');
    expect((await latestPayment(c.app.id))!.status).toBe('failed');
  });
});

describe('recovery', () => {
  it('a confirmation interrupted after the payment was saved completes on the next attempt', async () => {
    const { app, token } = await submitted();
    const p = await pay(app);
    const val = gateway.complete(p.tranId, 'pay')!;
    await db.update(payments).set({ status: 'valid' }).where(eq(payments.id, p.id));
    expect(await confirmPayment(p.tranId, val, 'ipn', gateway)).toMatchObject({ outcome: 'paid', publicRef: 'KG-001' });
    expect((await getByToken(token))!.status).toBe('paid');
  });
});

describe('confirmation email', () => {
  it('is sent once after payment, retried by the daily job after a failure, even without a PDF', async () => {
    process.env.CHROMIUM_EXECUTABLE_PATH = '/nonexistent/chromium';
    process.env.VERCEL = '1'; // no local Chromium and no download in tests: the PDF fails, the email still goes
    process.env.CHROMIUM_PACK_URL = 'http://127.0.0.1:9/none.tar';
    try {
      const { app } = await submitted();
      const p = await pay(app);
      await confirmPayment(p.tranId, gateway.complete(p.tranId, 'pay')!, 'return', gateway);
      const sent: MailMessage[] = [];
      let down = true;
      const mailer = async (m: MailMessage) => (down ? { ok: false as const, reason: 'smtp down' } : (sent.push(m), { ok: true as const }));

      expect(await sendConfirmationEmail(app.id, ORIGIN, mailer)).toEqual({ ok: false, reason: 'smtp down' });
      expect(await events(app.id)).toContain('email_failed');
      await db.update(applications).set({ paidAt: new Date(Date.now() - 60 * 60 * 1000) }).where(eq(applications.id, app.id));
      down = false;
      expect(await retryConfirmationEmails(ORIGIN, 20_000, mailer)).toEqual({ sent: 1, failed: 0 });
      expect(await retryConfirmationEmails(ORIGIN, 20_000, mailer)).toEqual({ sent: 0, failed: 0 });
      expect(await sendConfirmationEmail(app.id, ORIGIN, mailer)).toEqual({ ok: true });
      expect(sent).toHaveLength(1);
      expect(sent[0]).toMatchObject({ to: 'a@b.co', subject: 'আবেদন সম্পন্ন: KG-001, প্রি-অ্যাডমিশন ২০২৭' });
      expect(sent[0].text).toContain(`${ORIGIN}/bengali/pre-admission/find`);
    } finally {
      delete process.env.VERCEL;
      delete process.env.CHROMIUM_EXECUTABLE_PATH;
      delete process.env.CHROMIUM_PACK_URL;
    }
  }, 60_000);
});
