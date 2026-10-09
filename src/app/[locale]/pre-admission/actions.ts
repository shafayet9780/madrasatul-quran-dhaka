'use server';

import { redirect, unstable_rethrow } from 'next/navigation';
import { after } from 'next/server';
import { getCurrentCycle } from '@/lib/admissions/cycle';
import { createHash } from 'node:crypto';
import { parseIsoDate } from '@/lib/admissions/age';
import { createDraft, findApplications, getByToken, loadById, saveDraft, submitDraft } from '@/lib/admissions/drafts';
import { sendResumeEmail } from '@/lib/admissions/mail';
import { asLocale, txt } from '@/lib/admissions/display';
import { fieldWithRole } from '@/lib/admissions/form-config';
import { parseApplicationId } from '@/lib/admissions/ids';
import { normaliseMobile } from '@/lib/admissions/normalise';
import { flowPath } from '@/lib/admissions/pages';
import { afterPaid } from '@/lib/admissions/after-paid';
import { completeAfterResubmit, startPayment } from '@/lib/admissions/payments';
import { currentApplication, foundIds, grantApplication, rememberFound, setSessionToken, siteOrigin, withinLimit } from '@/lib/admissions/session';

export type StartState = { errors?: { mobile?: 'invalid_mobile'; email?: 'invalid_email' }; message?: 'closed' | 'rateLimited' | 'failed' };

const ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'referrer'] as const;

/** Start page: creates the draft, remembers it on this device and opens the chapter list. */
export async function startApplication(localeParam: string, _prev: StartState, form: FormData): Promise<StartState> {
  const locale = asLocale(localeParam);
  let token: string;
  try {
    if (!(await withinLimit('start'))) return { message: 'rateLimited' };
    const cycle = await getCurrentCycle();
    if (!cycle) return { message: 'closed' };
    const attribution = Object.fromEntries(
      ATTRIBUTION_KEYS.map((k) => [k, String(form.get(k) ?? '').slice(0, 200)]).filter(([, v]) => v),
    );
    const result = await createDraft(cycle, {
      mobile: String(form.get('mobile') ?? ''),
      email: String(form.get('email') ?? ''),
      locale,
      attribution,
    });
    if (!result.ok) return result.reason === 'closed' ? { message: 'closed' } : { errors: result.errors };
    token = result.token;
    await setSessionToken(token);
    const origin = await siteOrigin();
    const startedToken = token;
    after(async () => {
      const app = await getByToken(startedToken);
      if (app) await sendResumeEmail(app, startedToken, origin).catch((e) => console.error('Admissions: resume email failed', e));
    });
  } catch (e) {
    console.error('Admissions: start failed', e);
    return { message: 'failed' };
  }
  redirect(flowPath(locale, '/form'));
}

export type SaveResponse = { ok: true } | { ok: false; reason: 'locked' | 'expired' | 'rateLimited' | 'failed' };

/** Autosave from a chapter page: a partial patch, kept even when not yet valid. */
export async function saveAnswers(patch: Record<string, unknown>): Promise<SaveResponse> {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return { ok: false, reason: 'failed' };
  try {
    if (!(await withinLimit('save'))) return { ok: false, reason: 'rateLimited' };
    const current = await currentApplication();
    if (!current) return { ok: false, reason: 'expired' };
    const result = await saveDraft(current.app, current.snapshot, patch);
    return result.ok ? { ok: true } : { ok: false, reason: result.reason === 'locked' ? 'locked' : 'expired' };
  } catch (e) {
    console.error('Admissions: save failed', e);
    return { ok: false, reason: 'failed' };
  }
}

export type SubmitState = { message?: 'declaration' | 'invalid' | 'closed' | 'rateLimited' | 'failed' };

/**
 * Submitting stops at the deadline or when the office turns the form off. An application submitted
 * in time can still be paid for afterwards (e.g. a payment that failed at the last minute).
 */
async function formOpen(): Promise<boolean> {
  const cycle = await getCurrentCycle();
  return !!cycle && cycle.enabled && cycle.window === 'open';
}

/** Opens SSLCommerz for the application on this device; a null URL means "show the status page". */
async function checkoutUrl(locale: string, applicationId?: string): Promise<string> {
  // openFound passes the found application: the grant cookie it just set is for the next request.
  const current = applicationId ? await loadById(applicationId) : await currentApplication();
  if (!current) return flowPath(locale, '/start');
  const started = await startPayment(current.app, current.snapshot, await siteOrigin());
  if (started.ok) return started.gatewayUrl;
  return flowPath(locale, started.reason === 'gateway' ? '/status?payment=unavailable' : '/status');
}

/** Review page: checks the whole form, records the declaration, then opens the payment page. */
export async function submitApplication(localeParam: string, _prev: SubmitState, form: FormData): Promise<SubmitState> {
  const locale = asLocale(localeParam);
  let next: string;
  try {
    if (!(await withinLimit('submit'))) return { message: 'rateLimited' };
    const current = await currentApplication();
    if (!current) redirect(flowPath(locale, '/start'));
    if (!(await formOpen())) return { message: 'closed' };
    const result = await submitDraft(current.app, current.snapshot, form.get('declared') === 'yes');
    if (!result.ok) {
      if (result.reason === 'locked') redirect(flowPath(locale, '/status'));
      return { message: result.reason };
    }
    // Paid during checkout while reopened for editing: the ID is given now.
    const completed = await completeAfterResubmit(current.app.id);
    if (completed?.outcome === 'paid') afterPaid(current.app.id, await siteOrigin());
    next = await checkoutUrl(locale);
  } catch (e) {
    unstable_rethrow(e);
    console.error('Admissions: submit failed', e);
    return { message: 'failed' };
  }
  redirect(next);
}

/** Status page: pay (again) for a submitted application. */
export async function payNow(localeParam: string): Promise<void> {
  const locale = asLocale(localeParam);
  let next: string;
  try {
    if (!(await withinLimit('submit'))) redirect(flowPath(locale, '/status?payment=busy'));
    next = await checkoutUrl(locale);
  } catch (e) {
    unstable_rethrow(e);
    console.error('Admissions: payment start failed', e);
    next = flowPath(locale, '/status?payment=unavailable');
  }
  redirect(next);
}

export type FoundApplication = {
  id: string;
  publicRef: string | null;
  studentName: string;
  classLabel: string;
  status: 'paid' | 'due' | 'draft';
};
export type FindState = {
  errors?: { query?: 'invalidQuery'; dob?: 'invalidDob' };
  message?: 'rateLimited' | 'failed' | 'notConfigured' | 'none';
  results?: FoundApplication[];
};

/** Find my application: ID or guardian mobile, checked against the child's date of birth. */
export async function findApplication(localeParam: string, _prev: FindState, form: FormData): Promise<FindState> {
  const locale = asLocale(localeParam);
  const query = String(form.get('query') ?? '').trim();
  const dob = String(form.get('dob') ?? '');
  try {
    const cycle = await getCurrentCycle();
    if (!cycle) return { message: 'notConfigured' };
    const classField = fieldWithRole(cycle.snapshot, 'classApplied');
    const codes = classField?.options.map((o) => o.code).filter((c): c is string => !!c) ?? [];
    const ref = parseApplicationId(query, codes);
    const mobile = ref ? null : normaliseMobile(query);
    const errors: FindState['errors'] = {
      ...(!ref && !mobile && { query: 'invalidQuery' as const }),
      ...(!parseIsoDate(dob) && { dob: 'invalidDob' as const }),
    };
    if (errors.query || errors.dob) return { errors };
    if (!(await withinLimit('find'))) return { message: 'rateLimited' };
    const value = ref ?? mobile!;
    const valueKey = createHash('sha256').update(value).digest('hex').slice(0, 32);
    if (!(await withinLimit('findValue', valueKey)) || !(await withinLimit('findValueDay', valueKey))) return { message: 'rateLimited' };

    const found = await findApplications(cycle.cycleId, ref ? { publicRef: ref } : { mobile: mobile! }, dob);
    if (!found.length) return { message: 'none' };
    await rememberFound(found.map((a) => a.id));
    return {
      results: found.map((a) => {
        const option = classField?.options.find((o) => o.value === a.classValue);
        return {
          id: a.id,
          publicRef: a.publicRef,
          studentName: a.studentNameBn ?? '',
          classLabel: option ? txt(option.label, locale) : '',
          status: a.publicRef ? 'paid' : a.status === 'unpaid' ? 'due' : 'draft',
        };
      }),
    };
  } catch (e) {
    console.error('Admissions: find failed', e);
    return { message: 'failed' };
  }
}

/** Opens a found application on this device and goes where the guardian asked. */
export async function openFound(localeParam: string, form: FormData): Promise<void> {
  const locale = asLocale(localeParam);
  const id = String(form.get('id') ?? '');
  const to = String(form.get('to') ?? 'status');
  if (!(await foundIds()).includes(id) || !(await grantApplication(id))) redirect(flowPath(locale, '/find'));
  if (to === 'pdf') redirect('/api/admissions/pdf');
  if (to === 'pay') {
    let next: string;
    try {
      next = await checkoutUrl(locale, id);
    } catch (e) {
      console.error('Admissions: payment start failed', e);
      next = flowPath(locale, '/status?payment=unavailable');
    }
    redirect(next);
  }
  redirect(flowPath(locale, to === 'form' ? '/form' : '/status'));
}
