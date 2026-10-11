import { describe, expect, it } from 'vitest';
import { answerText } from './answer-text';
import { allFields } from './form-config';
import { sampleSnapshot } from './testing/fixtures';

const labels = { yes: 'হ্যাঁ', no: 'না', notGiven: 'দেওয়া হয়নি', fileAttached: (t: string) => `যুক্ত হয়েছে (${t})`, fileMissing: 'জমা দেওয়া হয়নি, সঙ্গে আনবেন' };
const field = (key: string) => allFields(sampleSnapshot()).find((f) => f.key === key)!;

describe('answerText', () => {
  it('shows a document the guardian will bring, and a transport stop with its route and charge', () => {
    const card = { ...field('birth_certificate'), allowMissing: true };
    expect(answerText(card, 'missing', 'bengali', labels)).toBe('জমা দেওয়া হয়নি, সঙ্গে আনবেন');
    const transport = {
      vehicles: [{ key: 'micro', name: { bengali: 'মাইক্রো', english: 'Micro' }, monthly: 5000 }, { key: 'auto', name: { bengali: 'অটো', english: 'Auto' } }],
      routes: [
        { key: 'm', name: { bengali: 'মিরপুর মাইক্রো', english: 'Mirpur micro' }, area: { bengali: 'মিরপুর' }, vehicle: 'micro', stops: [{ key: 's1', name: { bengali: 'মিরপুর ১০', english: 'Mirpur 10' } }] },
        { key: 'a', name: { bengali: 'উত্তরা অটো', english: 'Uttara auto' }, area: { bengali: 'উত্তরা' }, vehicle: 'auto', stops: [{ key: 's1', name: { bengali: 'সেক্টর ১৮' } }] },
      ],
    };
    const stop = { key: 'transport_stop', label: { bengali: 'স্টপ' }, type: 'transportStop' as const, required: true, options: [] };
    expect(answerText(stop, 'm:s1', 'bengali', labels, transport)).toBe('মিরপুর ১০, মিরপুর মাইক্রো রুট (মাইক্রো, মাসিক ৳৫,০০০)');
    expect(answerText(stop, 'm:s1', 'english', labels, transport)).toBe('Mirpur 10, Mirpur micro route (Micro, ৳5,000 a month)');
    expect(answerText(stop, 'a:s1', 'bengali', labels, transport)).toBe('সেক্টর ১৮, উত্তরা অটো রুট (অটো)');
    expect(answerText(stop, 'none', 'bengali', labels, transport)).toBe('আমার এলাকা কোনো রুটে নেই');
  });

  it('shows each answer type in the page language', () => {
    expect(answerText(field('class_applied'), 'kg', 'bengali', labels)).toBe('কেজি');
    expect(answerText(field('date_of_birth'), '2021-03-12', 'english', labels)).toBe('12 March 2021');
    expect(answerText(field('father_mobile'), '8801712345678', 'bengali', labels)).toBe('০১৭১২-৩৪৫৬৭৮');
    expect(answerText(field('father_prayer_location'), ['mosque'], 'bengali', labels)).not.toBe('mosque');
    expect(answerText(field('birth_certificate'), { key: 'k', name: 'c.pdf', size: 1, type: 'application/pdf' }, 'bengali', labels)).toBe('যুক্ত হয়েছে (PDF)');
    expect(answerText(field('address'), undefined, 'bengali', labels)).toBe('দেওয়া হয়নি');
  });
});
