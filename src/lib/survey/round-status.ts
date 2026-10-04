export type RoundStatus = 'scheduled' | 'open' | 'closed';

export function roundStatus(round: { opensAt: Date; closesAt: Date }, now = new Date()): RoundStatus {
  if (now >= round.closesAt) return 'closed';
  return now < round.opensAt ? 'scheduled' : 'open';
}

/** Submissions are accepted this long after closing, for someone already on the review screen. */
export const SUBMIT_GRACE_MS = 10 * 60 * 1000;

export type SurveyAccess = 'scheduled' | 'open' | 'grace' | 'closed';

/** What a respondent may do now: answer while open, finish and submit during the grace period. */
export function surveyAccess(round: { opensAt: Date; closesAt: Date }, now = new Date()): SurveyAccess {
  const status = roundStatus(round, now);
  if (status !== 'closed') return status;
  return now.getTime() < round.closesAt.getTime() + SUBMIT_GRACE_MS && round.opensAt < round.closesAt ? 'grace' : 'closed';
}
