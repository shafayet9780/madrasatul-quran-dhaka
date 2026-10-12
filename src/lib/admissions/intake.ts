import { buildSnapshot, cycleWindow, FormConfigError, type FormDocument } from './snapshot';
import { dateTime, daysLeft, num, type Locale } from './display';

// Where the pre-admission intake stands, for the site-wide banner and the calls to action that
// offer the form. Pure, safe in client components.

export type IntakeState = 'open' | 'not_open' | 'closed' | 'off';
export type Intake = { state: IntakeState; session?: string; opensAt?: string; closesAt?: string };

/** What the banner and the calls to action show; null while there is nothing to offer. */
export type AdmissionCta = { state: 'open' | 'not_open'; session: string; status: string };

/** Off when the form is switched off in the Studio, not published, or incomplete. */
export function intakeFrom(doc: FormDocument | null | undefined, now: Date = new Date()): Intake {
  if (!doc?.formSettings?.isEnabled) return { state: 'off' };
  try {
    const { settings } = buildSnapshot(doc, now);
    return { state: cycleWindow(settings, now), session: settings.session, opensAt: settings.opensAt, closesAt: settings.closesAt };
  } catch (e) {
    if (e instanceof FormConfigError) return { state: 'off' };
    throw e;
  }
}

type Translate = (key: any, values?: Record<string, string>) => string;

/** The status sentence; `t` is the `preAdmission.intro` translator. */
export function intakeStatus(intake: Intake, locale: Locale, t: Translate, now: Date = new Date()): string {
  const { state, opensAt, closesAt } = intake;
  if (state === 'not_open' && opensAt) return t('statusNotOpen', { opens: dateTime(opensAt, locale) });
  if (state === 'closed') return t('statusClosed');
  if (state !== 'open') return t('statusUnavailable');
  if (!closesAt) return t('statusOpenNoDeadline');
  const deadline = dateTime(closesAt, locale);
  const days = daysLeft(closesAt, now);
  if (days === 0) return t('statusLastDay', { deadline });
  if (days !== null) return t('statusClosingSoon', { days: num(days, locale), deadline });
  return t('statusOpen', { deadline });
}
