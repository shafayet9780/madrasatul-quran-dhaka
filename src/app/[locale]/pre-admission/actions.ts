'use server';

import { redirect, unstable_rethrow } from 'next/navigation';
import { after } from 'next/server';
import { getCurrentCycle } from '@/lib/admissions/cycle';
import { createDraft, getByToken, saveDraft, submitDraft } from '@/lib/admissions/drafts';
import { sendResumeEmail } from '@/lib/admissions/mail';
import { asLocale } from '@/lib/admissions/display';
import { flowPath } from '@/lib/admissions/pages';
import { startPayment } from '@/lib/admissions/payments';
import { currentApplication, setSessionToken, siteOrigin, withinLimit } from '@/lib/admissions/session';

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

export type SubmitState = { message?: 'declaration' | 'invalid' | 'rateLimited' | 'failed' };

/** Opens SSLCommerz for the application on this device; a null URL means "show the status page". */
async function checkoutUrl(locale: string): Promise<string> {
  const current = await currentApplication();
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
    const result = await submitDraft(current.app, current.snapshot, form.get('declared') === 'yes');
    if (!result.ok) {
      if (result.reason === 'locked') redirect(flowPath(locale, '/status'));
      return { message: result.reason };
    }
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
