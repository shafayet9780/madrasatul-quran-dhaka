import { describe, expect, it } from 'vitest';
import { answerText } from './answer-text';
import { allFields } from './form-config';
import { sampleSnapshot } from './testing/fixtures';

const labels = { yes: 'হ্যাঁ', no: 'না', notGiven: 'দেওয়া হয়নি', fileAttached: (t: string) => `যুক্ত হয়েছে (${t})` };
const field = (key: string) => allFields(sampleSnapshot()).find((f) => f.key === key)!;

describe('answerText', () => {
  it('shows each answer type in the page language', () => {
    expect(answerText(field('class_applied'), 'kg', 'bengali', labels)).toBe('কেজি');
    expect(answerText(field('date_of_birth'), '2021-03-12', 'english', labels)).toBe('12 March 2021');
    expect(answerText(field('father_mobile'), '8801712345678', 'bengali', labels)).toBe('০১৭১২-৩৪৫৬৭৮');
    expect(answerText(field('father_prayer_location'), ['mosque'], 'bengali', labels)).not.toBe('mosque');
    expect(answerText(field('birth_certificate'), { key: 'k', name: 'c.pdf', size: 1, type: 'application/pdf' }, 'bengali', labels)).toBe('যুক্ত হয়েছে (PDF)');
    expect(answerText(field('address'), undefined, 'bengali', labels)).toBe('দেওয়া হয়নি');
  });
});
