import { describe, expect, it } from 'vitest';
import { faqFor } from './faq';

const copy = [{ q: 'Launch question?', a: 'Launch answer.' }];

describe('faqFor', () => {
  it('keeps the launch questions while the CMS has none in this language', () => {
    expect(faqFor(undefined, 'english', copy)).toBe(copy);
    expect(faqFor([{ question: { bengali: 'প্রশ্ন?' }, answer: { bengali: 'উত্তর।' } }], 'english', copy)).toBe(copy);
  });

  it('uses the CMS questions that have both a question and an answer', () => {
    const cms = [{ question: { english: ' Q1? ' }, answer: { english: 'A1.' } }, { question: { english: 'Q2?' }, answer: { english: ' ' } }];
    expect(faqFor(cms, 'english', copy)).toEqual([{ q: 'Q1?', a: 'A1.' }]);
  });
});
