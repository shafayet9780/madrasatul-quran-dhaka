import { describe, expect, it } from 'vitest';
import { normaliseMobile, normaliseStudentId, titleCase, toAsciiDigits, toBengaliDigits } from './normalise';

describe('digits', () => {
  it('converts Bengali digits both ways', () => {
    expect(toAsciiDigits('০১৭১২৩৪৫৬৭৮')).toBe('01712345678');
    expect(toBengaliDigits(8.5)).toBe('৮.৫');
    expect(toBengaliDigits('২০ Oct 10')).toBe('২০ Oct ১০');
  });
  it('normalises a typed student ID', () => {
    expect(normaliseStudentId(' ২০২৪-০০ ১৫ ')).toBe('20240015');
    expect(normaliseStudentId('\u200c90001')).toBe('90001');
  });
});

describe('normaliseMobile', () => {
  it.each([
    ['01712345678', '8801712345678'],
    ['8801712345678', '8801712345678'],
    // The ERP export puts a zero-width non-joiner before every number.
    ['\u200c+8801712345678', '8801712345678'],
    ['+8801712345678', '8801712345678'],
    ['+880 1712-345678', '8801712345678'],
    ['০১৯১২৩৪৫৬৭৮', '8801912345678'],
    ['(017) 1234 5678', '8801712345678'],
    // Guardians abroad: kept when written with a country code.
    ['\u200c+491639711896', '491639711896'],
    ['+34 611 441 092', '34611441092'],
    ['0044 7911 123456', '447911123456'],
  ])('%s → %s', (input, expected) => expect(normaliseMobile(input)).toBe(expected));

  it.each(['', null, undefined, '0171234567', '017123456789', '01212345678', '1712345678', '+8801212345678', '+880171234567', '491639711896', '+4916', '+0491639711896', '+4916397118961234'])(
    'rejects %s',
    (input) => expect(normaliseMobile(input)).toBeNull()
  );
});

describe('titleCase', () => {
  it.each([
    ['ADRUP HOSSAIN MAHAJ', 'Adrup Hossain Mahaj'],
    ['md. abdullah  al-amin', 'Md. Abdullah Al-Amin'],
    ["o'neil", "O'Neil"],
    ['  Maryam Binte Rafiq ', 'Maryam Binte Rafiq'],
    ['মারইয়াম', 'মারইয়াম'],
  ])('%s → %s', (input, expected) => expect(titleCase(input)).toBe(expected));
});
