/**
 * Editor-controlled visibility for navbar links. Toggles live on Site Settings
 * (`navigationVisibility`). Missing/undefined is treated as visible (fail-open)
 * so an unconfigured site shows everything.
 *
 * Keys correspond to NAV_ITEMS keys in the header. Keys not in the map below
 * (home, and the `about`/`academics`/`people` dropdown parents) are always
 * visible — parents are gated by whether any of their children remain visible.
 */

export interface NavigationVisibility {
  // Whole-section masters (hide an entire menu in one switch)
  showPeople?: boolean;
  showAbout?: boolean;
  showAcademics?: boolean;
  // "Our People" links (also 404 their pages when hidden)
  showDirectors?: boolean;
  showTeachers?: boolean;
  showAdvisors?: boolean;
  // About menu
  showOurStory?: boolean;
  showCampus?: boolean;
  showNews?: boolean;
  // Academics menu
  showCurriculum?: boolean;
  showPrograms?: boolean;
  // Other top-level links
  showAdmissions?: boolean;
  showContact?: boolean;
  showBooks?: boolean;
}

/** Maps a nav-item key to its visibility flag. Unlisted keys are always visible. */
const TOGGLE_KEY: Record<string, keyof NavigationVisibility> = {
  people: 'showPeople',
  about: 'showAbout',
  academics: 'showAcademics',
  directors: 'showDirectors',
  teachers: 'showTeachers',
  advisors: 'showAdvisors',
  ourStory: 'showOurStory',
  campus: 'showCampus',
  news: 'showNews',
  curriculum: 'showCurriculum',
  programs: 'showPrograms',
  admissions: 'showAdmissions',
  contact: 'showContact',
  books: 'showBooks',
};

export function isSectionVisible(
  key: string,
  visibility?: NavigationVisibility | null
): boolean {
  if (!visibility) return true;
  const flag = TOGGLE_KEY[key];
  if (!flag) return true;
  return visibility[flag] !== false;
}
