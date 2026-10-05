import { describe, expect, it } from 'vitest';
import { batchLabel, nameInitial, sectionDisplay } from './labels';
import { t1FixtureSnapshot } from './testing/t1-fixture';

const snapshot = t1FixtureSnapshot();

describe('labels', () => {
  it('formats class, section and subject', () => {
    expect(batchLabel(snapshot, { classKey: 'nursery', sectionKey: 'a', subjectKey: 'quran' })).toBe('নার্সারি · শাখা A · কুরআন');
    expect(batchLabel(snapshot, { classKey: 'nursery', sectionKey: 'a', subjectKey: 'quran' }, 'short')).toBe('নার্সারি A · কুরআন');
    expect(batchLabel(snapshot, { classKey: 'two', sectionKey: 'male', subjectKey: 'math' })).toBe('দ্বিতীয় · বালক · গণিত');
    expect(batchLabel(snapshot, { classKey: 'play', sectionKey: '' })).toBe('প্লে');
  });
  it('prefixes single-letter sections only', () => {
    expect(sectionDisplay('A')).toBe('শাখা A');
    expect(sectionDisplay('বালিকা')).toBe('বালিকা');
  });
  it('skips honorifics for the initial', () => {
    expect(nameInitial('উস্তাযা সুমাইয়া আক্তার')).toBe('স');
    expect(nameInitial('মো. সাইফুল ইসলাম')).toBe('স');
    expect(nameInitial('নুসরাত জাহান')).toBe('ন');
  });
});
