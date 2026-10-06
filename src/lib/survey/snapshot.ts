import { z } from 'zod';

const key = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);

const option = z.object({ key, label: z.string().min(1), mark: z.number().min(0).max(10) });

const question = z.object({
  key,
  text: z.string().min(1),
  shortLabel: z.string().optional(),
  hint: z.string().optional(),
  // 'marks': answer is one of template.scale · 'options': answer is an option key (marks hidden)
  type: z.enum(['marks', 'options']),
  options: z.array(option).default([]),
  areaKey: key,
  // Sanity omits booleans an editor never toggled.
  required: z.boolean().default(true),
  allowNA: z.boolean().default(false),
  // Label of the "not applicable" choice, e.g. প্রযোজ্য নয় (ডে কেয়ার); UI falls back to প্রযোজ্য নয়.
  naLabel: z.string().optional(),
  // G2: the answer is kept and shown, but never marked (no average, gap or flag), e.g. study hours at home.
  unscored: z.boolean().default(false),
});

const named = z.object({ key, name: z.string().min(1) });

export const roundSnapshotSchema = z.object({
  takenAt: z.string(),
  template: z.object({
    id: z.string(),
    version: z.number().int(),
    kind: z.enum(['T1', 'G1', 'G2']),
    title: z.string().min(1),
    intro: z.string().optional(),
    commentLabel: z.string().optional(),
    // G1 only: one subject per screen (default) or one question per screen.
    layout: z.enum(['by-subject', 'by-question']).optional(),
    scale: z.array(z.number()).min(2),
    questions: z.array(question).min(1),
  }),
  areas: z.array(named.extend({ group: z.enum(['student', 'teaching']) })),
  classes: z.array(
    named.extend({
      sections: z.array(named),
      subjects: z.array(named),
    })
  ),
  teachers: z.array(named),
});

export type RoundSnapshot = z.infer<typeof roundSnapshotSchema>;
export type SnapshotQuestion = RoundSnapshot['template']['questions'][number];
export type SnapshotClass = RoundSnapshot['classes'][number];

export function findClass(snapshot: Pick<RoundSnapshot, 'classes'>, classKey: string): SnapshotClass | undefined {
  return snapshot.classes.find((c) => c.key === classKey);
}

/** "নার্সারি A" for a sectioned class, "প্লে" otherwise. sectionKey '' = no section. */
export function classLabel(snapshot: Pick<RoundSnapshot, 'classes'>, classKey: string, sectionKey: string): string {
  const cls = findClass(snapshot, classKey);
  if (!cls) return classKey;
  const section = cls.sections.find((s) => s.key === sectionKey);
  return section ? `${cls.name} ${section.name}` : cls.name;
}

/** Stored answer value for "not applicable" (questions with allowNA, G1 and G2 only). */
export const NA = 'na';

export type AnswerClass = { kind: 'mark'; mark: number } | { kind: 'na' } | { kind: 'invalid' };

/** What a stored answer value means: a mark (scale or hidden option mark), N/A, or invalid. */
export function classifyAnswer(question: SnapshotQuestion, scale: number[], value: unknown): AnswerClass {
  if (value === NA) return question.allowNA ? { kind: 'na' } : { kind: 'invalid' };
  if (question.type === 'marks') {
    return typeof value === 'number' && scale.includes(value) ? { kind: 'mark', mark: value } : { kind: 'invalid' };
  }
  const option = question.options.find((o) => o.key === value);
  return option ? { kind: 'mark', mark: option.mark } : { kind: 'invalid' };
}

type Orderable = { roll: number | null; name: string; erpId: string };

/** Student order for lists and reports: by roll; students without a roll follow, by name. */
export function compareStudents(a: Orderable, b: Orderable): number {
  if (a.roll !== null && b.roll !== null) return a.roll - b.roll || a.erpId.localeCompare(b.erpId);
  if (a.roll !== null) return -1;
  if (b.roll !== null) return 1;
  return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.erpId.localeCompare(b.erpId);
}

export type ClassSection = { classKey: string; sectionKey: string; label: string };

/** Every class-section in class order; a class without sections is one entry with sectionKey ''. */
export function classSections(snapshot: RoundSnapshot): ClassSection[] {
  return snapshot.classes.flatMap((c) =>
    c.sections.length
      ? c.sections.map((s) => ({ classKey: c.key, sectionKey: s.key, label: `${c.name} ${s.name}` }))
      : [{ classKey: c.key, sectionKey: '', label: c.name }]
  );
}

/** T1 coverage denominator: class-section × subject pairs. */
export function t1PairCount(snapshot: RoundSnapshot): number {
  return snapshot.classes.reduce((sum, c) => sum + Math.max(1, c.sections.length) * c.subjects.length, 0);
}
