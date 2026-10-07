import { checkFormConfig, fieldWithRole, formSnapshotSchema, type RawSection } from './form-config';
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
    expect(problems.some((p) => p.includes('minimum age is above maximum age'))).toBe(true);
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

describe('formSnapshotSchema', () => {
  it('parses the sample and finds fields by role', () => {
    const snap = formSnapshotSchema.parse(sampleSnapshot());
    expect(fieldWithRole(snap, 'classApplied')?.key).toBe('class_applied');
    expect(fieldWithRole(snap, 'motherName')).toBeUndefined();
  });
});
