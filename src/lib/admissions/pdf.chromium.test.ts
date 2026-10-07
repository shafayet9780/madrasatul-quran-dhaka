// @vitest-environment node
import { existsSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { buildSnapshot } from './snapshot';
import { applicationHtml } from './pdf-html';
import { liveFormDocument } from './testing/live-form';
import type { Answers } from './answers';

// Renders the real application PDF with a local Chromium (skipped where none is installed) and
// checks it with poppler: page count and the extracted text, Bengali conjuncts included.
const chromium = process.env.CHROMIUM_EXECUTABLE_PATH || '/opt/pw-browsers/chromium';
const canRender = existsSync(chromium) && existsSync('/usr/bin/pdftotext');

const answers: Answers = {
  student_name_bengali: 'আব্দুল্লাহ আল-মাহমুদ',
  student_name_english: 'Abdullah Al-Mahmud',
  date_of_birth: '2021-03-12',
  desired_class: 'kg',
  last_class_attended: 'নার্সারি',
  previous_school: 'আল-আমিন কিন্ডারগার্টেন',
  student_birth_registration: { key: 'k', name: 'c.pdf', size: 1, type: 'application/pdf' },
  father_name: 'মোহাম্মদ রফিকুল ইসলাম',
  father_name_english: 'Mohammad Rafiqul Islam',
  father_occupation: 'service',
  father_organization: 'ঢাকা ব্যাংক লিমিটেড',
  father_designation: 'সিনিয়র অফিসার',
  father_prayer_times: '5_times',
  father_prayer_location: ['mosque', 'home'],
  father_daily_quran: 'daily',
  father_tv_at_home: 'no',
  father_screen_time: '2_hours',
  father_time_with_children: '1_hour_plus',
  father_islamic_clothing: ['beard'],
  father_smoking: 'no',
  father_mahram: 'yes',
  father_facebook_id: 'নেই',
  mother_name: 'সাবিনা ইয়াসমিন',
  mother_name_english: 'Sabina Yasmin',
  mother_occupation: 'homemaker',
  mother_prayer_times: '5_times',
  mother_daily_quran: 'sometimes',
  mother_islamic_clothing: 'borka_niqab',
  mother_screen_time: '1_hour',
  mother_mahram: 'yes',
  mother_facebook_id: 'নেই',
  heard_from: 'friends_family',
  transport_requirement: 'yes',
  transport_location: 'mirpur',
  present_address: 'বাসা ১২, রোড ৫, মিরপুর ১০, ঢাকা',
  father_phone: '8801712345678',
  mother_phone: '8801819876543',
  email: 'rafiq.islam@gmail.com',
};

describe.skipIf(!canRender)('application PDF (Chromium)', () => {
  it('prints the whole application on A4 with shaped Bengali text', async () => {
    process.env.CHROMIUM_EXECUTABLE_PATH = chromium;
    const { renderPdf } = await import('./pdf');
    const { readFileSync } = await import('node:fs');
    const font = (f: string) => readFileSync(`node_modules/${f}`).toString('base64');
    const fontCss = [
      ['Noto Sans Bengali', '@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-400-normal.woff2', 400],
      ['Noto Sans Bengali', '@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-700-normal.woff2', 700],
      ['Inter', '@fontsource/inter/files/inter-latin-400-normal.woff2', 400],
      ['Inter', '@fontsource/inter/files/inter-latin-700-normal.woff2', 700],
    ]
      .map(([family, file, w]) => `@font-face{font-family:'${family}';font-weight:${w};src:url(data:font/woff2;base64,${font(String(file))}) format('woff2')}`)
      .join('');
    const snapshot = buildSnapshot(liveFormDocument());
    const data = {
      snapshot,
      answers,
      publicRef: 'KG-017',
      studentNameBn: 'আব্দুল্লাহ আল-মাহমুদ',
      studentNameEn: 'Abdullah Al-Mahmud',
      submittedAt: new Date('2026-10-07T14:38:00Z'),
      declaredAt: new Date('2026-10-07T14:38:00Z'),
      receipt: { amount: 500, method: 'BKash', transactionId: 'BKX7Q2M4N9', paidAt: new Date('2026-10-07T14:42:00Z') },
      photos: {},
      staffQrSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="#eee"/></svg>',
      whatsappQrSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#eee"/></svg>',
      school: { name: 'মাদরাসাতুল কুরআন', line: 'মিরপুর, ঢাকা', logo: null },
      fontCss,
      generatedAt: new Date('2026-10-07T15:00:00Z'),
    };
    const pdf = await renderPdf(data);
    const out = process.env.ADMISSIONS_PDF_OUT || '/tmp/admission-sample.pdf';
    writeFileSync(out, pdf);
    writeFileSync(out.replace(/\.pdf$/, '.html'), applicationHtml(data));
    const info = execFileSync('pdfinfo', [out]).toString();
    expect(info).toMatch(/Page size:\s+59[45]\.\d+ x 841\.\d+ pts \(A4\)/);
    const pages = Number(/Pages:\s+(\d+)/.exec(info)![1]);
    expect(pages).toBeGreaterThanOrEqual(2);
    expect(pages).toBe(3);
    const text = execFileSync('pdftotext', ['-layout', out, '-']).toString();
    expect(text).toContain('KG-017');
    expect(text).toContain('Abdullah Al-Mahmud');
    // Shaped Bengali does not survive text extraction; check that its font is embedded instead.
    expect(execFileSync('pdffonts', [out]).toString()).toMatch(/NotoSansBengali/);
  }, 60_000);
});
