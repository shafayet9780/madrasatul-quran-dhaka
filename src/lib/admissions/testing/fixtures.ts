import type { FormSnapshot } from '../form-config';

// A small but complete form, shaped like the real 2027 configuration. Tests only.

const t = (bengali: string, english?: string) => ({ bengali, english });

export function sampleSnapshot(overrides: Partial<FormSnapshot['settings']> = {}): FormSnapshot {
  return {
    takenAt: '2026-10-07T00:00:00.000Z',
    settings: {
      session: '2027',
      applicationFee: 500,
      evaluationFee: 500,
      opensAt: '2026-10-10T00:00:00.000Z',
      closesAt: '2026-11-30T17:59:00.000Z',
      whatsappUrl: 'https://chat.whatsapp.com/example',
      declaration: t('আমি ঘোষণা করছি যে সকল তথ্য সঠিক।', 'I declare that all information is true.'),
      ...overrides,
    },
    sections: [
      {
        key: 'student',
        title: t('শিক্ষার্থীর তথ্য', 'Student information'),
        groups: [{ key: 'names', title: t('ছবি ও নাম') }],
        fields: [
          { key: 'student_photo', label: t('শিক্ষার্থীর ছবি'), type: 'file', required: true, role: 'studentPhoto', fileKind: 'photo', group: 'names', options: [] },
          { key: 'student_name_bn', label: t('নাম (বাংলায়)'), type: 'text', required: true, role: 'studentNameBn', group: 'names', width: 'half', options: [] },
          { key: 'student_name_en', label: t('Name (in English)'), type: 'text', required: true, role: 'studentNameEn', group: 'names', width: 'half', options: [] },
          { key: 'date_of_birth', label: t('জন্ম তারিখ'), type: 'date', required: true, role: 'dateOfBirth', options: [] },
          {
            key: 'class_applied',
            label: t('যে শ্রেণীতে ভর্তি হতে চান'),
            type: 'radio',
            required: true,
            role: 'classApplied',
            options: [
              { value: 'nursery', label: t('নার্সারি'), code: 'N', ageMin: 4, ageMax: 5 },
              { value: 'kg', label: t('কেজি'), code: 'KG', ageMin: 5, ageMax: 6 },
              { value: 'class_1', label: t('১ম শ্রেণী'), code: 'C1', ageMin: 6, ageMax: 7 },
              { value: 'class_4', label: t('৪র্থ শ্রেণী'), code: 'C4', ageMin: 9, ageMax: 10, special: true },
            ],
          },
          { key: 'birth_certificate', label: t('জন্ম নিবন্ধন সনদ'), type: 'file', required: true, role: 'birthCertificate', fileKind: 'document', options: [] },
        ],
      },
      {
        key: 'father',
        title: t('পিতার তথ্য', 'Father information'),
        groups: [],
        fields: [
          { key: 'father_name', label: t('পিতার নাম'), type: 'text', required: true, role: 'fatherName', options: [] },
          {
            key: 'father_occupation',
            label: t('পেশা'),
            type: 'select',
            required: true,
            options: [
              { value: 'business', label: t('ব্যবসায়ী') },
              { value: 'service', label: t('চাকরিজীবী') },
              { value: 'other', label: t('অন্যান্য') },
            ],
          },
          { key: 'father_organization', label: t('প্রতিষ্ঠানের নাম'), type: 'text', required: false, showWhen: { field: 'father_occupation', values: ['business', 'service'] }, options: [] },
          {
            key: 'father_prayer_location',
            label: t('সালাত কোথায় আদায় করেন?'),
            type: 'checkbox',
            required: true,
            options: [
              { value: 'mosque', label: t('মসজিদে') },
              { value: 'home', label: t('বাসায়') },
            ],
          },
          { key: 'father_smoking', label: t('ধূমপানের অভ্যাস আছে?'), type: 'yesno', required: true, options: [] },
          { key: 'father_facebook', label: t('ফেসবুক আইডি'), type: 'text', required: true, options: [] },
        ],
      },
      {
        key: 'contact',
        title: t('যোগাযোগের তথ্য', 'Contact information'),
        groups: [],
        fields: [
          { key: 'father_mobile', label: t('মোবাইল (পিতা)'), type: 'tel', required: true, role: 'primaryMobile', options: [] },
          { key: 'mother_mobile', label: t('মোবাইল (মাতা)'), type: 'tel', required: false, role: 'secondaryMobile', options: [] },
          { key: 'email', label: t('ইমেইল'), type: 'email', required: true, role: 'email', options: [] },
          { key: 'address', label: t('বর্তমান ঠিকানা'), type: 'textarea', required: true, role: 'address', options: [] },
          { key: 'children_count', label: t('সন্তান সংখ্যা'), type: 'number', required: false, options: [] },
        ],
      },
    ],
  };
}
