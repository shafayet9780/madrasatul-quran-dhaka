import { describe, expect, it } from 'vitest';
import { chapterStatus, checkAll, checkField, checkSection, isVisible, sanitizeDraft, type Answers } from './answers';
import { allFields } from './form-config';
import { sampleSnapshot } from './testing/fixtures';

const snap = sampleSnapshot();
const field = (key: string) => allFields(snap).find((f) => f.key === key)!;
const photo = { key: 'drafts/abc/photo.jpg', name: 'photo.jpg', size: 180000, type: 'image/jpeg' };

const complete: Answers = {
  student_photo: photo,
  student_name_bn: 'আব্দুল্লাহ আল-মাহমুদ',
  student_name_en: 'Abdullah Al-Mahmud',
  date_of_birth: '2021-03-12',
  class_applied: 'kg',
  birth_certificate: { ...photo, key: 'drafts/abc/bc.pdf', type: 'application/pdf' },
  father_name: 'মোহাম্মদ রফিকুল ইসলাম',
  father_occupation: 'service',
  father_organization: 'ঢাকা ব্যাংক',
  father_prayer_location: ['mosque'],
  father_smoking: 'no',
  father_facebook: 'নেই',
  father_mobile: '০১৭১২-৩৪৫৬৭৮',
  email: 'Rafiq@Gmail.com',
  address: 'বাসা ১২, মিরপুর ১০',
};

describe('show-when', () => {
  it('shows a field only for the listed answers', () => {
    const org = field('father_organization');
    expect(isVisible(org, { father_occupation: 'service' })).toBe(true);
    expect(isVisible(org, { father_occupation: 'other' })).toBe(false);
    expect(isVisible(org, {})).toBe(false);
    expect(isVisible(field('father_name'), {})).toBe(true);
  });
});

describe('sanitizeDraft', () => {
  it('keeps partial text but drops unknown keys, bad options and foreign files', () => {
    const out = sanitizeDraft(
      snap,
      {
        father_mobile: '0171',
        unknown: 'x',
        class_applied: 'grade_9',
        father_prayer_location: ['mosque', 'office', 'mosque', 3],
        father_smoking: 'maybe',
        student_photo: { ...photo, key: 'drafts/other/photo.jpg' },
        student_name_bn: 'ক'.repeat(600),
      },
      (f) => f.key.startsWith('drafts/abc/'),
    );
    expect(out).toEqual({ father_mobile: '0171', father_prayer_location: ['mosque'], student_name_bn: 'ক'.repeat(500) });
  });
});

describe('checkField', () => {
  it('normalises values', () => {
    expect(checkField(field('father_mobile'), '০১৭১২-৩৪৫৬৭৮')).toEqual({ value: '8801712345678' });
    expect(checkField(field('email'), ' Rafiq@Gmail.com')).toEqual({ value: 'rafiq@gmail.com' });
    expect(checkField(field('children_count'), '২')).toEqual({ value: 2 });
  });

  it('reports format errors and required answers', () => {
    expect(checkField(field('father_mobile'), '12345')).toEqual({ error: 'invalid_mobile' });
    expect(checkField(field('date_of_birth'), '2021-02-30')).toEqual({ error: 'invalid_date' });
    expect(checkField(field('father_name'), '   ')).toEqual({ error: 'required' });
    expect(checkField(field('children_count'), undefined)).toEqual({});
  });
});

describe('chapters and submit', () => {
  it('accepts a complete application and drops hidden answers', () => {
    const { errors, values } = checkAll(snap, { ...complete, father_occupation: 'other' });
    expect(errors).toEqual({});
    expect(values.father_organization).toBeUndefined();
    expect(values.father_mobile).toBe('8801712345678');
    expect(values.email).toBe('rafiq@gmail.com');
  });

  it('lists every missing or invalid field', () => {
    const { father_facebook, ...rest } = complete;
    void father_facebook;
    const { errors } = checkAll(snap, { ...rest, father_mobile: '12' });
    expect(errors).toEqual({ father_facebook: 'required', father_mobile: 'invalid_mobile' });
  });

  it('counts chapter progress for the hub', () => {
    const father = snap.sections[1];
    expect(chapterStatus(father, {})).toEqual({ status: 'not_started', required: 5, answered: 0 });
    expect(chapterStatus(father, { father_name: 'ক', father_occupation: 'service' }).status).toBe('in_progress');
    expect(chapterStatus(father, complete)).toEqual({ status: 'done', required: 5, answered: 5 });
    expect(checkSection(father, complete).errors).toEqual({});
  });
});
