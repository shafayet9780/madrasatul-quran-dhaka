import { describe, expect, it } from 'vitest';
import { inputTail, isVerified, lookupValue } from './guardian-logic';

describe('lookupValue', () => {
  it('normalises a mobile as the importer stores it', () => {
    expect(lookupValue('mobile', '০১৯১৫-৪৮২৭৩৬')).toBe('8801915482736');
    expect(lookupValue('mobile', '+44 7911 123456')).toBe('447911123456');
    expect(lookupValue('mobile', '12345')).toBeNull();
  });
  it('normalises a student ID typed with Bengali digits or spaces', () => {
    expect(lookupValue('id', ' ১০০ ১৪ ')).toBe('10014');
    expect(lookupValue('id', '')).toBeNull();
    expect(lookupValue('id', "10014' OR 1=1")).toBeNull();
  });
});

describe('inputTail', () => {
  it('keeps the last 4 characters only', () => {
    expect(inputTail('8801915482736')).toBe('2736');
    expect(inputTail('14')).toBe('14');
  });
});

describe('isVerified', () => {
  const student = { fatherMobile: '8801915482736', motherMobile: '447911123456' };
  it('matches either parent on the canonical number, foreign numbers included', () => {
    expect(isVerified(lookupValue('mobile', '01915 482 736'), student)).toBe(true);
    expect(isVerified(lookupValue('mobile', '+44 7911 123456'), student)).toBe(true);
  });
  it('is false for another number, no number or a student without mobiles', () => {
    expect(isVerified('8801855203941', student)).toBe(false);
    expect(isVerified(null, student)).toBe(false);
    expect(isVerified('8801915482736', { fatherMobile: null, motherMobile: null })).toBe(false);
  });
});
