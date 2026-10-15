import { describe, expect, it } from 'vitest';
import { BOOKS_URL, navPages, siteNav } from './nav';

const keys = (items: ReturnType<typeof siteNav>) => items.map((i) => ('items' in i ? `${i.key}(${i.items.map((l) => l.key).join(',')})` : i.key));

describe('siteNav', () => {
  it('lists every section in the live order when nothing is switched off', () => {
    const items = siteNav('bengali', {});
    expect(keys(items)).toEqual(['about(ourStory,campus,news)', 'curriculum', 'people(directors,advisors,teachers)', 'admissions', 'contact', 'books']);
    expect(items[1]).toEqual({ key: 'curriculum', href: '/bengali/curriculum' });
    expect(items[5]).toEqual({ key: 'books', href: BOOKS_URL, external: true });
  });

  it('follows the Site Settings switches', () => {
    // The live settings in October 2026.
    const live = { showAbout: false, showAcademics: true, showPrograms: false, showPeople: true, showDirectors: true, showAdvisors: true, showTeachers: false, showAdmissions: true, showContact: true, showBooks: true };
    expect(keys(siteNav('english', live))).toEqual(['curriculum', 'people(directors,advisors)', 'admissions', 'contact', 'books']);
    expect(keys(siteNav('english', { showCampus: false, showNews: false }))[0]).toBe('about(ourStory)');
    expect(keys(siteNav('english', { showAcademics: false }))).not.toContain('curriculum');
  });

  it('drops a menu with nothing left in it', () => {
    expect(keys(siteNav('english', { showDirectors: false, showAdvisors: false, showTeachers: false }))).not.toContain('people()');
    expect(siteNav('english', { showDirectors: false, showAdvisors: false, showTeachers: false }).some((i) => i.key === 'people')).toBe(false);
  });

  it('gives the footer the pages only, in menu order', () => {
    expect(navPages(siteNav('english', { showAbout: false, showTeachers: false })).map((l) => l.href)).toEqual([
      '/english/curriculum',
      '/english/directors',
      '/english/advisors',
      '/english/admissions',
      '/english/contact',
    ]);
  });
});
