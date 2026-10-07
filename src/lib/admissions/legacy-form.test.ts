import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkFormConfig, fieldWithRole, type RawSection } from './form-config';
import { DEFAULT_CYCLE, convertLegacyForm, type LegacyFormDocument } from './legacy-form';
import { buildSnapshot } from './snapshot';

// The live form as exported by scripts/extract-form-questions.js (Bengali text only), turned back
// into the Sanity document shape.
type Exported = {
  declarationText: string;
  sections: {
    sectionNameEn: string;
    fields: { fieldName: string; questionTitle: string; questionType: string; isRequired: boolean; placeholder: string; helpText: string; fileType?: string; options: { label: string; value: string }[] }[];
  }[];
};
const exported: Exported = JSON.parse(readFileSync(join(process.cwd(), 'docs/pre-admission-form/pre-admission-form-questions.json'), 'utf8'));

function liveDocument(): LegacyFormDocument {
  const fields = (name: string, asQuestion = false) =>
    exported.sections
      .find((s) => s.sectionNameEn === name)!
      .fields.map((f) => ({
        ...(f.fieldName && { fieldName: f.fieldName }),
        [asQuestion ? 'question' : 'label']: { bengali: f.questionTitle },
        fieldType: f.questionType,
        fileType: f.fileType,
        isRequired: f.isRequired,
        placeholder: { bengali: f.placeholder },
        helpText: { bengali: f.helpText },
        options: f.options.map((o) => ({ label: { bengali: o.label }, value: o.value })),
      }));
  return {
    generalQuestions: fields('General Questions', true),
    studentInfoFields: fields('Student Information'),
    parentInfoFields: { fatherFields: fields('Father Information'), motherFields: fields('Mother Information') },
    additionalQuestions: fields('Additional Information'),
    contactInfoFields: fields('Contact Information'),
  };
}

describe('convertLegacyForm', () => {
  const { sections, report } = convertLegacyForm(liveDocument());
  const raw = sections as unknown as RawSection[];

  it('turns the live form into a valid 2027 form', () => {
    expect(checkFormConfig(raw)).toEqual([]);
    expect(report.fields).toBe(46);
    expect(sections.map((s) => s.key)).toEqual(['student', 'father', 'mother', 'contact', 'additional']);
  });

  it('assigns every role and the class codes', () => {
    expect(new Set(report.roles).size).toBe(report.roles.length);
    expect(report.roles).toHaveLength(14);
    const doc = { _rev: 'r1', declarationText: { bengali: exported.declarationText }, cycle: DEFAULT_CYCLE, sections: raw };
    const snap = buildSnapshot(doc);
    expect(fieldWithRole(snap, 'heardFrom')!.key).toBe('heard_from');
    expect(fieldWithRole(snap, 'primaryMobile')!.key).toBe('father_phone');
    expect(fieldWithRole(snap, 'classApplied')!.options.map((o) => o.code)).toEqual(['N', 'KG', 'C1', 'C2', 'C3', 'C4', 'C5']);
    expect(fieldWithRole(snap, 'studentPhoto')!.fileKind).toBe('photo');
    expect(fieldWithRole(snap, 'birthCertificate')!.fileKind).toBe('document');
  });

  it('fixes the old Yes/No questions and adds the conditions', () => {
    const field = (key: string) => raw.flatMap((s) => s.fields ?? []).find((f) => f.key === key)!;
    expect(field('father_prayer_times').type).toBe('radio');
    expect(field('father_tv_at_home').type).toBe('yesno');
    expect(field('transport_location').showWhen).toEqual({ field: 'transport_requirement', values: ['yes'] });
    expect(field('mother_organization').showWhen).toEqual({ field: 'mother_occupation', values: ['business', 'service', 'teacher', 'doctor'] });
    expect(field('father_photo').group).toBe('basic');
  });
});
