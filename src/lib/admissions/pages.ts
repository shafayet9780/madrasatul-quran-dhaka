import 'server-only';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FORM_QUERY, getCurrentCycle, type CycleState } from './cycle';
import { num, type Locale } from './display';
import type { Application } from './drafts';
import type { FormSnapshot } from './form-config';
import { intakeFrom, intakeStatus, type AdmissionCta, type Intake } from './intake';
import { localOverrides } from './local';
import { currentApplication } from './session';
import type { FormDocument } from './snapshot';

// Shared loading for the guardian pages.

/** The open cycle, or null when the form is not published, broken, or the database is unreachable. */
export async function safeCurrentCycle(): Promise<CycleState | null> {
  try {
    return await getCurrentCycle();
  } catch (e) {
    console.error('Admissions: could not load the current cycle', e);
    return null;
  }
}

/**
 * The intake for the banner and the calls to action across the site. Reads only the published form
 * (no database, no test-pass cookie), so the pages that show it stay cacheable.
 */
export async function getIntake(): Promise<Intake> {
  try {
    const local = localOverrides();
    if (local) return intakeFrom(local.form);
    const { sanityFetch } = await import('@/lib/sanity-fetch');
    return intakeFrom(await sanityFetch<FormDocument | null>({ query: FORM_QUERY, tags: ['preAdmissionForm'] }));
  } catch (e) {
    console.error('Admissions: could not load the intake', e);
    return { state: 'off' };
  }
}

/** Null unless the form is open or announced with an opening date. */
export async function getAdmissionCta(locale: Locale): Promise<AdmissionCta | null> {
  const intake = await getIntake();
  if (intake.state !== 'open' && intake.state !== 'not_open') return null;
  const t = await getTranslations({ locale, namespace: 'preAdmission.intro' });
  return { state: intake.state, session: num(intake.session ?? '', locale), status: intakeStatus(intake, locale, t) };
}

export const flowPath = (locale: string, path = '') => `/${locale}/pre-admission${path}`;

/** The application on this device, or back to the start page. Paid applications go to their status page. */
export async function requireDraft(locale: string, opts: { allowPaid?: boolean } = {}): Promise<{ app: Application; snapshot: FormSnapshot }> {
  // Picks up form changes from the Studio first, so a draft opens on the current version.
  await safeCurrentCycle();
  const current = await currentApplication().catch(() => null);
  if (!current) redirect(flowPath(locale, '/start'));
  if (!opts.allowPaid && current.app.status !== 'draft' && current.app.status !== 'unpaid') redirect(flowPath(locale, '/status'));
  return current;
}
