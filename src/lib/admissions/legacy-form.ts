import type { Role } from './form-config';
import { DECLARATION_ENGLISH, FIELD_ENGLISH } from './legacy-english';

// One-time conversion of the old pre-admission form (six differently shaped arrays in the
// `preAdmissionForm` document) into the 2027 `sections` structure. Used by
// scripts/setup-admissions.ts, which writes the result as a Studio draft for review.

type Bi = { bengali?: string; english?: string };
type LegacyOption = { label?: Bi; value?: string };
type LegacyField = {
  fieldName?: string;
  question?: Bi;
  label?: Bi;
  fieldType?: string;
  fileType?: string;
  options?: LegacyOption[];
  isRequired?: boolean;
  placeholder?: Bi;
  helpText?: Bi;
};
export type LegacyFormDocument = {
  generalQuestions?: LegacyField[];
  studentInfoFields?: LegacyField[];
  studentAssessmentFields?: LegacyField[];
  parentInfoFields?: { fatherFields?: LegacyField[]; motherFields?: LegacyField[] };
  additionalQuestions?: LegacyField[];
  contactInfoFields?: LegacyField[];
};

const ROLE_BY_KEY: Record<string, Role> = {
  student_photo: 'studentPhoto',
  student_name_bengali: 'studentNameBn',
  student_name_english: 'studentNameEn',
  date_of_birth: 'dateOfBirth',
  desired_class: 'classApplied',
  student_birth_registration: 'birthCertificate',
  father_name: 'fatherName',
  father_photo: 'fatherPhoto',
  mother_name: 'motherName',
  father_phone: 'primaryMobile',
  mother_phone: 'secondaryMobile',
  email: 'email',
  present_address: 'address',
  heard_from: 'heardFrom',
};

const CLASS_CODES: Record<string, { code: string; special?: boolean }> = {
  nursery: { code: 'N' },
  kg: { code: 'KG' },
  class_1: { code: 'C1' },
  class_2: { code: 'C2' },
  class_3: { code: 'C3' },
  class_4: { code: 'C4', special: true },
  class_5: { code: 'C5', special: true },
};

type GroupDef = { key: string; bengali: string; english: string; fields: string[] };

const GROUPS: Record<string, GroupDef[]> = {
  student: [
    { key: 'photo_names', bengali: 'ছবি ও নাম', english: 'Photo and name', fields: ['student_photo', 'student_name_bengali', 'student_name_english'] },
    { key: 'birth_class', bengali: 'জন্ম তারিখ ও শ্রেণী', english: 'Date of birth and class', fields: ['date_of_birth', 'desired_class'] },
    { key: 'previous', bengali: 'পূর্ববর্তী শিক্ষা', english: 'Previous schooling', fields: ['last_class_attended', 'previous_school'] },
    { key: 'documents', bengali: 'কাগজপত্র', english: 'Documents', fields: ['student_birth_registration'] },
  ],
  father: [
    { key: 'basic', bengali: 'মৌলিক তথ্য', english: 'Basic information', fields: ['father_name', 'father_name_english', 'father_photo'] },
    { key: 'occupation', bengali: 'পেশা', english: 'Occupation', fields: ['father_occupation', 'father_organization', 'father_designation'] },
    {
      key: 'faith',
      bengali: 'দ্বীনি অনুশীলন',
      english: 'Religious practice',
      fields: ['father_prayer_times', 'father_prayer_location', 'father_daily_quran', 'father_islamic_clothing', 'father_mahram', 'father_smoking'],
    },
    { key: 'family', bengali: 'পরিবার ও মিডিয়া', english: 'Family and media', fields: ['father_tv_at_home', 'father_screen_time', 'father_time_with_children'] },
    { key: 'other', bengali: 'অন্যান্য', english: 'Other', fields: ['father_favorite_scholar', 'father_facebook_id'] },
  ],
  mother: [
    { key: 'basic', bengali: 'মৌলিক তথ্য', english: 'Basic information', fields: ['mother_name', 'mother_name_english'] },
    { key: 'occupation', bengali: 'পেশা', english: 'Occupation', fields: ['mother_occupation', 'mother_organization', 'mother_designation'] },
    { key: 'faith', bengali: 'দ্বীনি অনুশীলন', english: 'Religious practice', fields: ['mother_prayer_times', 'mother_daily_quran', 'mother_islamic_clothing', 'mother_mahram'] },
    { key: 'media', bengali: 'মিডিয়া', english: 'Media', fields: ['mother_screen_time'] },
    { key: 'other', bengali: 'অন্যান্য', english: 'Other', fields: ['mother_favorite_scholar', 'mother_facebook_id'] },
  ],
};

const FAITH_NOTE = {
  bengali: 'আপনার পরিবারকে জানতে এবং ঘর ও মাদরাসার মধ্যে মিল রাখতে এই প্রশ্নগুলো করা হয়।',
  english: 'These questions help us know your family and keep home and madrasa in step.',
};

const HALF_WIDTH = new Set(['student_name_bengali', 'student_name_english', 'father_name', 'father_name_english', 'mother_name', 'mother_name_english']);

/** Show-when rules: field → [controlling field, values]. Values the controlling field lacks are dropped. */
const SHOW_WHEN: Record<string, [string, string[]]> = {
  father_organization: ['father_occupation', ['business', 'service', 'teacher', 'doctor', 'engineer']],
  father_designation: ['father_occupation', ['service', 'teacher', 'doctor', 'engineer']],
  mother_organization: ['mother_occupation', ['business', 'service', 'teacher', 'doctor']],
  mother_designation: ['mother_occupation', ['service', 'teacher', 'doctor']],
  transport_location: ['transport_requirement', ['yes']],
};

const CHAPTERS: { key: string; bengali: string; english: string; from: (d: LegacyFormDocument) => LegacyField[] }[] = [
  { key: 'student', bengali: 'শিক্ষার্থীর তথ্য', english: 'Student information', from: (d) => [...(d.studentInfoFields ?? []), ...(d.studentAssessmentFields ?? [])] },
  { key: 'father', bengali: 'পিতার তথ্য', english: 'Father’s information', from: (d) => d.parentInfoFields?.fatherFields ?? [] },
  { key: 'mother', bengali: 'মাতার তথ্য', english: 'Mother’s information', from: (d) => d.parentInfoFields?.motherFields ?? [] },
  { key: 'contact', bengali: 'যোগাযোগের তথ্য', english: 'Contact information', from: (d) => d.contactInfoFields ?? [] },
  {
    key: 'additional',
    bengali: 'অতিরিক্ত তথ্য',
    english: 'Additional information',
    // The one "general question" (how they heard about us) opens this chapter.
    from: (d) => [...(d.generalQuestions ?? []).map((q, i) => ({ ...q, fieldName: i === 0 ? 'heard_from' : `general_${i + 1}` })), ...(d.additionalQuestions ?? [])],
  },
];

function bi(value: Bi | undefined): Bi | undefined {
  if (!value?.bengali && !value?.english) return undefined;
  return { ...(value.bengali && { bengali: value.bengali }), ...(value.english && { english: value.english }) };
}

/** Adds the English text when the Studio has none (placeholders and help only when Bengali exists). */
function withEnglish<T extends Bi | undefined>(value: T, english: string | undefined): T {
  if (!value || !english || value.english) return value;
  return { ...value, english };
}

/** Class labels carried "(বিশেষ বিবেচনায়)"; the `special` flag now shows that note. */
function withoutSpecialNote(label: Bi | undefined): Bi {
  const strip = (v?: string) => v?.replace(/\s*\([^)]*(বিশেষ|special)[^)]*\)\s*$/i, '');
  return { bengali: strip(label?.bengali) ?? '', ...(label?.english && { english: strip(label.english) }) };
}

function fieldType(f: LegacyField): string {
  switch (f.fieldType) {
    case 'boolean':
      // Old "boolean" questions with options (e.g. ৫ ওয়াক্ত সালাত) were shown as Yes/No by mistake.
      return f.options?.length ? 'radio' : 'yesno';
    case 'time':
      return 'text';
    default:
      return f.fieldType ?? 'text';
  }
}

export type ConversionReport = { chapters: number; fields: number; roles: Role[]; todo: string[] };

export function convertLegacyForm(doc: LegacyFormDocument): { sections: Record<string, unknown>[]; report: ConversionReport } {
  const roles: Role[] = [];
  let fieldCount = 0;
  const sections = CHAPTERS.map((chapter) => {
    const legacy = chapter.from(doc);
    const byKey = new Map(legacy.filter((f) => f.fieldName).map((f) => [f.fieldName!, f]));
    const keys = new Set(byKey.keys());
    const choiceValues = (k: string) => {
      const f = byKey.get(k);
      if (!f) return [];
      return fieldType(f) === 'yesno' ? ['yes', 'no'] : (f.options ?? []).map((o) => o.value ?? '');
    };
    const groups = (GROUPS[chapter.key] ?? []).filter((g) => g.fields.some((k) => keys.has(k)));
    const fields = legacy
      .filter((f) => f.fieldName)
      .map((f) => {
        const key = f.fieldName!;
        const type = fieldType(f);
        const role = ROLE_BY_KEY[key];
        if (role) roles.push(role);
        fieldCount += 1;
        const group = groups.find((g) => g.fields.includes(key));
        const show = SHOW_WHEN[key];
        const showValues = show ? show[1].filter((v) => choiceValues(show[0]).includes(v)) : [];
        const en = FIELD_ENGLISH[key];
        const placeholder = withEnglish(bi(f.placeholder), en?.placeholder);
        const help = withEnglish(bi(f.helpText), en?.help);
        return {
          _key: key,
          _type: 'admissionField',
          key,
          label: withEnglish(bi(f.label ?? f.question) ?? { bengali: key }, en?.label),
          type,
          required: !!f.isRequired,
          ...(placeholder && { placeholder }),
          ...(help && { help }),
          ...(['select', 'radio', 'checkbox'].includes(type) && {
            options: (f.options ?? []).map((o) => ({
              _key: o.value ?? '',
              _type: 'admissionOption',
              value: o.value ?? '',
              label: withEnglish(
                role === 'classApplied' ? withoutSpecialNote(bi(o.label)) : (bi(o.label) ?? { bengali: o.value ?? '' }),
                en?.options?.[o.value ?? ''],
              ),
              ...(role === 'classApplied' && CLASS_CODES[o.value ?? '']),
            })),
          }),
          ...(type === 'file' && { fileKind: f.fileType === 'student-image' || f.fileType === 'father-image' ? 'photo' : 'document' }),
          ...(role && { role }),
          ...(group && { group: group.key }),
          ...(HALF_WIDTH.has(key) && { width: 'half' }),
          ...(showValues.length > 0 && { showWhen: { field: show[0], values: showValues } }),
        };
      });
    return {
      _key: chapter.key,
      _type: 'admissionSection',
      key: chapter.key,
      title: { bengali: chapter.bengali, english: chapter.english },
      groups: groups.map((g) => ({
        _key: g.key,
        _type: 'admissionGroup',
        key: g.key,
        title: { bengali: g.bengali, english: g.english },
        ...(g.key === 'faith' && { description: FAITH_NOTE }),
      })),
      fields,
    };
  }).filter((s) => s.fields.length > 0);

  return {
    sections,
    report: {
      chapters: sections.length,
      fields: fieldCount,
      roles,
      todo: [
        'Form 2027 → শিক্ষার্থীর তথ্য → class field: add the age range for each class (or leave empty to skip the age hint).',
        'Cycle 2027: set the opening time, the deadline and the WhatsApp group link.',
        'Cycle 2027: review the PDF instructions and the refund note.',
      ],
    },
  };
}

export const DEFAULT_CYCLE = {
  _type: 'admissionCycle',
  session: '2027',
  applicationFee: 500,
  evaluationFee: 500,
  pdfInstructions: {
    bengali: 'এই আবেদনপত্রটি প্রিন্ট করে মূল্যায়নের দিন অবশ্যই সঙ্গে আনুন। সঙ্গে আনবেন শিক্ষার্থীর জন্ম নিবন্ধন সনদের মূল কপি এবং নগদ মূল্যায়ন ফি।',
    english: 'Print this application and bring it on evaluation day, with the original birth certificate and the evaluation fee in cash.',
  },
  refundNote: {
    bengali: 'আবেদন ফি ফেরতযোগ্য নয়।',
    english: 'The application fee is non-refundable.',
  },
};

type SanityField = { _key: string; label?: Bi; placeholder?: Bi; help?: Bi; options?: { _key: string; value?: string; label?: Bi }[] };
type SanitySection = { _key: string; fields?: SanityField[] };

/**
 * Sanity patch paths that add the English text to a form already in the Studio, only where it is
 * missing (`setIfMissing`), so nothing an editor wrote is replaced.
 */
export function englishPatches(sections: SanitySection[] | undefined, declaration?: Bi): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of sections ?? []) {
    for (const f of s.fields ?? []) {
      const key = f._key;
      const en = FIELD_ENGLISH[(f as { key?: string }).key ?? key];
      if (!en) continue;
      const base = `sections[_key=="${s._key}"].fields[_key=="${key}"]`;
      if (f.label && !f.label.english) out[`${base}.label.english`] = en.label;
      if (en.placeholder && f.placeholder?.bengali && !f.placeholder.english) out[`${base}.placeholder.english`] = en.placeholder;
      if (en.help && f.help?.bengali && !f.help.english) out[`${base}.help.english`] = en.help;
      for (const o of f.options ?? []) {
        const english = en.options?.[o.value ?? ''];
        if (english && o.label && !o.label.english) out[`${base}.options[_key=="${o._key}"].label.english`] = english;
      }
    }
  }
  if (declaration?.bengali && !declaration.english) out['declarationText.english'] = DECLARATION_ENGLISH;
  return out;
}
