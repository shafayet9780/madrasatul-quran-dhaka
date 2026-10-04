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
  });
});

describe('normaliseMobile', () => {
  it.each([
    ['01712345678', '8801712345678'],
    ['8801712345678', '8801712345678'],
    ['+8801712345678', '8801712345678'],
    ['+880 1712-345678', '8801712345678'],
    ['০১৯১২৩৪৫৬৭৮', '8801912345678'],
    ['(017) 1234 5678', '8801712345678'],
  ])('%s → %s', (input, expected) => expect(normaliseMobile(input)).toBe(expected));

  it.each(['', null, undefined, '0171234567', '017123456789', '01212345678', '1712345678', '+8811712345678'])(
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
