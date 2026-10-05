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

export type GuardianStep = 'intro' | 'class' | 'identify' | 'match' | 'answer';

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
};
