import { describe, expect, it } from 'vitest';
import { studyPeriods } from './study-periods';
describe('study-plan period distribution', () => {
  it('keeps three Islamic and five general slots, including empty slots', () => {
    expect(
      studyPeriods(
        'Qaida, Arabic-N, Islam-N',
        'Bengali, English, Mathematics',
        0
      )
    ).toEqual({
      islamic: ['Qaida', 'Arabic-N', 'Islam-N'],
      general: ['Bengali', 'English', 'Mathematics', '', ''],
      merged: false,
    });
  });
  it('preserves the empty first Islamic period for classes six through eight', () => {
    for (const row of [7, 8, 9])
      expect(
        studyPeriods(
          'Arabic, Islam',
          'Bengali, English, Mathematics, Science, BGS',
          row
        ).islamic
      ).toEqual(['', 'Arabic', 'Islam']);
  });
  it('preserves merged exam-preparation blocks for classes nine and ten', () => {
    for (const row of [10, 11])
      expect(
        studyPeriods('SSC/DAKHIL Preparation', 'SSC/DAKHIL Preparation', row)
      ).toEqual({
        islamic: ['SSC/DAKHIL Preparation'],
        general: ['SSC/DAKHIL Preparation'],
        merged: true,
      });
  });
  it('keeps Bengali subjects in their original slots', () => {
    expect(
      studyPeriods(
        'শুনানি, আরবি-৫, ইসলাম-৫',
        'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, বিজিএস',
        6
      ).general
    ).toEqual(['বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান', 'বিজিএস']);
  });
});
