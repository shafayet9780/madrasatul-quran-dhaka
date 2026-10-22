import { describe, expect, it } from 'vitest';
import { homeSeed, siteSeed } from './cms-coverage';
import seed from '../../scripts/data/cms-coverage-seed.json';

const old = {
  contactInfo: { address: seed.siteSettings.addressWas },
  locationInfo: { googleMapsUrl: 'https://maps.example', landmarks: [{ _key: 'l1', name: { english: 'Uttara Center Metrorail Station' }, distance: '600m' }] },
};

describe('siteSeed', () => {
  it('fills the new fields, tidies the old address and adds Mirpur DOHS', () => {
    const { setIfMissing, set, landmark } = siteSeed(old, seed.siteSettings);
    expect(Object.keys(setIfMissing)).toEqual(['locationInfo.gettingHere', 'locationInfo.metroStation', 'locationInfo.metroWalk', 'links']);
    expect(set).toEqual({ 'contactInfo.address': seed.siteSettings.address });
    expect(landmark).toMatchObject({ _key: 'mirpurDohs', distance: '2.5 km' });
  });

  it('leaves an editor’s address and an existing landmark alone, and does nothing once seeded', () => {
    const edited = { contactInfo: { address: { bengali: 'নতুন', english: 'New' } }, locationInfo: { ...old.locationInfo, landmarks: [{ name: { english: 'mirpur dohs' } }] } };
    expect(siteSeed(edited, seed.siteSettings)).toMatchObject({ set: {} });
    expect(siteSeed(edited, seed.siteSettings).landmark).toBeUndefined();
    const seeded = { contactInfo: { address: seed.siteSettings.address }, links: {}, locationInfo: { gettingHere: {}, metroStation: {}, metroWalk: '600m', landmarks: [seed.siteSettings.landmark] } };
    expect(siteSeed(seeded, seed.siteSettings)).toEqual({ setIfMissing: {}, set: {} });
  });
});

describe('homeSeed', () => {
  it('sets the hero text only where there is none', () => {
    expect(homeSeed(undefined, seed.homePage)).toEqual({ hero: seed.homePage.hero });
    expect(homeSeed({ hero: { line: {} } }, seed.homePage)).toEqual({});
  });
});
