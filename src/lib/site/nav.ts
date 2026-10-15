import type { Locale } from '@/lib/i18n';
import { isSectionVisible, type NavigationVisibility } from '@/lib/nav-visibility';

export type NavKey =
  | 'ourStory'
  | 'campus'
  | 'news'
  | 'curriculum'
  | 'directors'
  | 'advisors'
  | 'teachers'
  | 'admissions'
  | 'contact'
  | 'books';
export type NavLink = { key: NavKey; href: string; external?: boolean };
export type NavMenu = { key: 'about' | 'people'; items: NavLink[] };
export type NavItem = NavLink | NavMenu;

export const BOOKS_URL = 'https://alquranervasha.com/downloads';

export const isMenu = (item: NavItem): item is NavMenu => 'items' in item;

/**
 * The main menu, in the live site's order: About us (our story, campus, news), Curriculum, Our people (directors,
 * advisors, teachers), Admissions, Contact, Our books. Whatever Site Settings switches off is left out (a section's
 * switch hides its whole menu, and a menu with nothing left is dropped). The logo links home.
 */
export function siteNav(locale: Locale, visibility?: NavigationVisibility | null): NavItem[] {
  const show = (key: string) => isSectionVisible(key, visibility);
  const page = (key: NavKey, path: string): NavLink => ({ key, href: `/${locale}${path}` });
  const menu = (key: NavMenu['key'], items: NavLink[]): NavItem[] => {
    const shown = show(key) ? items.filter((i) => show(i.key)) : [];
    return shown.length ? [{ key, items: shown }] : [];
  };
  return [
    ...menu('about', [page('ourStory', '/about'), page('campus', '/campus'), page('news', '/news')]),
    ...(show('academics') && show('curriculum') ? [page('curriculum', '/curriculum')] : []),
    ...menu('people', [page('directors', '/directors'), page('advisors', '/advisors'), page('teachers', '/teachers')]),
    ...(show('admissions') ? [page('admissions', '/admissions')] : []),
    ...(show('contact') ? [page('contact', '/contact')] : []),
    ...(show('books') ? [{ key: 'books' as const, href: BOOKS_URL, external: true }] : []),
  ];
}

/** The site's own pages in the menu, in order (the footer lists these). */
export const navPages = (items: NavItem[]): NavLink[] => items.flatMap((i) => (isMenu(i) ? i.items : [i])).filter((l) => !l.external);
