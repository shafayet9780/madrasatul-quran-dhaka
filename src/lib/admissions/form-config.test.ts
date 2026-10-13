import { describe, expect, it } from 'vitest';
import { applyClosedClasses, checkFormConfig, classesAcrossVersions, fieldWithRole, formSnapshotSchema, type FormSnapshot, type RawSection } from './form-config';
import { sampleSnapshot } from './testing/fixtures';

const sections = () => structuredClone(sampleSnapshot().sections) as RawSection[];

describe('checkFormConfig', () => {
  it('accepts a complete form', () => {
    expect(checkFormConfig(sections())).toEqual([]);
  });

  it('requires at least one section', () => {
    expect(checkFormConfig([])).toEqual(['Add at least one section.']);
    expect(checkFormConfig(undefined)).toEqual(['Add at least one section.']);
  });

  it('reports a missing required role', () => {
    const s = sections();
    s[0].fields = s[0].fields!.filter((f) => f.role !== 'dateOfBirth');
    expect(checkFormConfig(s)).toContain('Assign the role “Date of birth” to a field.');
  });

  it('reports a role used twice and a role on the wrong field type', () => {
    const s = sections();
    s[1].fields![0].role = 'studentNameBn';
    s[1].fields![1].role = 'email';
    const problems = checkFormConfig(s);
    expect(problems).toContain('The role “Student name (Bengali)” is assigned to 2 fields; use it once.');
    expect(problems.some((p) => p.includes('needs a email field'))).toBe(true);
  });

  it('reports duplicate and malformed keys', () => {
    const s = sections();
    s[1].fields![0].key = 'student_name_bn';
    s[1].key = 'Father';
    const problems = checkFormConfig(s);
    expect(problems.some((p) => p.includes('“student_name_bn” is used twice'))).toBe(true);
    expect(problems.some((p) => p.includes('section key must be lower-case'))).toBe(true);
  });

  it('checks choice options', () => {
    const s = sections();
    s[1].fields![1].options = [{ value: 'a', label: { bengali: 'ক' } }];
    s[1].fields![3].options = [
      { value: 'x', label: { bengali: 'ক' } },
      { value: 'x', label: { bengali: 'খ' } },
    ];
    const problems = checkFormConfig(s);
    expect(problems.some((p) => p.includes('পেশা: add at least two options'))).toBe(true);
    expect(problems.some((p) => p.includes('option values must be different'))).toBe(true);
  });

  it('checks class codes and age ranges', () => {
    const s = sections();
    const cls = s[0].fields!.find((f) => f.role === 'classApplied')!;
    cls.options![1].code = 'N';
    cls.options![2].code = 'c1';
    cls.options![0].ageMin = 7;
    const problems = checkFormConfig(s);
    expect(problems.some((p) => p.includes('class code “N” is used twice'))).toBe(true);
    expect(problems.some((p) => p.includes('১ম শ্রেণী: add a class code'))).toBe(true);
    expect(problems.some((p) => p.includes('“up to age” must be above “from age”'))).toBe(true);
  });

  it('checks groups and show-when references', () => {
    const s = sections();
    s[0].fields![3].group = 'missing';
    s[1].fields![2].showWhen = { field: 'father_occupation', values: ['pilot'] };
    s[1].fields![4].showWhen = { field: 'email', values: ['yes'] };
    const problems = checkFormConfig(s);
    expect(problems.some((p) => p.includes('group “missing” does not exist'))).toBe(true);
    expect(problems.some((p) => p.includes('values must be options of “পেশা”'))).toBe(true);
    expect(problems.some((p) => p.includes('must point to a field that comes before it'))).toBe(true);
  });

  it('allows show-when on a yes/no field', () => {
    const s = sections();
    s[1].fields!.push({ key: 'smoking_note', label: { bengali: 'বিস্তারিত' }, type: 'text', showWhen: { field: 'father_smoking', values: ['yes'] } });
    expect(checkFormConfig(s)).toEqual([]);
  });
});

describe('class requirements', () => {
  const withRequirement = (r: { field?: string; values?: string[]; message?: { bengali?: string } }, shownFor?: string[]) => {
    const s = sections();
    const student = s[0].fields!;
    student.push({ key: 'arabic', label: { bengali: 'আরবি' }, type: 'radio', options: [{ value: 'beginner', label: { bengali: 'নতুন' } }, { value: 'nahw', label: { bengali: 'নাহু' } }], ...(shownFor ? { showWhen: { field: 'class_applied', values: shownFor } } : {}) });
    student.find((f) => f.key === 'class_applied')!.options!.find((o) => o.value === 'class_4')!.requires = [r];
    return s;
  };
  const message = { bengali: 'নাহু-সরফ জানা আবশ্যক' };

  it('accepts a requirement on a later choice question shown for the class', () => {
    expect(checkFormConfig(withRequirement({ field: 'arabic', values: ['nahw'], message }, ['kg', 'class_4']))).toEqual([]);
  });

  it('reports a missing or unsuitable question, wrong answers, a hidden question and a missing message', () => {
    const one = (r: Parameters<typeof withRequirement>[0], shownFor?: string[]) => checkFormConfig(withRequirement(r, shownFor)).join(' ');
    expect(one({ field: 'nope', values: ['x'], message })).toContain('choose the key of another question');
    expect(one({ field: 'class_applied', values: ['kg'], message })).toContain('choose the key of another question');
    expect(one({ field: 'father_name', values: ['x'], message })).toContain('must be a choice or yes/no question');
    expect(one({ field: 'arabic', values: ['fluent'], message })).toContain('the answers must be options');
    expect(one({ field: 'arabic', values: ['nahw'], message }, ['kg'])).toContain('is not shown for this class');
    expect(one({ field: 'arabic', values: ['nahw'] })).toContain('add the message');
  });

  it('allows requirements on the class question only', () => {
    const s = sections();
    s[1].fields!.find((f) => f.key === 'father_occupation')!.options![0].requires = [{ field: 'father_smoking', values: ['no'], message }];
    expect(checkFormConfig(s).join(' ')).toContain('requirements work on the class question only');
  });
});

describe('formSnapshotSchema', () => {
  it('parses the sample and finds fields by role', () => {
    const snap = formSnapshotSchema.parse(sampleSnapshot());
    expect(fieldWithRole(snap, 'classApplied')?.key).toBe('class_applied');
    expect(fieldWithRole(snap, 'motherName')).toBeUndefined();
  });
});

describe('classesAcrossVersions', () => {
  const withClasses = (options: { value: string; code?: string; label: string }[]) => {
    const snap = formSnapshotSchema.parse(sampleSnapshot());
    fieldWithRole(snap, 'classApplied')!.options = options.map((o) => ({ ...o, label: { bengali: o.label } }));
    return snap as FormSnapshot;
  };

  it('keeps a class taken out of the newer form, the newer label winning', () => {
    const current = withClasses([{ value: 'nursery', code: 'N', label: 'নার্সারি (নতুন)' }]);
    const older = withClasses([
      { value: 'play', code: 'PL', label: 'প্লে' },
      { value: 'nursery', code: 'N', label: 'নার্সারি' },
    ]);
    expect(classesAcrossVersions([current, older]).map((o) => [o.code, o.label.bengali])).toEqual([
      ['N', 'নার্সারি (নতুন)'],
      ['PL', 'প্লে'],
    ]);
  });

  it('leaves out options without a class code', () => {
    expect(classesAcrossVersions([withClasses([{ value: 'x', label: 'X' }])])).toEqual([]);
  });
});

describe('closed classes', () => {
  /** The sample form as raw Studio sections, with “Play” closed and questions that depend on the class. */
  const raw = () => {
    const sections = structuredClone(sampleSnapshot().sections) as RawSection[];
    const fields = sections[0].fields!;
    const classField = fields.find((f) => f.role === 'classApplied')!;
    classField.options = [{ value: 'play', label: { bengali: 'প্লে' }, code: 'PL', closed: true }, ...classField.options!];
    const ask = (key: string, values: string[]) => fields.push({ key, label: { bengali: key }, type: 'text', showWhen: { field: 'class_applied', values } });
    ask('all_but_play', ['nursery', 'kg', 'class_1', 'class_4']);
    ask('some', ['play', 'kg']);
    ask('play_only', ['play']);
    return sections;
  };
  const byKey = (sections: RawSection[], key: string) => sections.flatMap((s) => s.fields ?? []).find((f) => f.key === key)!;

  it('moves closed classes aside and tidies the conditions that named them', () => {
    const sections = raw();
    const bring = [{ text: { bengali: 'x' }, showWhen: { field: 'class_applied', values: ['play', 'nursery', 'kg', 'class_1', 'class_4'] } }];
    applyClosedClasses(sections, bring);
    const classField = byKey(sections, 'class_applied');
    expect(classField.options!.map((o) => o.value)).toEqual(['nursery', 'kg', 'class_1', 'class_4']);
    expect(classField.closedOptions!.map((o) => o.value)).toEqual(['play']);
    expect(byKey(sections, 'all_but_play').showWhen).toBeUndefined();
    expect(byKey(sections, 'some').showWhen!.values).toEqual(['kg']);
    expect(byKey(sections, 'play_only').showWhen!.values).toEqual(['play']);
    expect(bring[0].showWhen).toBeUndefined();
  });

  it('leaves a form without closed classes as it is', () => {
    const sections = raw();
    byKey(sections, 'class_applied').options![0].closed = false;
    const before = structuredClone(sections);
    applyClosedClasses(sections);
    expect(sections).toEqual(before);
  });

  it('needs at least one open class', () => {
    const sections = raw();
    for (const o of byKey(sections, 'class_applied').options!) o.closed = true;
    expect(checkFormConfig(sections).join(' ')).toContain('keep at least one open');
    expect(checkFormConfig(raw())).toEqual([]);
  });

  it('ignores the requirements of a closed class', () => {
    const sections = raw();
    byKey(sections, 'class_applied').options![0].requires = [{ field: 'no_such_question', values: ['x'], message: { bengali: 'x' } }];
    expect(checkFormConfig(sections)).toEqual([]);
  });

  it('keeps closed classes findable across versions', () => {
    const sections = raw();
    applyClosedClasses(sections);
    const snap = formSnapshotSchema.parse({ ...sampleSnapshot(), sections });
    expect(classesAcrossVersions([snap]).map((o) => o.code)).toEqual(['N', 'KG', 'C1', 'C4', 'PL']);
  });
});
