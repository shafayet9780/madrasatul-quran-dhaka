import { z } from 'zod';

// Request and response shapes shared by the guardian survey client and its API routes.

const key = z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(64);
const sectionKey = z.union([key, z.literal('')]);

export const lookupRequestSchema = z.object({
  classKey: key,
  sectionKey,
  by: z.enum(['id', 'mobile']),
  /** As typed; the route normalises it. */
  value: z.string().min(1).max(40),
});
export type LookupRequest = z.infer<typeof lookupRequestSchema>;

export const verifyRequestSchema = z.object({
  studentErpId: z.string().min(1).max(40),
  mobile: z.string().min(1).max(40),
});

/** A child found in the chosen class. Never carries guardian names or mobiles. */
export type MatchedChild = {
  erpId: string;
  name: string;
  roll: number | null;
  /** When a current submission for this child exists in this round (warning before starting). */
  submittedAt: string | null;
};

export type LookupResponse = { children: MatchedChild[] };
export type VerifyResponse = { verified: boolean };

const answerValue = z.union([z.string().max(64), z.number()]);

export const guardianSubmitSchema = z.object({
  /** Made on the device when the form starts: a repeated submit (double tap, retry) returns the same receipt. */
  submissionId: z.uuid(),
  classKey: key,
  sectionKey,
  studentErpId: z.string().min(1).max(40),
  submitter: z.object({
    name: z.string().max(80),
    relation: z.enum(['father', 'mother', 'other']),
    relationOther: z.string().max(40).default(''),
    mobile: z.string().max(40),
  }),
  /** G2: {questionKey: optionKey | 'na'} · G1: {questionKey: {subjectKey: mark | 'na'}} */
  // Bounded: a template has a few questions and a class at most ~10 subjects.
  answers: z
    .record(z.string().max(64), z.union([answerValue, z.record(z.string().max(64), answerValue).refine((o) => Object.keys(o).length <= 40)]))
    .refine((o) => Object.keys(o).length <= 64),
  comment: z.string().max(2000).default(''),
});
export type GuardianSubmitInput = z.infer<typeof guardianSubmitSchema>;

export type GuardianSubmitResult =
  | { ok: true; receiptToken: string }
  | { ok: false; reason: 'closed' | 'invalid' | 'submitter' }
  /** Questions (G2) or "question|subject" pairs (G1) still without a valid answer. */
  | { ok: false; reason: 'incomplete'; missing: string[] };
