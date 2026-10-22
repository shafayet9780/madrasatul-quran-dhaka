/**
 * Editor-controlled page switches: Studio → Pages on/off (the `pagesOnOff` document, read through the site settings
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
}

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
