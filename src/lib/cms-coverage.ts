// The release-day seed of docs/cms-coverage.md: what scripts/cms-coverage-seed.ts writes into a dataset. It only fills
// what is empty, and replaces the address only while it is still the old one, so editors' changes stay. Pure.
import type seedData from '../../scripts/data/cms-coverage-seed.json';

type Doc = Record<string, any>;
type Seed = typeof seedData;

const same = (a: Doc | undefined, b: Doc) => a?.bengali === b.bengali && a?.english === b.english;

/** School details: the new location fields and links where empty, the tidy address over the old one, and Mirpur DOHS among the landmarks. */
export function siteSeed(site: Doc, seed: Seed['siteSettings']): { setIfMissing: Doc; set: Doc; landmark?: Doc } {
  const location = site.locationInfo ?? {};
  const setIfMissing: Doc = {};
  for (const key of ['gettingHere', 'metroStation', 'metroWalk'] as const) if (location[key] == null) setIfMissing[`locationInfo.${key}`] = seed[key];
  if (site.links == null) setIfMissing.links = seed.links;
  const set: Doc = same(site.contactInfo?.address, seed.addressWas) ? { 'contactInfo.address': seed.address } : {};
  const named = (location.landmarks ?? []).some((l: Doc) => l.name?.english?.trim().toLowerCase() === seed.landmark.name.english.toLowerCase());
  return { setIfMissing, set, ...(!named && { landmark: seed.landmark }) };
}

/** The Homepage's hero text, where it has none. */
export const homeSeed = (home: Doc | undefined, seed: Seed['homePage']): Doc => (home?.hero ? {} : { hero: seed.hero });
