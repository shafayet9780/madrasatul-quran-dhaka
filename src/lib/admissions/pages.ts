import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentCycle, type CycleState } from './cycle';
import type { Application } from './drafts';
import type { FormSnapshot } from './form-config';
import { currentApplication } from './session';

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
