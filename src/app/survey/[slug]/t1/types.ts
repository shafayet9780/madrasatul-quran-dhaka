import type { OfficePhone } from '@/lib/survey/sanity-source';
import type { RoundSnapshot } from '@/lib/survey/snapshot';
import type { TeacherIdentity } from '@/lib/survey/t1-types';

/**
 * What the T1 page sends to the browser: the round snapshot without its teacher list (teachers
 * start by typing their ERP ID, which the server looks up), plus roster sizes.
 */
export type T1Config = {
  roundId: string;
  slug: string;
  linkKey: string;
  label: string;
  closesAt: string;
  graceMs: number;
  snapshot: Pick<RoundSnapshot, 'template' | 'areas' | 'classes'>;
  /** Active students per "classKey|sectionKey". */
  classSizes: Record<string, number>;
  officePhone: OfficePhone | null;
};

export type Step = 'intro' | 'teacher' | 'missing-name' | 'class' | 'rate' | 'review';

export type Teacher = TeacherIdentity;

/** The teacher is kept on the device, not in the URL, so a copied link never carries their ID. */
export type FlowState = {
  step: Step;
  classKey?: string;
  sectionKey?: string;
  subjectKey?: string;
  /** Question index on the rating step, 0-based. */
  q: number;
};

export const sizeKey = (classKey: string, sectionKey: string) => `${classKey}|${sectionKey}`;
