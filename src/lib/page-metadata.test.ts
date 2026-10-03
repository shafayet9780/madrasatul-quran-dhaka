import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSiteUrl, DEFAULT_SITE_URL } from './site-url';
import { generatePageMetadata } from './page-metadata';
import { languageTag } from './locale-tags';

afterEach(() => vi.unstubAllEnvs());
describe('public SEO origin', () => {
  it.each([
    'http://localhost:3000',
    'http://127.0.0.1:3100',
    'http://[::1]:3000',
    'not a url',
  ])('does not publish development URLs: %s', value => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', value);
    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL);
  });
  it('normalizes a configured public site to its origin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://school.example/something/');
    expect(getSiteUrl()).toBe('https://school.example');
  });
});
describe('localized page metadata', () => {
  it.each(['bengali', 'english'] as const)(
    'uses the correct page URL and reciprocal alternatives for %s',
    locale => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
      const metadata = generatePageMetadata({
        title: 'Admissions - Madrasatul Quran',
        description: 'Admission information',
        locale,
        path: '/admissions',
      });
      expect(metadata.title).toEqual({
        absolute: 'Admissions - Madrasatul Quran',
      });
      expect(metadata.alternates).toEqual({
        canonical: `${DEFAULT_SITE_URL}/${locale}/admissions`,
        languages: {
          'bn-BD': `${DEFAULT_SITE_URL}/bengali/admissions`,
          en: `${DEFAULT_SITE_URL}/english/admissions`,
          'x-default': `${DEFAULT_SITE_URL}/bengali/admissions`,
        },
      });
      expect(metadata.openGraph).toMatchObject({
        title: 'Admissions - Madrasatul Quran',
        description: 'Admission information',
        url: `${DEFAULT_SITE_URL}/${locale}/admissions`,
        locale: locale === 'bengali' ? 'bn_BD' : 'en_US',
      });
      expect(metadata.twitter).toMatchObject({
        title: 'Admissions - Madrasatul Quran',
        description: 'Admission information',
        images: [`${DEFAULT_SITE_URL}/images/social/school.jpg`],
      });
    }
  );
  it('maps URL segment names to valid HTML language codes', () => {
    expect(languageTag('bengali')).toBe('bn');
    expect(languageTag('english')).toBe('en');
  });
});
