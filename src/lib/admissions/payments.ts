import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, desc, eq, inArray, lt, ne, sql } from 'drizzle-orm';
import { getAdmissionsDb } from './db';
import { label, logEvent, type Application } from './drafts';
import { formatMobile } from './normalise';
import type { FormSnapshot } from './form-config';
import { localOverrides } from './local';
import { applications, payments } from './schema';
import { judgeTransaction, sslCommerzGateway, sslConfigFromEnv, type Gateway, type GatewayTransaction } from './sslcommerz';

// The application fee: one `payments` row per attempt. An application becomes paid, and gets its
// ID (KG-017), only after the SSLCommerz validation API confirms our tran_id, amount and currency.
// Browser returns, the IPN and reconciliation all end in the same idempotent settle().

export type Payment = typeof payments.$inferSelect;

/** The configured gateway: the local preview's stand-in, or SSLCommerz from the environment. */
export function paymentGateway(): Gateway | null {
  const local = localOverrides()?.gateway;
  if (local) return local;
  const cfg = sslConfigFromEnv();
  return cfg ? sslCommerzGateway(cfg) : null;
}

export async function latestPayment(applicationId: string): Promise<Payment | null> {
  const [row] = await getAdmissionsDb().select().from(payments).where(eq(payments.applicationId, applicationId)).orderBy(desc(payments.createdAt)).limit(1);
  return row ?? null;
}

export type StartPaymentResult =
  | { ok: true; gatewayUrl: string }
  | { ok: false; reason: 'not_configured' | 'not_payable' | 'already_paid' | 'under_review' | 'gateway' };

/** Opens a hosted checkout session for an unpaid application. The amount comes from the form snapshot. */
export async function startPayment(app: Application, snapshot: FormSnapshot, origin: string, gateway = paymentGateway()): Promise<StartPaymentResult> {
  if (!gateway) return { ok: false, reason: 'not_configured' };
  if (app.status !== 'unpaid') return { ok: false, reason: app.publicRef ? 'already_paid' : 'not_payable' };
  const db = getAdmissionsDb();
  const settled = await db
    .select({ status: payments.status })
    .from(payments)
    .where(and(eq(payments.applicationId, app.id), inArray(payments.status, ['valid', 'held'])));
  if (settled.some((p) => p.status === 'valid')) return { ok: false, reason: 'already_paid' };
  if (settled.length) return { ok: false, reason: 'under_review' };

  const amount = snapshot.settings.applicationFee;
  const tranId = `MQ${snapshot.settings.session.slice(-2)}-${randomBytes(8).toString('hex')}`;
  const [payment] = await db.insert(payments).values({ applicationId: app.id, tranId, amount }).returning();
  const callback = (path: string) => `${origin}/api/admissions/sslcommerz/${path}`;
  const result = await gateway.createSession({
    tranId,
    amount,
    successUrl: callback('success'),
    failUrl: callback('fail'),
    cancelUrl: callback('cancel'),
    ipnUrl: callback('ipn'),
    productName: `Pre-admission ${snapshot.settings.session} application fee`,
    customer: {
      name: app.fatherName || app.motherName || app.studentNameEn || app.studentNameBn || 'Guardian',
      email: app.email,
      phone: formatMobile(app.primaryMobile).replace('-', ''),
      address: typeof app.answers.present_address === 'string' ? app.answers.present_address : 'Dhaka',
    },
    reference: app.id,
  });
  if (!result.ok) {
    await db.update(payments).set({ status: 'failed', gatewayResponse: { sessionError: result.reason }, updatedAt: new Date() }).where(eq(payments.id, payment.id));
    await logEvent(app.id, label(app), 'payment_session_failed', 'system', { tranId, reason: result.reason });
    return { ok: false, reason: 'gateway' };
  }
  await db.update(payments).set({ sessionKey: result.sessionKey, updatedAt: new Date() }).where(eq(payments.id, payment.id));
  await logEvent(app.id, label(app), 'payment_started', 'guardian', { tranId, amount });
  return { ok: true, gatewayUrl: result.gatewayUrl };
}

export type SettleOutcome = 'paid' | 'already_paid' | 'held' | 'not_valid' | 'unreachable' | 'unknown_payment' | 'double_payment' | 'needs_attention';
export type SettleResult = { outcome: SettleOutcome; applicationId?: string; publicRef?: string | null };

/**
 * Marks the application paid and hands out the next serial for its class, in one statement: the
 * row lock and `public_ref IS NULL` make a second confirmation (IPN and browser at once) a no-op.
 */
async function assignApplicationId(applicationId: string): Promise<string | null> {
  const result = await getAdmissionsDb().execute<{ public_ref: string }>(sql`
    WITH target AS (
      SELECT id, cycle_id, class_code FROM applications
      WHERE id = ${applicationId} AND public_ref IS NULL AND status IN ('unpaid', 'draft') AND class_code IS NOT NULL
      FOR UPDATE
    ), bump AS (
      INSERT INTO application_serials (cycle_id, class_code, last_serial)
      SELECT cycle_id, class_code, 1 FROM target
      ON CONFLICT (cycle_id, class_code) DO UPDATE SET last_serial = application_serials.last_serial + 1
      RETURNING last_serial
    )
    UPDATE applications a SET
      status = 'paid',
      serial = bump.last_serial,
      public_ref = target.class_code || '-' || CASE WHEN bump.last_serial < 1000 THEN lpad(bump.last_serial::text, 3, '0') ELSE bump.last_serial::text END,
      paid_at = now(),
      updated_at = now()
    FROM target, bump
    WHERE a.id = target.id
    RETURNING a.public_ref`);
  return result.rows[0]?.public_ref ?? null;
}

/** Applies a gateway transaction (from the validation API or a transaction query) to our payment. */
async function settle(payment: Payment, tx: GatewayTransaction | null, source: string): Promise<SettleResult> {
  const db = getAdmissionsDb();
  const base = { applicationId: payment.applicationId };
  if (payment.status === 'valid') {
    const [app] = await db.select({ publicRef: applications.publicRef }).from(applications).where(eq(applications.id, payment.applicationId));
    if (app && !app.publicRef) return giveId(payment, source);
    return { ...base, outcome: 'already_paid', publicRef: app?.publicRef ?? null };
  }
  const verdict = judgeTransaction(tx, { tranId: payment.tranId, amount: payment.amount });
  if (verdict === 'not_valid') return { ...base, outcome: 'not_valid' };

  const record = {
    valId: tx?.val_id ?? null,
    bankTranId: tx?.bank_tran_id ?? null,
    cardType: tx?.card_type ?? null,
    riskLevel: tx?.risk_level != null ? String(tx.risk_level) : null,
    gatewayResponse: { ...(tx as Record<string, unknown>), source },
    updatedAt: new Date(),
  };
  const [app] = await db.select().from(applications).where(eq(applications.id, payment.applicationId));

  if (verdict === 'risky' || verdict === 'mismatch') {
    if (payment.status !== 'held') {
      await db.update(payments).set({ ...record, status: 'held' }).where(eq(payments.id, payment.id));
      await logEvent(payment.applicationId, app ? label(app) : payment.tranId, verdict === 'risky' ? 'payment_held_risk' : 'payment_mismatch', 'system', {
        tranId: payment.tranId,
        amount: tx?.amount,
        currency: tx?.currency,
        riskTitle: tx?.risk_title,
      });
    }
    return { ...base, outcome: 'held' };
  }

  const [updated] = await db
    .update(payments)
    .set({ ...record, status: 'valid', completedAt: new Date() })
    .where(and(eq(payments.id, payment.id), ne(payments.status, 'valid')))
    .returning({ id: payments.id });
  if (!updated) return settle({ ...payment, status: 'valid' }, tx, source);
  return giveId(payment, source);
}

/** A valid payment: the application gets its ID (also completes one interrupted after the payment row was saved). */
async function giveId(payment: Payment, source: string): Promise<SettleResult> {
  const db = getAdmissionsDb();
  const base = { applicationId: payment.applicationId };
  const ref = await assignApplicationId(payment.applicationId);
  if (ref) {
    await logEvent(payment.applicationId, ref, 'paid', 'system', { tranId: payment.tranId, amount: payment.amount, source });
    return { ...base, outcome: 'paid', publicRef: ref };
  }
  // Paid, but the application was already paid by another attempt, or cannot get an ID.
  const [current] = await db.select().from(applications).where(eq(applications.id, payment.applicationId));
  if (current?.publicRef) {
    await logEvent(payment.applicationId, current.publicRef, 'double_payment', 'system', { tranId: payment.tranId, amount: payment.amount, note: 'Refund this payment from the SSLCommerz panel.' });
    return { ...base, outcome: 'double_payment', publicRef: current.publicRef };
  }
  await logEvent(payment.applicationId, current ? label(current) : payment.tranId, 'payment_needs_attention', 'system', { tranId: payment.tranId, status: current?.status, classCode: current?.classCode });
  return { ...base, outcome: 'needs_attention' };
}

/** Browser return or IPN: validates the val_id with SSLCommerz, then settles. */
export async function confirmPayment(tranId: string, valId: string, source: 'return' | 'ipn', gateway = paymentGateway()): Promise<SettleResult> {
  const [payment] = await getAdmissionsDb().select().from(payments).where(eq(payments.tranId, tranId));
  if (!payment) return { outcome: 'unknown_payment' };
  if (payment.status === 'valid') return settle(payment, null, source);
  if (!gateway) return { outcome: 'unreachable', applicationId: payment.applicationId };
  const tx = await gateway.validate(valId);
  if (!tx) return { outcome: 'unreachable', applicationId: payment.applicationId };
  return settle(payment, tx, source);
}

const CLOSED_STATUSES: Record<string, 'failed' | 'cancelled'> = { FAILED: 'failed', CANCELLED: 'cancelled', EXPIRED: 'failed', UNATTEMPTED: 'failed' };

/**
 * Asks SSLCommerz what happened to one attempt (transaction query by tran_id): a valid attempt is
 * settled, a closed one is marked failed/cancelled, and an attempt nobody touched for two hours
 * is closed. `hint` is the browser's fail/cancel return, used when SSLCommerz has no record yet.
 */
export async function reconcilePayment(payment: Payment, gateway = paymentGateway(), hint?: 'failed' | 'cancelled'): Promise<SettleResult> {
  const base = { applicationId: payment.applicationId };
  if (payment.status !== 'initiated' && payment.status !== 'failed' && payment.status !== 'cancelled') return settle(payment, null, 'reconcile');
  if (!gateway) return { ...base, outcome: 'unreachable' };
  const elements = await gateway.queryByTranId(payment.tranId);
  if (elements === null) return { ...base, outcome: 'unreachable' };
  const valid = elements.find((e) => ['VALID', 'VALIDATED'].includes(String(e.status).toUpperCase()));
  if (valid) return settle(payment, valid, 'reconcile');
  if (payment.status !== 'initiated') return { ...base, outcome: 'not_valid' };

  const closed = elements.map((e) => CLOSED_STATUSES[String(e.status).toUpperCase()]).find(Boolean);
  const stale = Date.now() - payment.createdAt.getTime() > 2 * 60 * 60 * 1000;
  const next = closed ?? hint ?? (stale ? 'failed' : null);
  if (next) {
    await getAdmissionsDb()
      .update(payments)
      .set({ status: next, updatedAt: new Date(), gatewayResponse: { query: elements as unknown as Record<string, unknown>, ...(hint && { browser: hint }) } })
      .where(and(eq(payments.id, payment.id), eq(payments.status, 'initiated')));
  }
  return { ...base, outcome: 'not_valid' };
}

/** Fail/cancel return from the browser: double-checked with SSLCommerz before closing the attempt. */
export async function closePayment(tranId: string, hint: 'failed' | 'cancelled', gateway = paymentGateway()): Promise<SettleResult> {
  const [payment] = await getAdmissionsDb().select().from(payments).where(eq(payments.tranId, tranId));
  if (!payment) return { outcome: 'unknown_payment' };
  return reconcilePayment(payment, gateway, hint);
}

/** Daily job: attempts still open after `olderThanMinutes`, oldest first, within `budgetMs`. */
export async function reconcilePending(olderThanMinutes = 30, limit = 50, gateway = paymentGateway(), budgetMs = 25_000): Promise<Record<SettleOutcome, number>> {
  const stopAt = Date.now() + budgetMs;
  const counts = {} as Record<SettleOutcome, number>;
  if (!gateway) return counts;
  const open = await getAdmissionsDb()
    .select()
    .from(payments)
    .where(and(eq(payments.status, 'initiated'), lt(payments.createdAt, new Date(Date.now() - olderThanMinutes * 60 * 1000))))
    .orderBy(payments.createdAt)
    .limit(limit);
  for (const p of open) {
    if (Date.now() > stopAt) break;
    const { outcome } = await reconcilePayment(p, gateway);
    counts[outcome] = (counts[outcome] ?? 0) + 1;
  }
  return counts;
}

/**
 * Admin: accept a payment held for review (risky, or an amount that did not match) after checking
 * it in the SSLCommerz panel. The application then gets its ID like any confirmed payment.
 */
export async function acceptHeldPayment(paymentId: string): Promise<SettleResult> {
  const db = getAdmissionsDb();
  const [updated] = await db
    .update(payments)
    .set({ status: 'valid', completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(payments.id, paymentId), eq(payments.status, 'held')))
    .returning();
  if (!updated) return { outcome: 'not_valid' };
  await logEvent(updated.applicationId, updated.tranId, 'payment_released', 'admin', { tranId: updated.tranId });
  return giveId(updated, 'admin');
}
