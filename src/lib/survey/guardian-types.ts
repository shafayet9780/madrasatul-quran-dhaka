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
