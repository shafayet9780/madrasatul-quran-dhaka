import type { Locale } from '@/lib/i18n';
import { isSectionVisible, type NavigationVisibility } from '@/lib/nav-visibility';

export type NavKey = 'about' | 'curriculum' | 'campus' | 'gallery' | 'admissions' | 'contact' | 'books';
export type NavLink = { key: NavKey; href: string; external?: boolean };
/** A dropdown of links. None today (the About us page replaced the Our people menu); News may join one. */
export type NavMenu = { key: string; items: NavLink[] };
export type NavItem = NavLink | NavMenu;

export const BOOKS_URL = 'https://alquranervasha.com/downloads';

export const isMenu = (item: NavItem): item is NavMenu => 'items' in item;

/**
 * The main menu: About us (the board and advisors), Curriculum, Campus, Gallery, Admissions, Contact, Our books. Whatever
 * Site Settings switches off is left out: About us follows the Our people switch and shows while directors or advisors do;
 * Campus follows its own switch; Gallery shows only once its switch is on. The old About us menu (our story, news) is
 * gone until those pages are rebuilt. The logo links home.
 */
export function siteNav(locale: Locale, visibility?: NavigationVisibility | null): NavItem[] {
  const show = (key: string) => isSectionVisible(key, visibility);
  const page = (key: NavKey, path: string): NavLink => ({ key, href: `/${locale}${path}` });
  return [
    ...(show('people') && (show('directors') || show('advisors')) ? [page('about', '/about')] : []),
    ...(show('academics') && show('curriculum') ? [page('curriculum', '/curriculum')] : []),
    ...(show('campus') ? [page('campus', '/campus')] : []),
    ...(show('gallery') ? [page('gallery', '/gallery')] : []),
    ...(show('admissions') ? [page('admissions', '/admissions')] : []),
    ...(show('contact') ? [page('contact', '/contact')] : []),
    ...(show('books') ? [{ key: 'books' as const, href: BOOKS_URL, external: true }] : []),
  ];
}

/** The site's own pages in the menu, in order (the footer lists these). */
export const navPages = (items: NavItem[]): NavLink[] => items.flatMap((i) => (isMenu(i) ? i.items : [i])).filter((l) => !l.external);
