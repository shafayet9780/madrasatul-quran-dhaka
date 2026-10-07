import { ageOn, classesForAge, parseIsoDate, sessionStart } from './age';
import { formatApplicationId, parseApplicationId } from './ids';
import { emailSuggestion, formatMobile, normaliseEmail, normaliseMobile } from './normalise';
import { fieldWithRole } from './form-config';
import { sampleSnapshot } from './testing/fixtures';

describe('mobile and email', () => {
  it('accepts Bengali digits, spaces and dashes', () => {
    expect(normaliseMobile('০১৭১২ ৩৪৫৬৭৮')).toBe('8801712345678');
    expect(normaliseMobile('+880 1712-345678')).toBe('8801712345678');
    expect(normaliseMobile('1712345678')).toBeNull();
  });

  it('formats for display', () => {
    expect(formatMobile('8801712345678')).toBe('01712-345678');
    expect(formatMobile('491701234567')).toBe('+491701234567');
  });

  it('normalises email and suggests fixes for common typos', () => {
    expect(normaliseEmail('  Rafiq.Islam@Gmail.com ')).toBe('rafiq.islam@gmail.com');
    expect(normaliseEmail('rafiq@gmail')).toBeNull();
    expect(emailSuggestion('rafiq.islam@gmial.com')).toBe('rafiq.islam@gmail.com');
    expect(emailSuggestion('rafiq@GMAIL.CON')).toBe('rafiq@gmail.com');
    expect(emailSuggestion('rafiq@gmail.com')).toBeNull();
    expect(emailSuggestion('no-at-sign')).toBeNull();
  });
});

describe('age', () => {
  it('rejects impossible dates', () => {
    expect(parseIsoDate('2021-02-29')).toBeNull();
    expect(parseIsoDate('2020-02-29')).toEqual({ y: 2020, m: 2, d: 29 });
    expect(parseIsoDate('12/03/2021')).toBeNull();
  });

  it('counts completed years and months at session start', () => {
    expect(sessionStart('2027')).toBe('2027-01-01');
    expect(ageOn('2021-03-12', '2027-01-01')).toEqual({ years: 5, months: 9 });
    expect(ageOn('2021-01-01', '2027-01-01')).toEqual({ years: 6, months: 0 });
    expect(ageOn('2021-01-02', '2027-01-01')).toEqual({ years: 5, months: 11 });
    expect(ageOn('2028-01-01', '2027-01-01')).toBeNull();
  });

  it('finds the classes whose age range fits', () => {
    const options = fieldWithRole(sampleSnapshot(), 'classApplied')!.options;
    expect(classesForAge(options, { years: 5, months: 9 })).toEqual(['kg']);
    expect(classesForAge(options, { years: 3, months: 0 })).toEqual([]);
    expect(classesForAge(options, null)).toEqual([]);
  });
});

describe('application IDs', () => {
  const codes = ['N', 'KG', 'C1', 'C4'];

  it('formats with three-digit serials', () => {
    expect(formatApplicationId('KG', 17)).toBe('KG-017');
    expect(formatApplicationId('N', 1000)).toBe('N-1000');
  });

  it('parses what guardians type', () => {
    expect(parseApplicationId('kg 17', codes)).toBe('KG-017');
    expect(parseApplicationId('KG-০১৭', codes)).toBe('KG-017');
    expect(parseApplicationId('c1017', codes)).toBe('C1-017');
    expect(parseApplicationId('n-5', codes)).toBe('N-005');
    expect(parseApplicationId('X-017', codes)).toBeNull();
    expect(parseApplicationId('KG-000', codes)).toBeNull();
    expect(parseApplicationId('01712345678', codes)).toBeNull();
  });
});
