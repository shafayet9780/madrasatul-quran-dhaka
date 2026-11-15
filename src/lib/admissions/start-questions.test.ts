import { describe, expect, it } from 'vitest';
import { ageDateText, ageText, sessionAge } from './age';
import { checkStart, guardianSections, type Answers } from './answers';
import { allFields, startQuestions } from './form-config';
import { buildSnapshot, type FormDocument } from './snapshot';
import published from './testing/published-form.json';
import { liveFeeDocument } from './testing/live-form';
import { applyFormUpdates } from './updates-2027';

const { changed, ...updates } = applyFormUpdates(published);
void changed;
const snap = buildSnapshot({ ...published, ...updates, fees: liveFeeDocument() } as FormDocument, new Date('2026-10-20T00:00:00Z'));
const keysIn = (answers: Answers) => guardianSections(snap, answers).flatMap((s) => s.fields.map((f) => f.key));

describe('how they heard, on the start page', () => {
  it('asks the question and its write-in', () => {
    expect(startQuestions(snap).map((f) => f.key)).toEqual(['heard_from', 'heard_from_other']);
  });

  it('leaves them out of the chapters once answered, with mobile and email', () => {
    const keys = keysIn({ heard_from: ['facebook'] });
    expect(keys).not.toContain('heard_from');
    expect(keys).not.toContain('heard_from_other');
    expect(keys).toContain('transport_interest');
    for (const f of allFields(snap).filter((f) => f.role === 'primaryMobile' || f.role === 'email')) expect(keys).not.toContain(f.key);
  });

  it('keeps them in the chapter for a draft started before the move (no answer, or a single one)', () => {
    expect(keysIn({})).toEqual(expect.arrayContaining(['heard_from', 'heard_from_other']));
    expect(keysIn({ heard_from: 'facebook' })).toContain('heard_from');
  });

  it('keeps them in the chapter while the answer is not valid, not for an empty optional “other” line', () => {
    // An option the office removed since: the guardian must be able to choose again.
    expect(keysIn({ heard_from: ['gone'] })).toContain('heard_from');
    expect(keysIn({ heard_from: ['other'] })).not.toContain('heard_from_other');
    expect(keysIn({ heard_from: ['other'], heard_from_other: 'মসজিদ' })).not.toContain('heard_from');
  });

  it('requires an answer, and takes the write-in only for “other”', () => {
    expect(checkStart(snap, {}).errors).toEqual({ heard_from: 'required' });
    expect(checkStart(snap, { heard_from: ['nope'] }).errors).toEqual({ heard_from: 'required' });
    expect(checkStart(snap, { heard_from: ['facebook'], heard_from_other: 'x', class_applied: 'kg' })).toEqual({ errors: {}, values: { heard_from: ['facebook'] } });
    expect(checkStart(snap, { heard_from: ['other'], heard_from_other: ' মসজিদের ইমাম ' }).values).toEqual({ heard_from: ['other'], heard_from_other: 'মসজিদের ইমাম' });
  });
});

describe('age on 1 January of the session', () => {
  it('names the day and the age in both languages', () => {
    expect(ageDateText('2027', 'bengali')).toBe('১ জানুয়ারি ২০২৭');
    expect(ageDateText('2027', 'english')).toBe('1 January 2027');
    const age = sessionAge('2021-03-12', '2027')!;
    expect(ageText(age, 'bengali')).toBe('৫ বছর ৯ মাস');
    expect(ageText(age, 'english')).toBe('5 years 9 months');
    expect(sessionAge(undefined, '2027')).toBeNull();
  });
});
