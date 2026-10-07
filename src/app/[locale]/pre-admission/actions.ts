'use server';

import { redirect } from 'next/navigation';
import { getCurrentCycle } from '@/lib/admissions/cycle';
import { createDraft } from '@/lib/admissions/drafts';
import { asLocale } from '@/lib/admissions/display';
import { flowPath } from '@/lib/admissions/pages';
import { setSessionToken, withinLimit } from '@/lib/admissions/session';

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
