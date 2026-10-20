import { describe, expect, it } from 'vitest';
import { LexoRank } from 'lexorank';
import bengali from '../../messages/bengali.json';
import english from '../../messages/english.json';
import { phoneUse } from './admissions-contact';
import { droppedFields, feeUnsets, homeFromSite, orderRanks, pagesOnOffFrom, preAdmissionFormDoc, schoolDetails, seoSeed } from './studio-cleanup';

// The live Site Settings and Footer of October 2026, cut down to what matters here.
const site = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  _rev: 'r1',
  title: { bengali: 'মাদরাসাতুল কুরআন ঢাকা ', english: 'Madrasatul Quran Dhaka' },
  logo: { asset: { _ref: 'image-logo' } },
  heroImages: [{ _key: 'h1', image: { asset: { _ref: 'image-1' } }, alt: 'principal', title: { english: 'Campus' }, order: 3, description: { english: '1' } }],
  statistics: { totalStudents: 130, teacherCount: 28, graduationRate: 95, yearsOfService: 1 },
  admissionInfo: { admissionPhone: '+880 1302-332244' },
  seo: { metaTitle: { english: 'x' } },
  navigationVisibility: { showAbout: false, showAcademics: true, showCurriculum: true, showTeachers: false, showPrograms: false },
  contactInfo: {
    admissionsPhone: '+8801302332244',
    whatsappNumber: '+8801301226644',
    address: { bengali: 'বাসা ৩৭', english: 'House 37' },
    phone: [
      { _key: 'p1', label: { english: 'Senior Admin' }, number: '+880 1302-332244', type: 'main', isPrimary: true, isActive: true },
      { _key: 'p2', label: { english: 'Admin' }, number: '+880 1301 226644', type: 'main', isPrimary: true, isActive: true },
      { _key: 'p3', label: { english: 'Accounts' }, number: '+880 1304 226644', type: 'main', isPrimary: true, isActive: false },
    ],
    email: [{ _key: 'e1', address: 'info@example.com', label: { english: 'General' }, type: 'info', isPrimary: true, isActive: true }],
  },
  locationInfo: { googleMapsUrl: 'https://maps.app.goo.gl/x', landmarks: [{ _key: 'l1', name: { english: 'Metro' }, distance: '600m', icon: 'bus' }], transportation: {} },
};
const footer = { subtitle: { english: 'An ideal combination' }, description: { english: 'Building character' }, copyright: { english: '© 2025' } };

describe('schoolDetails', () => {
  const next = schoolDetails(site, footer);

  it('keeps only the new fields, with the footer’s tagline and mission', () => {
    expect(Object.keys(next).sort()).toEqual(['_id', '_type', 'contactInfo', 'locationInfo', 'logo', 'mission', 'tagline']);
    expect(next.tagline).toEqual(footer.subtitle);
    expect(next.mission).toEqual(footer.description);
    expect(next.locationInfo).toEqual({ googleMapsUrl: 'https://maps.app.goo.gl/x', landmarks: [{ _key: 'l1', name: { english: 'Metro' }, distance: '600m' }] });
  });

  it('marks what each phone is for, by the old admissions number and the labels', () => {
    expect(next.contactInfo.phone).toEqual([
      { _key: 'p1', label: { english: 'Senior Admin' }, number: '+880 1302-332244', usedFor: 'admissions', isActive: true },
      { _key: 'p2', label: { english: 'Admin' }, number: '+880 1301 226644', usedFor: 'office', isActive: true },
      { _key: 'p3', label: { english: 'Accounts' }, number: '+880 1304 226644', usedFor: 'accounts', isActive: false },
    ]);
    expect(next.contactInfo.email).toEqual([{ _key: 'e1', address: 'info@example.com', isActive: true }]);
    expect(next.contactInfo).not.toHaveProperty('admissionsPhone');
  });

  it('adds the old admissions number when the list did not have it', () => {
    const only = schoolDetails({ ...site, contactInfo: { ...site.contactInfo, phone: [site.contactInfo.phone[1]] } });
    expect(only.contactInfo.phone[0]).toMatchObject({ number: '+8801302332244', usedFor: 'admissions' });
  });

  it('runs again without changes', () => {
    expect(schoolDetails(next)).toEqual(next);
    expect(droppedFields(next)).toEqual([]);
  });

  it('keeps the fields the CMS coverage seed fills in (docs/cms-coverage.md)', () => {
    const seeded = { ...next, links: { books: 'https://books.example' }, locationInfo: { ...next.locationInfo, gettingHere: { english: '600 m east' }, metroStation: { english: 'Uttara Center' }, metroWalk: '600m' } };
    expect(schoolDetails(seeded)).toEqual(seeded);
    expect(droppedFields(seeded)).toEqual([]);
  });

  it('reports what goes', () => {
    expect(droppedFields(site)).toEqual(['title', 'heroImages', 'statistics', 'admissionInfo', 'seo', 'navigationVisibility', 'contactInfo.admissionsPhone', 'locationInfo.transportation']);
  });
});

describe('phoneUse', () => {
  it('reads accounts from the label, and keeps a use already set', () => {
    expect(phoneUse({ number: '01700000000', type: 'admission' })).toBe('admissions');
    expect(phoneUse({ number: '01700000000', label: { english: 'Accounts' } })).toBe('accounts');
    expect(phoneUse({ number: '01700000000', label: { english: 'Transport desk' } })).toBe('office');
    expect(phoneUse({ number: '01700000000', usedFor: 'accounts' }, '01700000000')).toBe('accounts');
  });
});

describe('homeFromSite', () => {
  it('moves the hero photos (in their order, without the unused fields) and the numbers', () => {
    expect(homeFromSite(site, undefined)).toEqual({
      heroImages: [{ _key: 'h1', image: { asset: { _ref: 'image-1' } }, alt: 'principal', title: { english: 'Campus' } }],
      statistics: { totalStudents: 130, teacherCount: 28 },
    });
  });
  it('leaves what the Homepage already has', () => {
    expect(homeFromSite(site, { heroImages: [{}], statistics: {} })).toEqual({});
  });
});

describe('pagesOnOffFrom', () => {
  it('carries the switches over, curriculum only when both old switches were on', () => {
    expect(pagesOnOffFrom(site.navigationVisibility)).toMatchObject({ showTeachers: false, showCurriculum: true, showPeople: true, showCampus: false, showGallery: false, showNotices: false });
    expect(pagesOnOffFrom({ showAcademics: false }).showCurriculum).toBe(false);
    expect(pagesOnOffFrom(undefined)).not.toHaveProperty('showAbout');
  });
});

describe('seoSeed', () => {
  it('starts from the site’s own titles and descriptions, {session} kept for the pre-admission page', () => {
    const seo = seoSeed({ bengali, english }, 'Default');
    expect(seo.description).toEqual({ english: 'Default' });
    expect(Object.keys(seo.pages)).toHaveLength(9);
    expect(seo.pages.admissions.title).toEqual({ bengali: bengali.admissions.meta.title, english: english.admissions.meta.title });
    expect(seo.pages.preAdmission.title.english).toContain('{session}');
    for (const entry of Object.values(seo.pages) as { title: Record<string, string>; description: Record<string, string> }[]) {
      expect(entry.title.bengali && entry.title.english && entry.description.bengali && entry.description.english).toBeTruthy();
    }
  });
});

describe('preAdmissionFormDoc', () => {
  it('keeps the 2027 form and “Form open”, without the old form', () => {
    const doc = preAdmissionFormDoc(
      { _id: 'abc', _type: 'preAdmissionForm', _rev: 'r', sections: [1], cycle: { session: '2027' }, declarationText: { bengali: 'x' }, generalQuestions: [1], parentInfoFields: {}, successMessage: {}, formSettings: { isEnabled: true, formTitle: {}, submissionDate: '2026-01-01' } },
      'preAdmissionForm',
    );
    expect(doc).toEqual({ _id: 'preAdmissionForm', _type: 'preAdmissionForm', sections: [1], cycle: { session: '2027' }, declarationText: { bengali: 'x' }, formSettings: { isEnabled: true } });
  });
});

describe('orderRanks and feeUnsets', () => {
  it('makes ranks that sort in order and parse as the plugin’s', () => {
    const ranks = orderRanks(12);
    expect([...ranks].sort()).toEqual(ranks);
    expect(new Set(ranks).size).toBe(12);
    for (const r of ranks) expect(LexoRank.parse(r).toString()).toBe(r);
  });
  it('places new ranks after the last one', () => {
    const [last] = orderRanks(1);
    const next = orderRanks(2, '0|zzzzz0:');
    expect(next.every((r) => r > '0|zzzzz0:' && r > last)).toBe(true);
    expect([...next].sort()).toEqual(next);
  });
  it('unsets the FAQ and only the notes that exist', () => {
    expect(feeUnsets({ faqQuestion: {}, transport: [{ _key: 'micro', note: {} }, { _key: 'auto' }] })).toEqual(['faqQuestion', 'transport[_key=="micro"].note']);
  });
});
