import 'server-only';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { chapterStatus, type ChapterStatus } from './answers';
import { FORM_QUERY, getCurrentCycle, type CycleState } from './cycle';
import { num, txt, type Locale } from './display';
import type { Application } from './drafts';
import { allFields, guardianSections, type FormSnapshot } from './form-config';
import { PLEDGE_STEP, pledgeStatus } from './pledge';
import { intakeStatus, publishedIntake, type AdmissionCta, type Intake } from './intake';
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
  return (await getPublishedIntake()).intake;
}

/** The intake with its published form, for the Admissions page. Same source as getIntake (no database). */
export async function getPublishedIntake(): Promise<ReturnType<typeof publishedIntake>> {
  try {
    const local = localOverrides();
    if (local) return publishedIntake(local.form);
    const { sanityFetch } = await import('@/lib/sanity-fetch');
    return publishedIntake(await sanityFetch<FormDocument | null>({ query: FORM_QUERY, tags: ['preAdmissionForm'] }));
  } catch (e) {
    console.error('Admissions: could not load the intake', e);
    return { intake: { state: 'off' } };
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

export type Step = { key: string; title: string; status: ChapterStatus; href: string };

/** The guardian's steps in order: each chapter, then the অঙ্গীকার step when the form has one. */
export async function guardianSteps(locale: Locale, snapshot: FormSnapshot, app: Application): Promise<Step[]> {
  const steps: Step[] = guardianSections(snapshot).map((s) => ({
    key: s.key,
    title: txt(s.title, locale),
    status: chapterStatus(s, app.answers, allFields(snapshot)).status,
    href: flowPath(locale, `/form/${s.key}`),
  }));
  const pledge = pledgeStatus(snapshot, app);
  if (pledge) {
    const t = await getTranslations({ locale, namespace: 'preAdmission.pledge' });
    steps.push({ key: PLEDGE_STEP, title: t('title'), status: pledge, href: flowPath(locale, '/pledge') });
  }
  return steps;
}
