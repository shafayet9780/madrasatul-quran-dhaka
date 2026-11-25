import { describe, expect, it } from 'vitest';
import bengali from '../../../messages/bengali.json';
import english from '../../../messages/english.json';
import { SCHOOL_NAME, SCHOOL_SHORT_NAME } from './school-name';

const strings = (o: unknown): string[] => (typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(strings) : []);

describe('the school’s name', () => {
  it('is the same in the translations as in code', () => {
    expect(bengali.site.schoolName).toBe(SCHOOL_NAME.bengali);
    expect(english.site.schoolName).toBe(SCHOOL_NAME.english);
    expect(bengali.home.hero.name).toBe(SCHOOL_NAME.bengali);
    expect(english.home.hero.name).toBe(SCHOOL_NAME.english);
    for (const [messages, locale] of [[bengali, 'bengali'], [english, 'english']] as const) {
      expect(messages.preAdmission.brand).toBe(SCHOOL_NAME[locale]);
      expect(messages.site.footer.copyright).toContain(SCHOOL_NAME[locale]);
    }
  });

  it('ends every page title in the legal name, written without a comma', () => {
    for (const [messages, locale] of [[bengali, 'bengali'], [english, 'english']] as const) {
      const all = strings(messages);
      const short = SCHOOL_SHORT_NAME[locale];
      expect(all.filter((s) => s.endsWith(`| ${short}`))).toEqual([]);
      expect(all.filter((s) => s.includes(`${short}, ${locale === 'bengali' ? 'ঢাকা' : 'Dhaka'}`))).toEqual([]);
    }
  });
});
