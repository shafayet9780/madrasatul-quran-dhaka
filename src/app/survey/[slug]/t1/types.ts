import type { OfficePhone } from '@/lib/survey/sanity-source';
import type { RoundSnapshot } from '@/lib/survey/snapshot';

/** What the T1 page sends to the browser: the round snapshot minus nothing secret, plus roster sizes. */
export type T1Config = {
  roundId: string;
  slug: string;
  linkKey: string;
  label: string;
  closesAt: string;
  graceMs: number;
  snapshot: RoundSnapshot;
  /** Active students per "classKey|sectionKey". */
  classSizes: Record<string, number>;
  officePhone: OfficePhone | null;
};

export type Step = 'intro' | 'teacher' | 'missing-name' | 'class' | 'rate' | 'review';

export type FlowState = {
  step: Step;
  teacherKey?: string;
  classKey?: string;
  sectionKey?: string;
  subjectKey?: string;
  /** Question index on the rating step, 0-based. */
  q: number;
};

export const sizeKey = (classKey: string, sectionKey: string) => `${classKey}|${sectionKey}`;
