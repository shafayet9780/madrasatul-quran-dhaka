import { z } from 'zod';

// The pre-admission form as configured in Sanity (`preAdmissionForm.sections` + `cycle`) and as
// frozen into Postgres when a cycle opens (`admission_cycles.snapshot`). Pure: imported by the
// Studio (validation) and by the server (snapshot, validation of answers, PDF, admin views).

export const FIELD_TYPES = ['text', 'textarea', 'number', 'email', 'tel', 'date', 'select', 'radio', 'checkbox', 'yesno', 'file'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

/** Field types whose answer is one or more option values. */
export const CHOICE_TYPES: readonly FieldType[] = ['select', 'radio', 'checkbox'];

/**
 * Roles tell the code which Sanity field means what (the form itself stays fully editable).
 * `required` roles must be assigned exactly once before the form can be published.
 */
export const ROLE_SPECS = {
  studentNameBn: { title: 'Student name (Bengali)', types: ['text'], required: true },
  studentNameEn: { title: 'Student name (English)', types: ['text'], required: false },
  dateOfBirth: { title: 'Date of birth', types: ['date'], required: true },
  classApplied: { title: 'Class applied for', types: ['select', 'radio'], required: true },
  studentPhoto: { title: 'Student photo', types: ['file'], required: true },
  birthCertificate: { title: 'Birth certificate', types: ['file'], required: false },
  fatherName: { title: 'Father’s name', types: ['text'], required: false },
  fatherPhoto: { title: 'Father’s photo', types: ['file'], required: false },
  motherName: { title: 'Mother’s name', types: ['text'], required: false },
  primaryMobile: { title: 'Guardian mobile (asked on the start page)', types: ['tel'], required: true },
  secondaryMobile: { title: 'Second mobile', types: ['tel'], required: false },
  email: { title: 'Guardian email (asked on the start page)', types: ['email'], required: true },
  address: { title: 'Address', types: ['text', 'textarea'], required: false },
  heardFrom: { title: 'How they heard about us', types: ['select', 'radio'], required: false },
} as const satisfies Record<string, { title: string; types: readonly FieldType[]; required: boolean }>;

export type Role = keyof typeof ROLE_SPECS;
export const ROLES = Object.keys(ROLE_SPECS) as Role[];

/** Roles answered on the start page, before the chapters. */
export const START_ROLES: readonly Role[] = ['primaryMobile', 'email'];

const KEY = /^[a-z][a-z0-9_]*$/;
const CLASS_CODE = /^[A-Z][A-Z0-9]{0,3}$/;

const text = z.object({ bengali: z.string().min(1), english: z.string().optional() });
const optionalText = z.object({ bengali: z.string().optional(), english: z.string().optional() }).optional();

const option = z.object({
  value: z.string().min(1),
  label: text,
  /** Class options only: short code used in the application ID (KG-017). */
  code: z.string().optional(),
  ageMin: z.number().optional(),
  ageMax: z.number().optional(),
  /** Class options only: "by special consideration" note. */
  special: z.boolean().optional(),
});

const field = z.object({
  key: z.string().regex(KEY),
  label: text,
  type: z.enum(FIELD_TYPES),
  required: z.boolean().default(false),
  placeholder: optionalText,
  help: optionalText,
  role: z.enum(ROLES as [Role, ...Role[]]).optional(),
  group: z.string().optional(),
  /** Shown only when another field's answer is one of these values. */
  showWhen: z.object({ field: z.string(), values: z.array(z.string()).min(1) }).optional(),
  options: z.array(option).default([]),
  /** File fields: photos are images only; documents allow images or PDF. */
  fileKind: z.enum(['photo', 'document']).optional(),
  /** Desktop layout hint: two half-width fields sit side by side. */
  width: z.enum(['full', 'half']).optional(),
});

const group = z.object({ key: z.string().regex(KEY), title: text, description: optionalText });

const section = z.object({
  key: z.string().regex(KEY),
  title: text,
  description: optionalText,
  groups: z.array(group).default([]),
  fields: z.array(field).min(1),
});

export const formSnapshotSchema = z.object({
  takenAt: z.string(),
  /** Sanity document revision the snapshot was taken from. */
  sourceRev: z.string().optional(),
  settings: z.object({
    session: z.string().min(1),
    applicationFee: z.number().int().positive(),
    evaluationFee: z.number().int().nonnegative(),
    opensAt: z.string().optional(),
    closesAt: z.string().optional(),
    whatsappUrl: z.string().optional(),
    declaration: text,
    pdfInstructions: optionalText,
    refundNote: optionalText,
  }),
  sections: z.array(section).min(1),
});

export type FormSnapshot = z.infer<typeof formSnapshotSchema>;
export type FormSection = FormSnapshot['sections'][number];
export type FormField = FormSection['fields'][number];
export type FormOption = FormField['options'][number];
export type FormGroup = FormSection['groups'][number];
export type BiText = z.infer<typeof text>;

/** Loosely typed config as it comes from Sanity (missing values while an editor is typing). */
export type RawField = {
  key?: string;
  label?: { bengali?: string; english?: string };
  type?: string;
  required?: boolean;
  role?: string;
  group?: string;
  showWhen?: { field?: string; values?: string[] };
  options?: { value?: string; label?: { bengali?: string }; code?: string; ageMin?: number; ageMax?: number }[];
};
export type RawSection = { key?: string; title?: { bengali?: string }; groups?: { key?: string }[]; fields?: RawField[] };

/**
 * Problems that must be fixed before the form can be used (Studio blocks publishing on them;
 * opening a cycle refuses them). Messages are for office staff, so they name the field.
 */
export function checkFormConfig(sections: RawSection[] | undefined): string[] {
  const problems: string[] = [];
  if (!sections?.length) return ['Add at least one section.'];

  const seenSectionKeys = new Set<string>();
  const seenFieldKeys = new Map<string, RawField>();
  const roleCount = new Map<string, number>();

  for (const [si, s] of sections.entries()) {
    const sName = s.title?.bengali || s.key || `Section ${si + 1}`;
    if (!s.key || !KEY.test(s.key)) problems.push(`${sName}: section key must be lower-case letters, digits or _ and start with a letter.`);
    else if (seenSectionKeys.has(s.key)) problems.push(`${sName}: section key “${s.key}” is used twice.`);
    else seenSectionKeys.add(s.key);

    const groupKeys = new Set((s.groups ?? []).map((g) => g.key).filter(Boolean) as string[]);
    if (!s.fields?.length) problems.push(`${sName}: add at least one field.`);

    for (const f of s.fields ?? []) {
      const fName = f.label?.bengali || f.key || 'A field';
      const where = `${sName} → ${fName}`;
      if (!f.key || !KEY.test(f.key)) {
        problems.push(`${where}: field key must be lower-case letters, digits or _ and start with a letter.`);
      } else if (seenFieldKeys.has(f.key)) {
        problems.push(`${where}: field key “${f.key}” is used twice.`);
      }

      const type = f.type as FieldType | undefined;
      if (!type || !FIELD_TYPES.includes(type)) problems.push(`${where}: choose a field type.`);

      if (type && CHOICE_TYPES.includes(type)) {
        const values = (f.options ?? []).map((o) => o.value?.trim()).filter(Boolean) as string[];
        if (values.length < 2) problems.push(`${where}: add at least two options.`);
        if (new Set(values).size !== values.length) problems.push(`${where}: option values must be different.`);
        if ((f.options ?? []).some((o) => !o.value?.trim() || !o.label?.bengali?.trim())) problems.push(`${where}: every option needs a value and a Bengali label.`);
      }

      if (f.group && !groupKeys.has(f.group)) problems.push(`${where}: group “${f.group}” does not exist in this section.`);

      if (f.role) {
        const spec = ROLE_SPECS[f.role as Role];
        if (!spec) problems.push(`${where}: unknown role “${f.role}”.`);
        else {
          roleCount.set(f.role, (roleCount.get(f.role) ?? 0) + 1);
          if (type && !(spec.types as readonly string[]).includes(type)) problems.push(`${where}: the role “${spec.title}” needs a ${spec.types.join(' or ')} field.`);
        }
        if (f.role === 'classApplied') problems.push(...checkClassOptions(where, f));
      }

      if (f.showWhen) {
        const target = f.showWhen.field ? seenFieldKeys.get(f.showWhen.field) : undefined;
        if (!target) problems.push(`${where}: “show when” must point to a field that comes before it.`);
        else {
          const targetType = target.type as FieldType | undefined;
          const allowed =
            targetType === 'yesno' ? ['yes', 'no'] : targetType && CHOICE_TYPES.includes(targetType) ? (target.options ?? []).map((o) => o.value) : null;
          if (!allowed) problems.push(`${where}: “show when” can only depend on a choice or yes/no field.`);
          else if (!f.showWhen.values?.length || f.showWhen.values.some((v) => !allowed.includes(v))) {
            problems.push(`${where}: “show when” values must be options of “${target.label?.bengali ?? target.key}”.`);
          }
        }
      }

      if (f.key && KEY.test(f.key) && !seenFieldKeys.has(f.key)) seenFieldKeys.set(f.key, f);
    }
  }

  for (const role of ROLES) {
    const n = roleCount.get(role) ?? 0;
    if (n > 1) problems.push(`The role “${ROLE_SPECS[role].title}” is assigned to ${n} fields; use it once.`);
    if (n === 0 && ROLE_SPECS[role].required) problems.push(`Assign the role “${ROLE_SPECS[role].title}” to a field.`);
  }
  return problems;
}

function checkClassOptions(where: string, f: RawField): string[] {
  const problems: string[] = [];
  const codes = new Set<string>();
  for (const o of f.options ?? []) {
    const name = o.label?.bengali || o.value || 'An option';
    if (!o.code || !CLASS_CODE.test(o.code)) problems.push(`${where} → ${name}: add a class code of 1–4 capital letters or digits, starting with a letter (e.g. KG, N, C1).`);
    else if (codes.has(o.code)) problems.push(`${where} → ${name}: class code “${o.code}” is used twice.`);
    else codes.add(o.code);
    if (o.ageMin != null && o.ageMax != null && o.ageMin >= o.ageMax) problems.push(`${where} → ${name}: “up to age” must be above “from age” (Nursery for 4-year-olds: from 4, up to 5).`);
  }
  return problems;
}

/** Every field in form order. */
export function allFields(snapshot: Pick<FormSnapshot, 'sections'>): FormField[] {
  return snapshot.sections.flatMap((s) => s.fields);
}

/** The field playing a role, if any. */
export function fieldWithRole(snapshot: Pick<FormSnapshot, 'sections'>, role: Role): FormField | undefined {
  return allFields(snapshot).find((f) => f.role === role);
}

/** The chapters the guardian fills in: start-page fields (mobile, email) left out, empty chapters dropped. */
export function guardianSections(snapshot: Pick<FormSnapshot, 'sections'>): FormSection[] {
  return snapshot.sections
    .map((s) => ({ ...s, fields: s.fields.filter((f) => !f.role || !START_ROLES.includes(f.role)) }))
    .filter((s) => s.fields.length > 0);
}
