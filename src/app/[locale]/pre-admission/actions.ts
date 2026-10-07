'use server';

import { redirect } from 'next/navigation';
import { getCurrentCycle } from '@/lib/admissions/cycle';
import { createDraft, saveDraft } from '@/lib/admissions/drafts';
import { asLocale } from '@/lib/admissions/display';
import { flowPath } from '@/lib/admissions/pages';
import { currentApplication, setSessionToken, withinLimit } from '@/lib/admissions/session';

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
