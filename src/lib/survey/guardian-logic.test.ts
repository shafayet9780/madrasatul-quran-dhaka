import { describe, expect, it } from 'vitest';
import { guardianAnswerItems, inputTail, isVerified, lookupValue, relationText } from './guardian-logic';
import { g1FixtureSnapshot, g2FixtureSnapshot } from './testing/guardian-fixture';

describe('lookupValue', () => {
  it('normalises a mobile as the importer stores it', () => {
    expect(lookupValue('mobile', '০১৯১৫-৪৮২৭৩৬')).toBe('8801915482736');
    expect(lookupValue('mobile', '+44 7911 123456')).toBe('447911123456');
    expect(lookupValue('mobile', '12345')).toBeNull();
  });
  it('normalises a student ID typed with Bengali digits or spaces', () => {
    expect(lookupValue('id', ' ১০০ ১৪ ')).toBe('10014');
    expect(lookupValue('id', '')).toBeNull();
    expect(lookupValue('id', "10014' OR 1=1")).toBeNull();
  });
});

describe('inputTail', () => {
  it('keeps the last 4 characters only', () => {
    expect(inputTail('8801915482736')).toBe('2736');
    expect(inputTail('14')).toBe('14');
  });
});

describe('isVerified', () => {
  const student = { fatherMobile: '8801915482736', motherMobile: '447911123456' };
  it('matches either parent on the canonical number, foreign numbers included', () => {
    expect(isVerified(lookupValue('mobile', '01915 482 736'), student)).toBe(true);
    expect(isVerified(lookupValue('mobile', '+44 7911 123456'), student)).toBe(true);
  });
  it('is false for another number, no number or a student without mobiles', () => {
    expect(isVerified('8801855203941', student)).toBe(false);
    expect(isVerified(null, student)).toBe(false);
    expect(isVerified('8801915482736', { fatherMobile: null, motherMobile: null })).toBe(false);
  });
});

describe('guardianAnswerItems (G2)', () => {
  const snapshot = g2FixtureSnapshot();
  const complete = { attendance: 'above-90', 'study-at-home': 'na', devices: '1-2-weekly', 'peer-complaints': 'never' };

  it('turns options into hidden marks and keeps N/A out of the marks', () => {
    const { items, missing } = guardianAnswerItems(snapshot, 'kg', complete);
    expect(missing).toEqual([]);
    expect(items).toEqual([
      { questionKey: 'attendance', subjectKey: '', areaKey: 'attendance', optionKey: 'above-90', mark: 10, isNa: false },
      { questionKey: 'study-at-home', subjectKey: '', areaKey: 'focus-habits', optionKey: null, mark: null, isNa: true },
      { questionKey: 'devices', subjectKey: '', areaKey: 'interest-home', optionKey: '1-2-weekly', mark: 7, isNa: false },
      { questionKey: 'peer-complaints', subjectKey: '', areaKey: 'peer-conduct', optionKey: 'never', mark: 10, isNa: false },
    ]);
  });

  it('lists unanswered or invalid questions and drops unknown keys', () => {
    const { missing, clean } = guardianAnswerItems(snapshot, 'kg', { attendance: 'na', devices: 'sometimes', extra: 'x', 'peer-complaints': 'often' });
    expect(missing).toEqual(['attendance', 'study-at-home', 'devices']);
    expect(clean).toEqual({ 'peer-complaints': 'often' });
  });
});

describe('guardianAnswerItems (G1)', () => {
  const snapshot = g1FixtureSnapshot();
  const subjects = snapshot.classes.find((c) => c.key === 'kg')!.subjects.map((s) => s.key);
  const all = (mark: number) => Object.fromEntries(subjects.map((s) => [s, mark]));

  it('makes one item per question and subject of the class', () => {
    const answers = Object.fromEntries(snapshot.template.questions.map((q) => [q.key, all(8)]));
    const { items, missing } = guardianAnswerItems(snapshot, 'kg', answers);
    expect(missing).toEqual([]);
    expect(items).toHaveLength(snapshot.template.questions.length * subjects.length);
    expect(items[0]).toEqual({ questionKey: 'lesson-learned', subjectKey: subjects[0], areaKey: 'teaching-effectiveness', optionKey: null, mark: 8, isNa: false });
  });

  it('refuses a class without subjects', () => {
    const noSubjects = { ...snapshot, classes: snapshot.classes.map((c) => ({ ...c, subjects: [] })) };
    expect(guardianAnswerItems(noSubjects, 'kg', {}).missing).toEqual(['subjects']);
  });

  it('names the missing question and subject pairs', () => {
    const answers = { 'lesson-learned': { ...all(10), [subjects[1]]: 7 }, 'extra-homework': all(6) };
    const { missing } = guardianAnswerItems(snapshot, 'kg', answers);
    expect(missing).toEqual([`lesson-learned|${subjects[1]}`, ...subjects.map((s) => `overall-satisfaction|${s}`)]);
  });
});

describe('relationText', () => {
  it('stores father and mother in Bengali and needs the text for "other"', () => {
    expect(relationText('father', 'x')).toBe('পিতা');
    expect(relationText('mother', '')).toBe('মাতা');
    expect(relationText('other', '  মামা ')).toBe('মামা');
    expect(relationText('other', '  ')).toBeNull();
  });
});
