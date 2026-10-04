import { z } from 'zod';

const key = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);

const option = z.object({ key, label: z.string().min(1), mark: z.number().min(0).max(10) });

const question = z.object({
  key,
  text: z.string().min(1),
  hint: z.string().optional(),
  // 'marks': answer is one of template.scale · 'options': answer is an option key (marks hidden)
  type: z.enum(['marks', 'options']),
  options: z.array(option).default([]),
  areaKey: key,
  // Sanity omits booleans an editor never toggled.
  required: z.boolean().default(true),
  allowNA: z.boolean().default(false),
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

export function findClass(snapshot: RoundSnapshot, classKey: string): SnapshotClass | undefined {
  return snapshot.classes.find((c) => c.key === classKey);
}

/** "নার্সারি A" for a sectioned class, "প্লে" otherwise. sectionKey '' = no section. */
export function classLabel(snapshot: RoundSnapshot, classKey: string, sectionKey: string): string {
  const cls = findClass(snapshot, classKey);
  if (!cls) return classKey;
  const section = cls.sections.find((s) => s.key === sectionKey);
  return section ? `${cls.name} ${section.name}` : cls.name;
}

/** Mark for an answer value; undefined for N/A or an unknown value. */
export function markFor(question: SnapshotQuestion, scale: number[], value: unknown): number | undefined {
  if (question.type === 'marks') {
    return typeof value === 'number' && scale.includes(value) ? value : undefined;
  }
  return question.options.find((o) => o.key === value)?.mark;
}

type Orderable = { roll: number | null; name: string; erpId: string };

/** Student order for lists and reports: by roll; students without a roll follow, by name. */
export function compareStudents(a: Orderable, b: Orderable): number {
  if (a.roll !== null && b.roll !== null) return a.roll - b.roll || a.erpId.localeCompare(b.erpId);
  if (a.roll !== null) return -1;
  if (b.roll !== null) return 1;
  return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.erpId.localeCompare(b.erpId);
}
