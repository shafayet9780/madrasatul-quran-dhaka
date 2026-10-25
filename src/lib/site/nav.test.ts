import { describe, expect, it } from 'vitest';
import { MENU_ITEMS } from '@/lib/nav-visibility';
import { navPages, siteNav } from './nav';

const BOOKS_URL = 'https://books.example/downloads';

const keys = (items: ReturnType<typeof siteNav>) => items.map((i) => ('items' in i ? `${i.key}(${i.items.map((l) => l.key).join(',')})` : i.key));

describe('siteNav', () => {
  it('lists every section in order when nothing is switched off', () => {
    const items = siteNav('bengali', {}, BOOKS_URL);
    expect(keys(items)).toEqual(['about', 'curriculum', 'campus', 'admissions', 'contact', 'books']);
    expect(items[0]).toEqual({ key: 'about', href: '/bengali/about' });
    expect(items[2]).toEqual({ key: 'campus', href: '/bengali/campus' });
    expect(items[5]).toEqual({ key: 'books', href: BOOKS_URL, external: true });
  });

  it('follows the Menu and pages switches', () => {
    // The live switches in October 2026 (Teachers off).
    const live = { showPeople: true, showDirectors: true, showAdvisors: true, showTeachers: false, showCurriculum: true, showAdmissions: true, showContact: true, showBooks: true };
    expect(keys(siteNav('english', live, BOOKS_URL))).toEqual(['about', 'curriculum', 'campus', 'admissions', 'contact', 'books']);
    expect(keys(siteNav('english', { showCurriculum: false }, BOOKS_URL))).not.toContain('curriculum');
    expect(keys(siteNav('english', { ...live, showCampus: false }, BOOKS_URL))).not.toContain('campus');
  });

  it('shows the gallery after Campus once its switch is on', () => {
    expect(keys(siteNav('english', {}, BOOKS_URL))).not.toContain('gallery');
    const items = siteNav('bengali', { showGallery: true }, BOOKS_URL);
    expect(keys(items)).toEqual(['about', 'curriculum', 'campus', 'gallery', 'admissions', 'contact', 'books']);
    expect(items[3]).toEqual({ key: 'gallery', href: '/bengali/gallery' });
  });

  it('shows the notice board before Contact once its switch is on', () => {
    expect(keys(siteNav('english', {}, BOOKS_URL))).not.toContain('notices');
    const items = siteNav('bengali', { showNotices: true }, BOOKS_URL);
    expect(keys(items)).toEqual(['about', 'curriculum', 'campus', 'admissions', 'notices', 'contact', 'books']);
    expect(items[4]).toEqual({ key: 'notices', href: '/bengali/notices' });
  });

  it('shows About us while the board or the advisors show', () => {
    expect(keys(siteNav('english', { showDirectors: false }, BOOKS_URL))).toContain('about');
    expect(keys(siteNav('english', { showDirectors: false, showAdvisors: false }, BOOKS_URL))).not.toContain('about');
    expect(keys(siteNav('english', { showPeople: false }, BOOKS_URL))).not.toContain('about');
  });

  it('follows Menu order, with any item it leaves out after the listed ones', () => {
    const all = { showGallery: true, showNotices: true };
    expect(keys(siteNav('english', { ...all, menuOrder: ['admissions', 'contact', 'about', 'notices', 'curriculum', 'campus', 'gallery', 'books'] }, BOOKS_URL))).toEqual(['admissions', 'contact', 'about', 'notices', 'curriculum', 'campus', 'gallery', 'books']);
    expect(keys(siteNav('english', { ...all, menuOrder: ['contact', 'admissions'] }, BOOKS_URL))).toEqual(['contact', 'admissions', 'about', 'curriculum', 'campus', 'gallery', 'notices', 'books']);
    expect(keys(siteNav('english', { menuOrder: ['contact', 'gallery', 'admissions'] }, BOOKS_URL))).toEqual(['contact', 'admissions', 'about', 'curriculum', 'campus', 'books']);
    expect(navPages(siteNav('english', { menuOrder: ['books', 'contact'] }, BOOKS_URL)).map((l) => l.key)).toEqual(['contact', 'about', 'curriculum', 'campus', 'admissions']);
  });

  it('lists the Studio’s menu items in the usual order (the Menu order seed writes it)', () => {
    expect(keys(siteNav('english', { showCampus: true, showGallery: true, showNotices: true }, BOOKS_URL))).toEqual(MENU_ITEMS.map((i) => i.value));
  });

  it('gives the footer the pages only, in menu order', () => {
    expect(navPages(siteNav('english', {}, BOOKS_URL)).map((l) => l.href)).toEqual(['/english/about', '/english/curriculum', '/english/campus', '/english/admissions', '/english/contact']);
  });
});

describe('Our books', () => {
  it('shows only while School details has its link', () => {
    expect(siteNav('english', {}).map((i) => i.key)).not.toContain('books');
  });
});
