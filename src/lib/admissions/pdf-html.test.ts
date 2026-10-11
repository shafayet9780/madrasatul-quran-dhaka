import { describe, expect, it } from 'vitest';
import { applicationHtml, type PdfData } from './pdf-html';
import { buildSnapshot } from './snapshot';
import { liveFormDocument } from './testing/live-form';

const snapshot = buildSnapshot(liveFormDocument());
const data = (patch: Partial<PdfData> = {}): PdfData => ({
  snapshot,
  answers: {
    student_name_bengali: 'আব্দুল্লাহ',
    studied_before: 'yes',
    previous_result_card: 'missing',
    student_birth_registration: { key: 'k', name: 'c.pdf', size: 1, type: 'application/pdf' },
    transport_interest: 'yes',
    transport_stop: 'uttara_micro_1:uttara_micro_1_4',
  },
  publicRef: 'KG-017',
  studentNameBn: 'আব্দুল্লাহ',
  studentNameEn: null,
  submittedAt: null,
  declaredAt: new Date('2026-10-29T14:38:00Z'),
  conductPledgedAt: new Date('2026-10-29T14:36:00Z'),
  familyDeclaredAt: null,
  fatherName: 'রফিক',
  motherName: 'সাবিনা',
  receipt: null,
  photos: {},
  staffQrSvg: '<svg></svg>',
  whatsappQrSvg: null,
  school: { name: 'মাদরাসাতুল কুরআন', line: '', logo: null },
  fontCss: '',
  generatedAt: new Date('2026-10-29T15:00:00Z'),
  ...patch,
});

describe('application PDF (HTML)', () => {
  const html = applicationHtml(data());

  it('has four pages: student, parents, the rest with the code of conduct, consents and office', () => {
    expect(html.match(/class="page-break"/g)).toHaveLength(3);
    expect(html.indexOf('অভিভাবকদের আচরণবিধি')).toBeLessThan(html.indexOf('অঙ্গীকার ও ঘোষণা'));
    expect(html.indexOf('অঙ্গীকার ও ঘোষণা')).toBeLessThan(html.indexOf('শুধু অফিস ও পরীক্ষকের জন্য'));
    expect(html).toContain('এই আচরণবিধি মেনে চলার অঙ্গীকার ও স্বাক্ষর: পৃষ্ঠা ৪');
  });

  it('has a tighter layout for the reprint when a form runs past four pages', () => {
    expect(html).toContain('<body>');
    const tight = applicationHtml(data(), true);
    expect(tight).toContain('<body class="tight">');
    expect(tight).toMatch(/\.tight \.qa th\{width:360px\}/);
    expect(tight.match(/class="page-break"/g)).toHaveLength(3);
  });

  it('shows each consent ticked with its time only when given online, and both signatures', () => {
    expect(html.match(/class="tick on"/g)).toHaveLength(2);
    expect(html.match(/অনলাইনে সম্মতি:/g)).toHaveLength(2);
    expect(html).toContain('পিতার স্বাক্ষর: রফিক');
    expect(html).toContain('মাতার স্বাক্ষর: সাবিনা');
  });

  it('prints the transport stop with the charge seen, and what to bring, flagging documents not uploaded', () => {
    expect(html).toContain('সেক্টর ১৩ (উত্তরা মাইক্রো ১)');
    expect(html).toContain('৳৫,০০০, মাইক্রো');
    expect(html).toContain('সর্বশেষ ফলাফল কার্ডের মূল কপি<b class="must">। অনলাইনে জমা দেওয়া হয়নি, অবশ্যই আনবেন।</b>');
    expect(html).toContain('জমা দেওয়া হয়নি, সঙ্গে আনবেন');
    expect(html).not.toContain('মূল্যায়ন');
  });

  it('keeps a form version without a code of conduct on its old layout', () => {
    const old = applicationHtml(data({ snapshot: { ...snapshot, settings: { ...snapshot.settings, conduct: undefined, bringList: undefined } } }));
    expect(old).not.toContain('অভিভাবকদের আচরণবিধি');
    expect(old).toContain('ঘোষণা');
    expect(old.match(/class="tick on"/g)).toHaveLength(1);
  });
});
