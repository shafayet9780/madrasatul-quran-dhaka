import { describe, expect, it } from 'vitest';
import { dhakaTime, exportForm, exportHeader, exportRow, type ExportApplication } from './export-rows';
import type { FormSnapshot } from './form-config';
import { sampleSnapshot } from './testing/fixtures';

const app: ExportApplication = {
  publicRef: 'KG-017',
  status: 'interview',
  locale: 'bengali',
  primaryMobile: '8801712345678',
  email: 'a@b.co',
  studentNameBn: 'আব্দুল্লাহ',
  studentNameEn: 'Abdullah',
  dateOfBirth: '2021-03-12',
  answers: {
    student_photo: { key: 'admissions/x/p', name: 'p.jpg', size: 1, type: 'image/jpeg' },
    class_applied: 'kg',
    father_occupation: 'other',
    father_prayer_location: ['mosque'],
    father_smoking: 'no',
    mother_mobile: '০১৮১২-৩৪৫৬৭৮',
    children_count: '2',
  },
  snapshotVersion: 1,
  createdAt: new Date('2026-09-29T02:05:00Z'),
  submittedAt: null,
  paidAt: new Date('2026-09-29T14:42:00Z'),
  attendedAt: null,
  evalFeeReceivedAt: null,
};

describe('export rows', () => {
  it('has one column per form field after the fixed columns, aligned with the header', () => {
    const form = exportForm(new Map([[1, sampleSnapshot()]]));
    const header = exportHeader(form);
    const row = exportRow(form, app, { amount: 500, tranId: 'MQ27-1', bankTranId: 'B1', cardType: 'BKASH-BKash' });
    expect(row).toHaveLength(header.length);
    const at = (name: string) => row[header.indexOf(name)];
    expect(at('আবেদন আইডি')).toBe('KG-017');
    expect(at('অভিভাবকের মোবাইল')).toBe('01712345678');
    expect(at('অবস্থা')).toBe('অ্যাসেসমেন্ট নির্ধারিত');
    expect(at('পরিশোধের সময়')).toBe('2026-09-29 20:42');
    expect(at('শিক্ষার্থীর ছবি')).toBe('আছে');
    expect(at('ধূমপানের অভ্যাস আছে?')).toBe('না');
    expect(at('মোবাইল (মাতা)')).toBe('01812345678');
    expect(at('সন্তান সংখ্যা')).toBe('2');
    expect(at('ফেসবুক আইডি')).toBe('');
    // Role answers shown in the fixed columns are not repeated.
    expect(header).not.toContain('নাম (বাংলায়)');
    expect(header.filter((h) => h === 'ইমেইল')).toHaveLength(1);
  });

  it('keeps the columns of questions deleted in a later version, reading each row with its own version', () => {
    const v1 = sampleSnapshot();
    const v2 = sampleSnapshot();
    const father = v2.sections[1];
    father.fields = father.fields.filter((f) => f.key !== 'father_facebook' && f.key !== 'father_organization');
    father.fields.find((f) => f.key === 'father_occupation')!.options[2].label = { bengali: 'অন্য পেশা' };
    father.fields.push({ key: 'father_youtube', label: { bengali: 'ইউটিউব' }, type: 'text', required: false, options: [] });
    const form = exportForm(new Map([[2, v2], [1, v1]]));
    const header = exportHeader(form);
    expect(header).toContain('প্রতিষ্ঠানের নাম');
    // Deleted questions sit where they were: after the field they followed.
    expect(header.indexOf('প্রতিষ্ঠানের নাম')).toBe(header.indexOf('পেশা') + 1);
    expect(header.indexOf('ফেসবুক আইডি')).toBe(header.indexOf('ধূমপানের অভ্যাস আছে?') + 1);
    expect(header.indexOf('ইউটিউব')).toBe(header.indexOf('ফেসবুক আইডি') + 1);

    const old = exportRow(form, { ...app, answers: { ...app.answers, father_facebook: 'fb.com/x' } }, null);
    const now = exportRow(form, { ...app, snapshotVersion: 2, answers: { ...app.answers, father_youtube: 'yt' } }, null);
    expect(old).toHaveLength(header.length);
    expect(now).toHaveLength(header.length);
    const at = (row: string[], name: string) => row[header.indexOf(name)];
    expect(at(old, 'ফেসবুক আইডি')).toBe('fb.com/x');
    expect(at(now, 'ইউটিউব')).toBe('yt');
    // Each guardian's own wording of the option.
    expect(at(old, 'পেশা')).toBe('অন্যান্য');
    expect(at(now, 'পেশা')).toBe('অন্য পেশা');
  });

  it('tells apart a question deleted and added again under a new key', () => {
    const v2 = sampleSnapshot();
    const smoking = v2.sections[1].fields.find((f) => f.key === 'father_smoking')!;
    smoking.key = 'father_smokes';
    const header = exportHeader(exportForm(new Map([[1, sampleSnapshot()], [2, v2]])));
    expect(header.filter((h) => h.startsWith('ধূমপানের অভ্যাস আছে?'))).toEqual(['ধূমপানের অভ্যাস আছে? (পিতার তথ্য) [father_smoking]', 'ধূমপানের অভ্যাস আছে? (পিতার তথ্য) [father_smokes]']);
    expect(new Set(header).size).toBe(header.length);
  });

  it('splits a transport stop into route, vehicle, stop and charge, from the version answered', () => {
    const withTransport = (monthly: number): FormSnapshot => {
      const s = sampleSnapshot();
      s.transport = {
        vehicles: [{ key: 'micro', name: { bengali: 'মাইক্রো' }, monthly }, { key: 'auto', name: { bengali: 'অটো' } }],
        routes: [
          { key: 'mirpur-micro', name: { bengali: 'মিরপুর মাইক্রো' }, area: { bengali: 'মিরপুর' }, vehicle: 'micro', stops: [{ key: 'm10', name: { bengali: 'মিরপুর ১০' } }] },
          { key: 'uttara-auto', name: { bengali: 'উত্তরা অটো' }, area: { bengali: 'উত্তরা' }, vehicle: 'auto', stops: [{ key: 's18', name: { bengali: 'সেক্টর ১৮' } }] },
        ],
      };
      s.sections[2].fields.push(
        { key: 'transport_stop', label: { bengali: 'আপনার বাসার সবচেয়ে কাছের স্টপ কোনটি?' }, type: 'transportStop', required: false, options: [] },
        { key: 'transport_area', label: { bengali: 'আপনার এলাকার নাম লিখুন' }, type: 'text', required: false, options: [] },
      );
      return s;
    };
    const form = exportForm(new Map([[1, withTransport(4500)], [2, withTransport(5000)]]));
    const header = exportHeader(form);
    const cols = ['পরিবহন: রুট', 'পরিবহন: গাড়ি', 'পরিবহন: স্টপ', 'পরিবহন: মাসিক ভাড়া (৳)', 'আপনার এলাকার নাম লিখুন'];
    const start = header.indexOf(cols[0]);
    expect(header.slice(start, start + 5)).toEqual(cols);
    const transport = (snapshotVersion: number, answers: ExportApplication['answers']) => {
      const row = exportRow(form, { ...app, snapshotVersion, answers }, null);
      expect(row).toHaveLength(header.length);
      return row.slice(start, start + 5);
    };
    expect(transport(1, { transport_stop: 'mirpur-micro:m10' })).toEqual(['মিরপুর মাইক্রো', 'মাইক্রো', 'মিরপুর ১০', '4500', '']);
    expect(transport(2, { transport_stop: 'mirpur-micro:m10' })).toEqual(['মিরপুর মাইক্রো', 'মাইক্রো', 'মিরপুর ১০', '5000', '']);
    expect(transport(2, { transport_stop: 'uttara-auto:s18' })).toEqual(['উত্তরা অটো', 'অটো', 'সেক্টর ১৮', '', '']);
    expect(transport(2, { transport_stop: 'none', transport_area: 'বনানী' })).toEqual(['আমার এলাকা কোনো রুটে নেই', '', '', '', 'বনানী']);
    expect(transport(2, {})).toEqual(['', '', '', '', '']);
  });

  it('shows a document the guardian will bring', () => {
    const form = exportForm(new Map([[1, sampleSnapshot()]]));
    const header = exportHeader(form);
    const row = exportRow(form, { ...app, answers: { birth_certificate: 'missing' } }, null);
    expect(row[header.indexOf('জন্ম নিবন্ধন সনদ')]).toBe('জমা দেওয়া হয়নি, সঙ্গে আনবেন');
  });

  it('formats times in Dhaka', () => {
    expect(dhakaTime(new Date('2026-12-31T19:30:00Z'))).toBe('2027-01-01 01:30');
    expect(dhakaTime(null)).toBe('');
  });
});
