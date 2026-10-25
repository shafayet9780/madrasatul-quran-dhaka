/**
 * Editor-controlled page switches: Studio → Menu and pages (the `pagesOnOff` document, read through the site settings
 * query as `navigationVisibility`). Missing/undefined is treated as visible (fail-open) so an unconfigured site shows
 * everything. The gallery and the notice board are the exceptions: they show only once switched on, so the menu never
 * links to an empty page.
 */

export interface NavigationVisibility {
  // Pages (also 404 when off)
  showPeople?: boolean;
  showDirectors?: boolean;
  showTeachers?: boolean;
  showAdvisors?: boolean;
  showCampus?: boolean;
  showGallery?: boolean;
  showNotices?: boolean;
  // Menu links only
  showCurriculum?: boolean;
  showAdmissions?: boolean;
  showContact?: boolean;
  showBooks?: boolean;
  // The menu's order (Menu order: the items' keys)
  menuOrder?: string[] | null;
}

/** The menu's items in their usual order, with their names in the Studio (Menu and pages → Menu order). */
export const MENU_ITEMS = [
  { value: 'about', title: 'About us' },
  { value: 'curriculum', title: 'Curriculum' },
  { value: 'campus', title: 'Campus' },
  { value: 'gallery', title: 'Gallery' },
  { value: 'admissions', title: 'Admissions' },
  { value: 'notices', title: 'Notice board' },
  { value: 'contact', title: 'Contact' },
  { value: 'books', title: 'Our Books' },
];

/** Maps a page key to its switch. Unlisted keys are always visible. */
const TOGGLE_KEY: Record<string, keyof NavigationVisibility> = {
  people: 'showPeople',
  directors: 'showDirectors',
  teachers: 'showTeachers',
  advisors: 'showAdvisors',
  campus: 'showCampus',
  curriculum: 'showCurriculum',
  admissions: 'showAdmissions',
  contact: 'showContact',
  books: 'showBooks',
};

export function isSectionVisible(
  key: string,
  visibility?: NavigationVisibility | null
): boolean {
  if (key === 'gallery') return visibility?.showGallery === true;
  if (key === 'notices') return visibility?.showNotices === true;
  if (!visibility) return true;
  const flag = TOGGLE_KEY[key];
  if (!flag) return true;
  return visibility[flag] !== false;
}
