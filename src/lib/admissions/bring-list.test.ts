import { describe, expect, it } from 'vitest';
import { allBringItems, bringItems } from './bring-list';
import { buildSnapshot, type FormDocument } from './snapshot';
import { liveFormDocument } from './testing/live-form';
import { pledgeStatus } from './pledge';

const snap = buildSnapshot(liveFormDocument() as FormDocument);

describe('what to bring', () => {
  it('follows the answers and flags documents not uploaded', () => {
    const none = bringItems(snap, { studied_before: 'no' }, 'bengali');
    expect(none.map((i) => i.text)).toEqual([
      'এই আবেদনপত্রের প্রিন্ট (৪ পৃষ্ঠা), পিতা ও মাতার স্বাক্ষরসহ',
      'জন্ম নিবন্ধন সনদের ফটোকপি',
      'পাসপোর্ট সাইজ ছবি: শিক্ষার্থীর ২ কপি, পিতার ১ কপি',
      'অ্যাসেসমেন্ট ফি ৳৫০০, নগদে',
    ]);
    expect(none.every((i) => !i.missing)).toBe(true);

    const studied = bringItems(snap, { studied_before: 'yes', previous_result_card: 'missing', student_birth_registration: 'missing' }, 'english');
    expect(studied.map((i) => [i.text, i.missing])).toEqual([
      ['This application, printed (4 pages) and signed by the father and mother', false],
      ['Photocopy of the birth certificate', true],
      ['The original latest result card', true],
      ['Passport-size photos: 2 of the student, 1 of the father', false],
      ['Assessment fee ৳500 in cash', false],
    ]);
  });

  it('lists everything for the intro page, marking conditional items', () => {
    expect(allBringItems(snap, 'bengali').filter((i) => i.conditional).map((i) => i.text)).toEqual(['সর্বশেষ ফলাফল কার্ডের মূল কপি']);
  });
});

describe('pledge step', () => {
  it('is done only with both pledges, and absent without a code of conduct', () => {
    const at = new Date();
    expect(pledgeStatus(snap, { conductPledgedAt: null, familyDeclaredAt: null })).toBe('not_started');
    expect(pledgeStatus(snap, { conductPledgedAt: at, familyDeclaredAt: null })).toBe('in_progress');
    expect(pledgeStatus(snap, { conductPledgedAt: at, familyDeclaredAt: at })).toBe('done');
    expect(pledgeStatus({ settings: { ...snap.settings, conduct: undefined } }, { conductPledgedAt: null, familyDeclaredAt: null })).toBeNull();
  });
});
