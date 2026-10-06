import type { MatchedChild } from '@/lib/survey/guardian-types';
import type { OfficePhone } from '@/lib/survey/sanity-source';
import type { RoundSnapshot } from '@/lib/survey/snapshot';

/** What a guardian round page sends to the browser: the questions and classes, never students. */
export type GuardianConfig = {
  roundId: string;
  linkKey: string;
  label: string;
  closesAt: string;
  kind: 'G1' | 'G2';
  snapshot: Pick<RoundSnapshot, 'template' | 'areas' | 'classes'>;
  officePhone: OfficePhone | null;
};

export type GuardianStep = 'intro' | 'class' | 'identify' | 'match' | 'answer' | 'review';

/** Answers kept on this device until submit, per round and child (cleared after submit). */
export type DeviceForm = {
  submissionId: string;
  answers: Record<string, unknown>;
  comment: string;
  /** The submitter mobile of the last send: a different one makes a new submission id. */
  sentWith?: string;
};

export type Relation = 'father' | 'mother' | 'other';

/** Who is answering and for which child, kept for this browser tab only (sessionStorage). */
export type Identity = {
  classKey: string;
  sectionKey: string;
  by: 'id' | 'mobile';
  /** The searched value as typed, to prefill the submitter mobile after a mobile search. */
  searched: string;
  children: MatchedChild[];
  childErpId?: string;
  name: string;
  relation?: Relation;
  relationOther: string;
  mobile: string;
  /** Last verification answer, for "child|canonical mobile"; shown on the question screens too. */
  verified?: { key: string; value: boolean };
};
