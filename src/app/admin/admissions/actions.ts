'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { addNote, adminCycle, byPublicRef, deleteUnpaid, setEvaluationDay, setStatuses } from '@/lib/admissions/admin';
import { OFFICE_STATUSES } from '@/lib/admissions/admin-labels';
import { parseApplicationId } from '@/lib/admissions/ids';
import { toBengaliDigits } from '@/lib/admissions/normalise';
import { sendConfirmationEmail } from '@/lib/admissions/mail';
import { acceptHeldPayment } from '@/lib/admissions/payments';
import { fieldWithRole } from '@/lib/admissions/form-config';
import { copyPendingToSheet } from '@/lib/admissions/sheet-copy';
import { assertAdmin, requestOrigin } from '@/lib/survey/admin-auth';

// Admissions admin changes. Every action checks the admin login first (the proxy also gates /admin).

type Result = { ok: true; message?: string } | { ok: false; error: string };
const BAD_REQUEST: Result = { ok: false, error: 'অনুরোধটি সঠিক নয়; পাতাটি আবার লোড করুন।' };

const id = z.uuid();
const status = z.enum(OFFICE_STATUSES as [string, ...string[]]);

/** The changed rows go to the Google Sheet after the response. */
function refresh(detailId?: string) {
  revalidatePath('/admin/admissions', 'layout');
  if (detailId) revalidatePath(`/admin/admissions/${detailId}`);
  after(() => copyPendingToSheet({ limit: 30, budgetMs: 15_000 }).catch(() => undefined));
}

export async function changeStatusAction(ids: string[], next: string): Promise<Result> {
  await assertAdmin();
  const parsed = z.object({ ids: z.array(id).min(1).max(500), next: status }).safeParse({ ids, next });
  if (!parsed.success) return BAD_REQUEST;
  const changed = await setStatuses(parsed.data.ids, parsed.data.next as (typeof OFFICE_STATUSES)[number]);
  refresh(ids.length === 1 ? ids[0] : undefined);
  return { ok: true, message: changed ? `${toBengaliDigits(changed)}টি আবেদনের অবস্থা বদলানো হয়েছে।` : 'অবস্থা আগে থেকেই এটি ছিল।' };
}

export async function evaluationDayAction(appId: string, field: 'attended' | 'evalFee', on: boolean, receiptNo?: string): Promise<Result> {
  await assertAdmin();
  const parsed = z
    .object({ appId: id, field: z.enum(['attended', 'evalFee']), on: z.boolean(), receiptNo: z.string().max(40).optional() })
    .safeParse({ appId, field, on, receiptNo: receiptNo?.trim() || undefined });
  if (!parsed.success) return BAD_REQUEST;
  const done = await setEvaluationDay(parsed.data.appId, parsed.data.field, parsed.data.on, parsed.data.receiptNo);
  if (!done) return { ok: false, error: 'শুধু ফি পরিশোধিত আবেদনে চিহ্ন দেওয়া যায়।' };
  refresh(appId);
  return { ok: true };
}

export async function addNoteAction(appId: string, text: string): Promise<Result> {
  await assertAdmin();
  if (!id.safeParse(appId).success || typeof text !== 'string') return BAD_REQUEST;
  if (!(await addNote(appId, text))) return { ok: false, error: 'নোট খালি।' };
  revalidatePath(`/admin/admissions/${appId}`);
  return { ok: true };
}

export async function deleteUnpaidAction(appId: string, back?: 'list'): Promise<Result> {
  await assertAdmin();
  if (!id.safeParse(appId).success) return BAD_REQUEST;
  const result = await deleteUnpaid(appId);
  if (result === 'paid') return { ok: false, error: 'পরিশোধিত (বা যাচাইয়ের অপেক্ষায় থাকা) আবেদন মুছে ফেলা যায় না।' };
  revalidatePath('/admin/admissions', 'layout');
  if (back === 'list') return { ok: true, message: 'আবেদনটি মুছে ফেলা হয়েছে।' };
  redirect('/admin/admissions/unpaid?deleted=1');
}

export async function acceptHeldAction(appId: string, paymentId: string): Promise<Result> {
  await assertAdmin();
  if (!id.safeParse(appId).success || !id.safeParse(paymentId).success) return BAD_REQUEST;
  const result = await acceptHeldPayment(paymentId);
  if (result.outcome !== 'paid') return { ok: false, error: 'পেমেন্টটি আর যাচাইয়ের অপেক্ষায় নেই, অথবা আইডি দেওয়া যায়নি। কার্যক্রম দেখুন।' };
  const origin = await requestOrigin();
  after(() => sendConfirmationEmail(appId, origin).catch((e) => console.error('Admissions: confirmation email failed', e)));
  refresh(appId);
  return { ok: true, message: `আইডি ${result.publicRef} দেওয়া হয়েছে।` };
}

export async function resendEmailAction(appId: string): Promise<Result> {
  await assertAdmin();
  if (!id.safeParse(appId).success) return BAD_REQUEST;
  const result = await sendConfirmationEmail(appId, await requestOrigin(), undefined, true);
  revalidatePath(`/admin/admissions/${appId}`);
  if (result.ok) return { ok: true, message: 'ইমেইল পাঠানো হয়েছে।' };
  return { ok: false, error: result.reason === 'not_configured' ? 'ইমেইল এখনো চালু হয়নি (Resend সেটআপ বাকি)।' : 'ইমেইল পাঠানো যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।' };
}

export type CheckInState = { error?: string; query?: string };

/** Evaluation day: an application ID typed in (or read from the PDF) opens that application. */
export async function checkInAction(_: CheckInState, form: FormData): Promise<CheckInState> {
  await assertAdmin();
  const query = String(form.get('id') ?? '').trim().slice(0, 300);
  // A barcode scanner reading the staff QR on the PDF types the whole link.
  const scanned = /\/admin\/admissions\/([0-9a-f-]{36})(?:[/?#]|$)/i.exec(query)?.[1];
  if (scanned) redirect(`/admin/admissions/${scanned}?from=evaluation-day`);
  const cycle = await adminCycle();
  if (!cycle) return { error: 'কোনো ভর্তি সেশন খোলা নেই।', query };
  const classField = fieldWithRole(cycle.snapshot, 'classApplied');
  const codes = classField?.options.map((o) => o.code).filter((c): c is string => !!c) ?? [];
  const ref = parseApplicationId(query, codes);
  const found = ref ? await byPublicRef(cycle.cycleId, ref) : null;
  if (!found) return { error: ref ? `${ref} আইডির কোনো আবেদন নেই।` : 'আইডিটি পড়া যায়নি। যেমন: KG-017', query };
  redirect(`/admin/admissions/${found}?from=evaluation-day`);
}
