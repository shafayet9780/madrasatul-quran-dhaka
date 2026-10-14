import { describe, expect, it } from 'vitest';
import { generateSchoolStructuredData } from './seo';
import { getSiteUrl } from './site-url';

describe('generateSchoolStructuredData', () => {
  it('describes the school from the Site Settings values it is given', () => {
    const ld = generateSchoolStructuredData({
      locale: 'english',
      logo: 'https://cdn.sanity.io/logo.png',
      address: 'House 37, Road 2/A, Uttara, Dhaka.',
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
      address: { '@type': 'PostalAddress', streetAddress: 'House 37, Road 2/A, Uttara, Dhaka.', addressCountry: 'BD' },
      telephone: '+8801302332244',
      email: ['a@example.com', 'b@example.com'],
      hasMap: 'https://maps.example.com/school',
      sameAs: ['https://facebook.com/school'],
    });
  });

  it('leaves out what Site Settings does not have', () => {
    const ld = generateSchoolStructuredData({ locale: 'bengali', emails: ['a@example.com'], sameAs: [] });
    expect(ld.name).toBe('মাদরাসাতুল কুরআন');
    expect(ld).toMatchObject({ email: 'a@example.com' });
    for (const key of ['logo', 'image', 'address', 'telephone', 'hasMap', 'sameAs']) expect(ld).not.toHaveProperty(key);
  });
});
