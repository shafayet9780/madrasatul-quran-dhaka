import { describe, expect, it } from 'vitest';
import { checkFormConfig, fieldWithRole, type RawSection } from './form-config';
import { DEFAULT_CYCLE, convertLegacyForm, englishPatches } from './legacy-form';
import { buildSnapshot } from './snapshot';
import { exportedForm, liveLegacyDocument } from './testing/live-form';

const exported = exportedForm();

describe('convertLegacyForm', () => {
  const { sections, report } = convertLegacyForm(liveLegacyDocument());
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
    expect(fieldWithRole(snap, 'classApplied')!.options.at(-1)!.label.bengali).not.toContain('বিশেষ');
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

  it('gives every question, choice, placeholder and help text an English version', () => {
    for (const f of raw.flatMap((s) => s.fields ?? []) as any[]) {
      expect(f.label.english, f.key).toBeTruthy();
      for (const o of f.options ?? []) expect(o.label.english, `${f.key}.${o.value}`).toBeTruthy();
      if (f.placeholder) expect(f.placeholder.english, f.key).toBeTruthy();
      if (f.help) expect(f.help.english, f.key).toBeTruthy();
    }
    expect(fieldWithRole(buildSnapshot({ _rev: 'r', declarationText: { bengali: 'ঘোষণা' }, cycle: DEFAULT_CYCLE, sections: raw }), 'classApplied')!.options[1].label.english).toBe('KG');
  });

  it('adds missing English to a form already in the Studio without touching what is there', () => {
    const bengaliOnly = JSON.parse(JSON.stringify(sections, (k, v) => (k === 'english' ? undefined : v)));
    bengaliOnly[0].fields[1].label.english = 'Edited by the office';
    const patches = englishPatches(bengaliOnly, { bengali: 'ঘোষণা' });
    expect(patches['sections[_key=="student"].fields[_key=="student_name_bengali"].label.english']).toBeUndefined();
    expect(patches['sections[_key=="student"].fields[_key=="desired_class"].options[_key=="kg"].label.english']).toBe('KG');
    expect(patches['declarationText.english']).toMatch(/^Madrasatul Quran/);
    expect(englishPatches(sections as any, { bengali: 'ঘোষণা', english: 'x' })).toEqual({});
  });
});
