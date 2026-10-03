import { afterEach, expect, it, vi } from 'vitest';
import sitemap from './sitemap';
import { DEFAULT_SITE_URL } from '@/lib/site-url';
vi.mock('@/lib/queries/directors', () => ({
  getDirectorSlugs: async () => [],
}));
vi.mock('@/lib/queries/teachers', () => ({ getTeacherSlugs: async () => [] }));
vi.mock('@/lib/queries/site', () => ({
  getNavigationVisibility: async () => ({}),
}));
afterEach(() => vi.unstubAllEnvs());
it('includes Admissions and Curriculum in both languages on the public origin', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
  const entries = await sitemap();
  for (const route of ['admissions', 'curriculum'])
    for (const locale of ['bengali', 'english']) {
      expect(
        entries.find(
          entry => entry.url === `${DEFAULT_SITE_URL}/${locale}/${route}`
        )
      ).toMatchObject({
        alternates: {
          languages: {
            'bn-BD': `${DEFAULT_SITE_URL}/bengali/${route}`,
            en: `${DEFAULT_SITE_URL}/english/${route}`,
          },
        },
      });
    }
  expect(entries.every(entry => !entry.url.includes('localhost'))).toBe(true);
});
