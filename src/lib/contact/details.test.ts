import { describe, expect, it } from 'vitest';
import type { SiteSettings } from '@/types/sanity';
import { contactDetails, distanceLabel, mapEmbed } from './details';

const settings = {
  contactInfo: {
    address: { bengali: 'বাসা ৩৭, উত্তরা', english: 'House 37, Uttara' },
    officeHours: { bengali: 'শনি থেকে বৃহস্পতি', english: '' },
    phone: [
      { label: { bengali: 'সিনিয়র এডমিন', english: 'Senior Admin' }, number: '+880 1302-332244', usedFor: 'admissions', isActive: true },
      { label: { bengali: 'একাউন্টস', english: 'Accounts' }, number: '+880 1304 226644', usedFor: 'accounts', isActive: true },
      { label: { bengali: 'পুরনো', english: 'Old' }, number: '+880 1700 000000', usedFor: 'office', isActive: false },
      { label: { bengali: 'ভুল', english: 'Wrong' }, number: 'call us', usedFor: 'office', isActive: true },
    ],
    email: [
      { address: 'info@example.com', isActive: true },
      { address: 'old@example.com', isActive: false },
    ],
  },
  locationInfo: {
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=1',
    googleMapsUrl: 'https://maps.app.goo.gl/x',
    landmarks: [
      { name: { bengali: 'উত্তরা সেন্টার', english: 'Uttara Center' }, distance: '600m' },
      { name: { bengali: '', english: '' }, distance: '1 km' },
    ],
  },
} as unknown as SiteSettings;

describe('distanceLabel', () => {
  it('writes metres and kilometres in the page language', () => {
    expect(distanceLabel('600m', 'bengali')).toBe('৬০০ মি.');
    expect(distanceLabel('3 km', 'bengali')).toBe('৩ কিমি');
    expect(distanceLabel('2.5 KM', 'english')).toBe('2.5 km');
    expect(distanceLabel('600m', 'english')).toBe('600 m');
  });
  it('shows anything else as typed, with Bengali digits in Bengali', () => {
    expect(distanceLabel('5 minutes', 'bengali')).toBe('৫ minutes');
    expect(distanceLabel(undefined, 'english')).toBe('');
  });
});

describe('mapEmbed', () => {
  it("lets only Google's embed address into the frame", () => {
    expect(mapEmbed('https://www.google.com/maps/embed?pb=1')).toBe('https://www.google.com/maps/embed?pb=1');
    expect(mapEmbed('https://example.com/maps/embed')).toBeNull();
    expect(mapEmbed(undefined)).toBeNull();
  });
});

describe('contactDetails', () => {
  it('lists the active desks whose numbers parse, in the page language', () => {
    const d = contactDetails(settings, 'bengali');
    expect(d.desks).toEqual([
      { desk: 'সিনিয়র এডমিন', display: '০১৩০২-৩৩২২৪৪', tel: 'tel:+8801302332244', e164: '+8801302332244' },
      { desk: 'একাউন্টস', display: '০১৩০৪-২২৬৬৪৪', tel: 'tel:+8801304226644', e164: '+8801304226644' },
    ]);
    expect(d.phone?.e164).toBe('+8801302332244');
    expect(d.whatsapp?.e164).toBe('+8801301226644');
  });
  it('keeps active emails and named landmarks, and falls back to Bengali text', () => {
    const d = contactDetails(settings, 'english');
    expect(d.emails).toEqual(['info@example.com']);
    expect(d.landmarks).toEqual([{ name: 'Uttara Center', distance: '600 m' }]);
    expect(d.hours).toBe('শনি থেকে বৃহস্পতি');
    expect(d.address).toBe('House 37, Uttara');
    expect(d.mapEmbed).toBe('https://www.google.com/maps/embed?pb=1');
  });
  it('shows nothing without School details', () => {
    const d = contactDetails(null, 'english');
    expect(d.desks).toEqual([]);
    expect(d.emails).toEqual([]);
    expect(d.mapEmbed).toBeNull();
  });
});
