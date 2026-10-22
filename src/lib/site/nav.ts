import type { Locale } from '@/lib/i18n';
import { isSectionVisible, type NavigationVisibility } from '@/lib/nav-visibility';

export type NavKey = 'about' | 'curriculum' | 'campus' | 'gallery' | 'admissions' | 'notices' | 'contact' | 'books';
export type NavLink = { key: NavKey; href: string; external?: boolean };
/** A dropdown of links. None today (the About us page replaced the Our people menu); News may join one. */
export type NavMenu = { key: string; items: NavLink[] };
export type NavItem = NavLink | NavMenu;

export const isMenu = (item: NavItem): item is NavMenu => 'items' in item;

/**
 * The main menu: About us (the board and advisors), Curriculum, Campus, Gallery, Admissions, Notices, Contact, Our books.
 * Whatever Pages on/off switches off is left out: About us follows the Our people switch and shows while directors or
 * advisors do; Campus follows its own switch; Gallery and Notices show only once their switches are on. The old About
 * us menu (our story, news) is gone: the notice board takes the place of news. Our books shows while it has a link
 * (School details → Outside links). The logo links home.
 */
export function siteNav(locale: Locale, visibility?: NavigationVisibility | null, booksUrl?: string): NavItem[] {
  const show = (key: string) => isSectionVisible(key, visibility);
  const page = (key: NavKey, path: string): NavLink => ({ key, href: `/${locale}${path}` });
  return [
    ...(show('people') && (show('directors') || show('advisors')) ? [page('about', '/about')] : []),
    ...(show('curriculum') ? [page('curriculum', '/curriculum')] : []),
    ...(show('campus') ? [page('campus', '/campus')] : []),
    ...(show('gallery') ? [page('gallery', '/gallery')] : []),
    ...(show('admissions') ? [page('admissions', '/admissions')] : []),
    ...(show('notices') ? [page('notices', '/notices')] : []),
    ...(show('contact') ? [page('contact', '/contact')] : []),
    ...(show('books') && booksUrl ? [{ key: 'books' as const, href: booksUrl, external: true }] : []),
  ];
}

/** The site's own pages in the menu, in order (the footer lists these). */
export const navPages = (items: NavItem[]): NavLink[] => items.flatMap((i) => (isMenu(i) ? i.items : [i])).filter((l) => !l.external);
