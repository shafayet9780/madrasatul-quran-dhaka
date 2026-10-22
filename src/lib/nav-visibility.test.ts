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

  it('toggles the menu links', () => {
    const visibility: NavigationVisibility = { showCurriculum: false, showBooks: false };
    expect(isSectionVisible('curriculum', visibility)).toBe(false);
    expect(isSectionVisible('books', visibility)).toBe(false);
    expect(isSectionVisible('campus', visibility)).toBe(true);
    expect(isSectionVisible('contact', visibility)).toBe(true);
  });

  it('always shows keys with no toggle (home)', () => {
    const visibility: NavigationVisibility = { showTeachers: false, showCampus: false };
    expect(isSectionVisible('home', visibility)).toBe(true);
    expect(isSectionVisible('unknownKey', visibility)).toBe(true);
  });

  it('shows the gallery only once it is switched on', () => {
    expect(isSectionVisible('gallery', undefined)).toBe(false);
    expect(isSectionVisible('gallery', {})).toBe(false);
    expect(isSectionVisible('gallery', { showGallery: false })).toBe(false);
    expect(isSectionVisible('gallery', { showGallery: true })).toBe(true);
  });

  it('shows the notice board only once it is switched on', () => {
    expect(isSectionVisible('notices', undefined)).toBe(false);
    expect(isSectionVisible('notices', { showNotices: false })).toBe(false);
    expect(isSectionVisible('notices', { showNotices: true })).toBe(true);
  });

  it('switches the About us page off as a whole (people)', () => {
    expect(isSectionVisible('people', { showPeople: false })).toBe(false);
    expect(isSectionVisible('directors', { showPeople: false })).toBe(true);
  });
});
