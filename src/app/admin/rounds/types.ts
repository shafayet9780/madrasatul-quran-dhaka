import type { RoundSummary } from '@/lib/survey/build-round';

export type RowStatus = 'open' | 'scheduled' | 'draft' | 'closed';

export type OpenedRow = {
  type: 'opened';
  roundId: string;
  kind: string;
  label: string;
  status: Exclude<RowStatus, 'draft'>;
  when: string;
  whenTitle: string;
  count: string;
  drafts: number;
  url: string;
  closesAtInput: string;
  /** Sentence for the close confirmation, e.g. "৮৬/৯৪ ক্লাস-বিষয় জমা হয়েছে; ৩টি খসড়া রয়ে যাবে।" */
  progress: string;
  respondents: string;
};

export type UnopenedRow = {
  type: 'unopened';
  sanityRoundId: string;
  kind: string;
  label: string;
  when: string;
  studioHref: string;
  opensAtInput: string;
  closesAtInput: string;
  linkPreview: string;
  check: { ok: true; summary: RoundSummary } | { ok: false; errors: string[] };
};

export type BoardRow = OpenedRow | UnopenedRow;

export type ActionResult = { ok: true; message: string } | { ok: false; errors: string[] };
