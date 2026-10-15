import { describe, expect, it } from 'vitest';
import { classTiles, feeGroups } from './admissions-page';
import type { FormSnapshot } from './form-config';
import type { SchoolFee } from '@/types/fees';

const label = (bengali: string, english: string) => ({ bengali, english });
const snapshot = {
  sections: [
    {
      key: 'student',
      fields: [
        {
          key: 'desired_class',
          role: 'classApplied',
          type: 'select',
          options: [
            { value: 'nursery', label: label('নার্সারি', 'Nursery'), ageMin: 5, ageMax: 6 },
            { value: 'class_7', label: label('৭ম শ্রেণী', 'Class 7'), ageMin: 13, ageMax: 15, special: true, requires: [{ field: 'student_gender', values: ['female'], message: label('শুধু মেয়েদের জন্য', 'Girls only') }] },
            { value: 'hifz_review', label: label('হিফজ রিভিউ', 'Hifz review') },
          ],
          closedOptions: [{ value: 'play', label: label('প্লে', 'Play'), ageMin: 4, ageMax: 5 }],
        },
      ],
    },
  ],
} as unknown as Pick<FormSnapshot, 'sections'>;

describe('classTiles', () => {
  it('lists open and closed classes youngest first, with their ages and requirements', () => {
    expect(classTiles(snapshot, 'english')).toEqual([
      { key: 'play', label: 'Play', ages: [4], closed: true, special: false, requires: [] },
      { key: 'nursery', label: 'Nursery', ages: [5], closed: false, special: false, requires: [] },
      { key: 'class_7', label: 'Class 7', ages: [13, 14], closed: false, special: true, requires: ['Girls only'] },
      { key: 'hifz_review', label: 'Hifz review', ages: [], closed: false, special: false, requires: [] },
    ]);
    expect(classTiles(snapshot, 'bengali')[2].requires).toEqual(['শুধু মেয়েদের জন্য']);
  });

  it('is empty without a class question', () => {
    expect(classTiles({ sections: [] } as unknown as Pick<FormSnapshot, 'sections'>, 'bengali')).toEqual([]);
  });
});

describe('feeGroups', () => {
  const words = { notApplicable: 'n/a', contactOffice: 'ask', free: 'free', monthly: 'Monthly', oneTime: 'One-time', annual: 'Annual' };
  const fee = (over: Partial<SchoolFee>): SchoolFee => ({
    _key: 'k',
    name: label('বেতন', 'Tuition'),
    visible: true,
    frequency: 'monthly',
    preHifz: { status: 'priced', amount: 6000 },
    hifz: { status: 'priced', amount: 10000 },
    ...over,
  });

  it('groups the visible fees and writes each price', () => {
    const groups = feeGroups(
      {
        fees: [
          fee({ _key: 'admission', name: label('ভর্তি', 'Admission'), frequency: 'oneTime', preHifz: { status: 'priced', amount: 20000 }, hifz: { status: 'contactOffice' } }),
          fee({ _key: 'tuition' }),
          fee({ _key: 'meals', name: label('খাবার', 'Meals'), preHifz: { status: 'notApplicable' }, hifz: { status: 'priced', amount: 4500 } }),
          fee({ _key: 'hidden', visible: false }),
        ],
      },
      'bengali',
      words,
    );
    expect(groups.map((g) => [g.key, g.rows.map((r) => r.key)])).toEqual([
      ['monthly', ['tuition', 'meals']],
      ['admission', ['admission']],
    ]);
    expect(groups[0].rows[0]).toEqual({ key: 'tuition', name: 'বেতন', frequency: 'Monthly', prices: [{ text: '৳৬,০০০', amount: true }, { text: '৳১০,০০০', amount: true }] });
    expect(groups[0].rows[1].prices[0]).toEqual({ text: 'n/a', amount: false });
    expect(groups[1].rows[0].prices[1]).toEqual({ text: 'ask', amount: false });
  });
});
