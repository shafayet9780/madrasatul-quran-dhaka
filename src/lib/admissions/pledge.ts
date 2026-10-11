import type { ChapterStatus } from './answers';
import type { FormSnapshot } from './form-config';

// The অঙ্গীকার step after the last chapter: the parents' code of conduct and two pledges, each
// ticked separately and stored with its time. Forms without a code of conduct have no such step.

export type PledgeTimes = { conductPledgedAt: Date | null; familyDeclaredAt: Date | null };
export type Pledge = 'conduct' | 'family';

export const PLEDGE_STEP = 'pledge';

/** Null when the form has no code of conduct; done when both pledges are ticked. */
export function pledgeStatus(snapshot: Pick<FormSnapshot, 'settings'>, app: PledgeTimes): ChapterStatus | null {
  if (!snapshot.settings.conduct) return null;
  const ticked = Number(!!app.conductPledgedAt) + Number(!!app.familyDeclaredAt);
  return ticked === 2 ? 'done' : ticked === 1 ? 'in_progress' : 'not_started';
}
