import { describe, expect, it } from 'vitest';
import { BOOKS_URL, navPages, siteNav } from './nav';

const keys = (items: ReturnType<typeof siteNav>) => items.map((i) => ('items' in i ? `${i.key}(${i.items.map((l) => l.key).join(',')})` : i.key));

describe('siteNav', () => {
  it('lists every section in order when nothing is switched off', () => {
    const items = siteNav('bengali', {});
    expect(keys(items)).toEqual(['about', 'curriculum', 'campus', 'admissions', 'contact', 'books']);
    expect(items[0]).toEqual({ key: 'about', href: '/bengali/about' });
    expect(items[2]).toEqual({ key: 'campus', href: '/bengali/campus' });
    expect(items[5]).toEqual({ key: 'books', href: BOOKS_URL, external: true });
  });

  it('follows the Site Settings switches', () => {
    // The live settings in October 2026: the old About us switch is off, but the About us page follows Our people.
    const live = { showAbout: false, showAcademics: true, showPrograms: false, showPeople: true, showDirectors: true, showAdvisors: true, showTeachers: false, showAdmissions: true, showContact: true, showBooks: true };
    expect(keys(siteNav('english', live))).toEqual(['about', 'curriculum', 'campus', 'admissions', 'contact', 'books']);
    expect(keys(siteNav('english', { showAcademics: false }))).not.toContain('curriculum');
    // Campus has its own switch; the old About us switch does not hide it.
    expect(keys(siteNav('english', { ...live, showCampus: false }))).not.toContain('campus');
  });

  it('shows About us while the board or the advisors show', () => {
    expect(keys(siteNav('english', { showDirectors: false }))).toContain('about');
    expect(keys(siteNav('english', { showDirectors: false, showAdvisors: false }))).not.toContain('about');
    expect(keys(siteNav('english', { showPeople: false }))).not.toContain('about');
  });

  it('gives the footer the pages only, in menu order', () => {
    expect(navPages(siteNav('english', {})).map((l) => l.href)).toEqual(['/english/about', '/english/curriculum', '/english/campus', '/english/admissions', '/english/contact']);
  });
});
