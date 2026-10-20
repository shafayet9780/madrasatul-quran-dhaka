// The Studio clean-up of October 2026 (docs/studio-cleanup.md): how each old document becomes its new shape. Pure, so
// the data script (scripts/studio-cleanup.ts) can show every change before it writes anything.
import { LexoRank } from 'lexorank';
import { normalizePhone, phoneUse } from './admissions-contact';

type Doc = Record<string, any>;
type Bi = { bengali?: string; english?: string };

/** Types the site no longer reads: deleted with their drafts. `staffMember` has had no schema since 2025. */
export const DELETED_TYPES = ['newsEvent', 'academicProgram', 'facility', 'page', 'prospectus', 'footer', 'staffMember'];

/** The old form's fields (the "Legacy form" tab), and the old form settings beside "Form open". */
export const LEGACY_FORM_FIELDS = ['generalQuestions', 'studentInfoFields', 'studentAssessmentFields', 'parentInfoFields', 'additionalQuestions', 'contactInfoFields', 'successMessage'];

/** The drag-ordered types, with the order the site shows them in today (the GROQ the old queries used). */
export const ORDERED_TYPES: { type: string; oldOrder: string; unset: string[] }[] = [
  { type: 'director', oldOrder: 'displayOrder asc', unset: ['displayOrder', 'featured', 'gender', 'signatureName'] },
  { type: 'advisor', oldOrder: 'displayOrder asc', unset: ['displayOrder', 'featured', 'gender'] },
  { type: 'teacher', oldOrder: 'department->displayOrder asc, displayOrder asc', unset: ['displayOrder', 'featured'] },
  { type: 'department', oldOrder: 'displayOrder asc', unset: ['displayOrder', 'description'] },
  { type: 'testimonial', oldOrder: 'coalesce(order, 1000) asc, _createdAt asc', unset: ['order'] },
];

/** Ranks for a list in its current order, made the way the ordering plugin makes them; after `after` when given. */
export function orderRanks(count: number, after?: string): string[] {
  const ranks: string[] = [];
  let rank = after ? LexoRank.parse(after) : LexoRank.min();
  for (let i = 0; i < count; i++) {
    rank = rank.genNext().genNext();
    ranks.push(rank.toString());
  }
  return ranks;
}

const pick = (doc: Doc | undefined, keys: string[]) =>
  Object.fromEntries(keys.filter((k) => doc?.[k] !== undefined && doc?.[k] !== null).map((k) => [k, doc![k]]));

/**
 * School details: only the fields the new schema has. The footer's subtitle and description become the tagline and the
 * mission; every phone gets what it is used for (the old admissions number joins the list if it was not in it).
 */
export function schoolDetails(site: Doc, footer?: Doc): Doc {
  const contact = site.contactInfo ?? {};
  const admissions = contact.admissionsPhone as string | undefined;
  const phones = (contact.phone ?? []).map((p: Doc) => ({
    ...pick(p, ['_key', 'label', 'number']),
    usedFor: phoneUse(p, admissions),
    isActive: p.isActive !== false,
  }));
  if (admissions && !phones.some((p: Doc) => normalizePhone(p.number) === normalizePhone(admissions))) {
    phones.unshift({ _key: 'admissions', number: admissions, usedFor: 'admissions', label: { bengali: 'ভর্তি', english: 'Admissions' }, isActive: true });
  }
  const location = site.locationInfo ?? {};
  return {
    ...pick(site, ['_id', '_type', 'logo', 'favicon', 'defaultMaleAvatar', 'defaultFemaleAvatar', 'socialMedia']),
    ...(site.tagline ?? footer?.subtitle ? { tagline: site.tagline ?? footer!.subtitle } : {}),
    ...(site.mission ?? footer?.description ? { mission: site.mission ?? footer!.description } : {}),
    contactInfo: {
      ...pick(contact, ['whatsappNumber', 'address', 'officeHours']),
      phone: phones,
      email: (contact.email ?? []).map((e: Doc) => ({ ...pick(e, ['_key', 'address']), isActive: e.isActive !== false })),
    },
    locationInfo: {
      ...pick(location, ['googleMapsUrl', 'mapEmbedUrl']),
      landmarks: (location.landmarks ?? []).map((l: Doc) => pick(l, ['_key', 'name', 'distance'])),
    },
  };
}

/** The top-level and contact fields School details no longer has (for the dry run's report). */
export function droppedFields(site: Doc): string[] {
  const kept = new Set(['_id', '_type', '_rev', '_createdAt', '_updatedAt', '_system', 'logo', 'favicon', 'defaultMaleAvatar', 'defaultFemaleAvatar', 'socialMedia', 'tagline', 'mission', 'contactInfo', 'locationInfo']);
  const contactKept = new Set(['whatsappNumber', 'address', 'officeHours', 'phone', 'email']);
  const locationKept = new Set(['googleMapsUrl', 'mapEmbedUrl', 'landmarks']);
  return [
    ...Object.keys(site).filter((k) => !kept.has(k)),
    ...Object.keys(site.contactInfo ?? {}).filter((k) => !contactKept.has(k)).map((k) => `contactInfo.${k}`),
    ...Object.keys(site.locationInfo ?? {}).filter((k) => !locationKept.has(k)).map((k) => `locationInfo.${k}`),
  ];
}

/** The hero photos and the numbers, moved from School details to the Homepage (only what the Homepage lacks). */
export function homeFromSite(site: Doc, home: Doc | undefined): Doc {
  const set: Doc = {};
  if (!home?.heroImages?.length && site.heroImages?.length) {
    set.heroImages = site.heroImages.map((h: Doc) => pick(h, ['_key', 'image', 'alt', 'title']));
  }
  if (!home?.statistics && site.statistics) set.statistics = pick(site.statistics, ['totalStudents', 'teacherCount', 'achievements']);
  return set;
}

/** Pages on/off from the old switches. Curriculum had two (Academics and Curriculum): it shows only if both did. */
export function pagesOnOffFrom(nav: Doc = {}): Doc {
  const on = (key: string) => nav[key] !== false;
  return {
    _id: 'pagesOnOff',
    _type: 'pagesOnOff',
    showPeople: on('showPeople'),
    showDirectors: on('showDirectors'),
    showAdvisors: on('showAdvisors'),
    showTeachers: on('showTeachers'),
    showCampus: nav.showCampus === true, // off until the tour's photos are in (owner, 2026-10-20)
    showGallery: nav.showGallery === true,
    showNotices: nav.showNotices === true,
    showCurriculum: on('showAcademics') && on('showCurriculum'),
    showAdmissions: on('showAdmissions'),
    showContact: on('showContact'),
    showBooks: on('showBooks'),
  };
}

const SEO_MESSAGES: [string, string, string][] = [
  ['home', 'home.meta.title', 'home.meta.description'],
  ['about', 'about.meta.title', 'about.meta.description'],
  ['admissions', 'admissions.meta.title', 'admissions.meta.description'],
  ['preAdmission', 'preAdmission.intro.metaTitle', 'preAdmission.intro.metaDescription'],
  ['curriculum', 'curriculum.meta.title', 'curriculum.meta.description'],
  ['campus', 'campus.meta.title', 'campus.meta.description'],
  ['contact', 'contact.meta.title', 'contact.meta.description'],
  ['notices', 'notices.meta.title', 'notices.meta.description'],
  ['gallery', 'gallery.meta.title', 'gallery.meta.description'],
];

/** Search & sharing, started from the site's own wording (messages) so editors see what shows today. */
export function seoSeed(messages: { bengali: Doc; english: Doc }, description: string, shareImage?: Doc): Doc {
  const at = (path: string): Bi => ({
    bengali: path.split('.').reduce((o: any, k) => o?.[k], messages.bengali),
    english: path.split('.').reduce((o: any, k) => o?.[k], messages.english),
  });
  return {
    _id: 'seoSettings',
    _type: 'seoSettings',
    description: { english: description },
    ...(shareImage ? { shareImage } : {}),
    pages: Object.fromEntries(SEO_MESSAGES.map(([page, title, text]) => [page, { title: at(title), description: at(text) }])),
  };
}

/** The pre-admission form under its fixed id, without the old form's fields. */
export function preAdmissionFormDoc(form: Doc, id: string): Doc {
  const { _rev, _createdAt, _updatedAt, _system, formSettings, ...rest } = form;
  for (const key of LEGACY_FORM_FIELDS) delete rest[key];
  return { ...rest, _id: id, formSettings: pick(formSettings, ['isEnabled']) };
}

/** Unset paths for the vehicles' notes and the fees FAQ. */
export function feeUnsets(fees: Doc): string[] {
  return [
    ...['faqQuestion', 'faqAnswer'].filter((k) => fees[k] !== undefined),
    ...(fees.transport ?? []).filter((v: Doc) => v.note !== undefined).map((v: Doc) => `transport[_key=="${v._key}"].note`),
  ];
}
