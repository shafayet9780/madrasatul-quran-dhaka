import { describe, expect, it } from 'vitest';
import { confirmationEmail, resumeEmail } from './mail-templates';

describe('admissions emails', () => {
  it('confirmation: ID, WhatsApp link and what to bring, in the guardian’s language', () => {
    const bn = confirmationEmail({ locale: 'bengali', session: '2027', publicRef: 'KG-017', studentName: 'আব্দুল্লাহ', whatsappUrl: 'https://chat.whatsapp.com/x', statusUrl: 'https://s/f', evaluationFee: 500 });
    expect(bn.subject).toBe('আবেদন সম্পন্ন: KG-017, প্রি-অ্যাডমিশন ২০২৭');
    expect(bn.html).toContain('href="https://chat.whatsapp.com/x"');
    expect(bn.text).toContain('৳৫০০');
    const en = confirmationEmail({ locale: 'english', session: '2027', publicRef: 'KG-017', studentName: '<b>x</b>', whatsappUrl: null, statusUrl: 'https://s/f', evaluationFee: 500 });
    expect(en.subject).toBe('Application complete: KG-017, pre-admission 2027');
    expect(en.html).not.toContain('<b>x</b>');
    expect(en.html).not.toContain('chat.whatsapp.com');
    expect(en.text).not.toMatch(/—/);
  });

  it('resume link email', () => {
    const e = resumeEmail({ locale: 'english', session: '2027', resumeUrl: 'https://s/english/pre-admission/resume?t=abc', deadline: '30 November, 11:59 pm' });
    expect(e.html).toContain('resume?t=abc');
    expect(e.text).toContain('Deadline: 30 November, 11:59 pm');
  });
});
