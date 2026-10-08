import { z } from 'zod';

// Request and response shapes shared by the T1 survey client and its API routes.

const key = z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(64);

/** Header carrying the round's link key on survey API calls (kept out of URLs and logs). */
export const SURVEY_KEY_HEADER = 'x-survey-key';

export const batchKeySchema = z.object({
  teacherKey: key,
  classKey: key,
  sectionKey: z.union([key, z.literal('')]),
  subjectKey: key,
});
export type BatchKeyInput = z.infer<typeof batchKeySchema>;

export const NOTE_MAX = 500;

export const draftRowSchema = z.object({
  studentErpId: z.string().min(1).max(64),
  answers: z.record(z.string().max(64), z.number()).optional(),
  /** A string sets the note ('' clears it); omitted keeps the saved note. */
  note: z.string().max(NOTE_MAX).optional(),
  /** Removes the student's marks and note first (by-level subject: "not my student"). */
  clear: z.literal(true).optional(),
});
export type DraftRow = z.infer<typeof draftRowSchema>;

export const draftRequestSchema = batchKeySchema.extend({ rows: z.array(draftRowSchema).min(1).max(200) });
export const submitRequestSchema = batchKeySchema.extend({
  acknowledgedDuplicates: z.array(z.uuid()).max(20).default([]),
});
export const overviewRequestSchema = z.object({ teacherKey: key });
/** The ERP ID as the teacher typed it; the route normalises it. */
export const teacherLookupSchema = z.object({ teacherId: z.string().max(40) });
export type TeacherIdentity = { key: string; name: string };

export type RosterStudent = { erpId: string; name: string; roll: number | null };

export type DuplicateBatch = { submissionId: string; teacherName: string; submittedAt: string; students: number };

export type BatchState = {
  students: RosterStudent[];
  answers: Record<string, Record<string, number>>;
  notes: Record<string, string>;
  /** 'draft' when unsubmitted edits exist (also while editing a submitted batch). */
  status: 'new' | 'draft' | 'submitted';
  submitted: { at: string; receiptToken: string } | null;
  duplicates: DuplicateBatch[];
  /** By-level subject: students another teacher has already rated, with that teacher's name. */
  taken: Record<string, string>;
};

export type OverviewItem = {
  classKey: string;
  sectionKey: string;
  subjectKey: string;
  status: 'draft' | 'submitted';
  done: number;
  total: number;
  updatedAt: string;
};

export type MissingMarks = { questionKey: string; students: { erpId: string; name: string }[] };

export type TakenStudent = { erpId: string; name: string; teacherName: string };

export type SubmitResult =
  | { ok: true; receiptToken: string }
  | { ok: false; reason: 'incomplete'; missing: MissingMarks[] }
  | { ok: false; reason: 'taken'; students: TakenStudent[] }
  | { ok: false; reason: 'duplicate'; duplicates: DuplicateBatch[] }
  | { ok: false; reason: 'closed' | 'empty' | 'conflict' };
