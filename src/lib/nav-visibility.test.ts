import { describe, it, expect } from 'vitest';
import { isSectionVisible, type NavigationVisibility } from './nav-visibility';

describe('isSectionVisible', () => {
  it('treats missing config as visible (fail-open)', () => {
    expect(isSectionVisible('teachers', undefined)).toBe(true);
    expect(isSectionVisible('directors', null)).toBe(true);
    expect(isSectionVisible('advisors', {})).toBe(true);
  });

  it('hides only the section whose toggle is false', () => {
    const visibility: NavigationVisibility = { showTeachers: false };
    expect(isSectionVisible('teachers', visibility)).toBe(false);
    expect(isSectionVisible('directors', visibility)).toBe(true);
    expect(isSectionVisible('advisors', visibility)).toBe(true);
  });

  it('treats an explicit true toggle as visible', () => {
    expect(isSectionVisible('directors', { showDirectors: true })).toBe(true);
  });

  it('toggles generic nav links (about/academics/other)', () => {
    const visibility: NavigationVisibility = { showNews: false, showBooks: false };
    expect(isSectionVisible('news', visibility)).toBe(false);
    expect(isSectionVisible('books', visibility)).toBe(false);
    expect(isSectionVisible('campus', visibility)).toBe(true);
    expect(isSectionVisible('curriculum', visibility)).toBe(true);
    expect(isSectionVisible('contact', visibility)).toBe(true);
  });

  it('always shows keys with no toggle (home)', () => {
    const visibility: NavigationVisibility = { showTeachers: false, showNews: false };
    expect(isSectionVisible('home', visibility)).toBe(true);
    expect(isSectionVisible('unknownKey', visibility)).toBe(true);
  });

  it('supports whole-section masters (people/about/academics)', () => {
    expect(isSectionVisible('about', { showAbout: false })).toBe(false);
    expect(isSectionVisible('academics', { showAcademics: false })).toBe(false);
    expect(isSectionVisible('people', { showPeople: false })).toBe(false);
    expect(isSectionVisible('about', { showAcademics: false })).toBe(true);
  });
});
