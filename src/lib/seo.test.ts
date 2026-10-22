import { describe, expect, it } from 'vitest';
import { generateSchoolStructuredData, openingHoursFrom } from './seo';
import { getSiteUrl } from './site-url';

describe('generateSchoolStructuredData', () => {
  it('describes the school from the School details values it is given', () => {
    const ld = generateSchoolStructuredData({
      locale: 'english',
      logo: 'https://cdn.sanity.io/logo.png',
      address: 'House 37, Road 2/A, Uttara, Dhaka.',
      hours: 'Sat - Thu: 8:00 AM - 5:00 PM',
      telephone: '+8801302332244',
      emails: ['a@example.com', 'b@example.com'],
      mapUrl: 'https://maps.example.com/school',
      sameAs: ['https://facebook.com/school'],
    });
    expect(ld).toMatchObject({
      '@type': 'School',
      name: 'Madrasatul Quran',
      alternateName: 'মাদরাসাতুল কুরআন',
      url: `${getSiteUrl()}/english`,
      logo: 'https://cdn.sanity.io/logo.png',
      image: `${getSiteUrl()}/images/social/school.jpg`,
      geo: { '@type': 'GeoCoordinates', latitude: 23.8563215, longitude: 90.3682335 },
      openingHoursSpecification: { dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '08:00', closes: '17:00' },
      address: { '@type': 'PostalAddress', streetAddress: 'House 37, Road 2/A, Uttara, Dhaka.', addressCountry: 'BD' },
      telephone: '+8801302332244',
      email: ['a@example.com', 'b@example.com'],
      hasMap: 'https://maps.example.com/school',
      sameAs: ['https://facebook.com/school'],
    });
  });

  it('leaves out what School details does not have', () => {
    const ld = generateSchoolStructuredData({ locale: 'bengali', emails: ['a@example.com'], sameAs: [] });
    expect(ld.name).toBe('মাদরাসাতুল কুরআন');
    expect(ld).toMatchObject({ email: 'a@example.com' });
    for (const key of ['logo', 'address', 'openingHoursSpecification', 'telephone', 'hasMap', 'sameAs']) expect(ld).not.toHaveProperty(key);
  });
});

describe('openingHoursFrom', () => {
  it('reads a day range and a time range', () => {
    expect(openingHoursFrom('Sun-Thu: 7:30 am – 12 pm')).toEqual({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '07:30',
      closes: '12:00',
    });
    expect(openingHoursFrom('Saturday - Saturday: 12:15 AM - 11:59 PM')).toMatchObject({ dayOfWeek: ['Saturday'], opens: '00:15', closes: '23:59' });
  });

  it('leaves out text written any other way', () => {
    for (const text of [undefined, '', 'Sat - Thu 8 to 5', 'Sat, Mon: 8:00 AM - 5:00 PM', 'Xyz - Thu: 8:00 AM - 5:00 PM', 'Sat - Thu: 8:00 AM - 17:00 PM', 'Sat - Thu: 0:30 AM - 5:75 PM']) expect(openingHoursFrom(text)).toBeUndefined();
  });
});
