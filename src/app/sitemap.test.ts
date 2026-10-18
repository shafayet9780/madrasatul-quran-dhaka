import { afterEach, expect, it, vi } from 'vitest';
import sitemap from './sitemap';
import { DEFAULT_SITE_URL } from '@/lib/site-url';
vi.mock('@/lib/queries/directors', () => ({
  getDirectorSlugs: async () => [],
}));
vi.mock('@/lib/queries/teachers', () => ({ getTeacherSlugs: async () => [] }));
const visibility = vi.hoisted(() => ({ value: {} as Record<string, boolean> }));
vi.mock('@/lib/queries/site', () => ({
  getNavigationVisibility: async () => visibility.value,
}));
vi.mock('@/lib/content-service', () => ({
  getContentService: () => ({
    getAlbums: async () => [
      { _id: 'a', slug: 'parents-day', title: { bengali: 'অভিভাবক সমাবেশ', english: 'Parents’ day' }, date: '2026-10-11', topic: 'events', photos: [{ asset: { _ref: 'image-a' }, alt: { bengali: 'ছবি', english: 'Photo' } }] },
      { _id: 'b', slug: 'bengali-only', title: { bengali: 'শুধু বাংলা' }, date: '2026-10-01', topic: 'events', photos: [{ asset: { _ref: 'image-b' }, alt: { bengali: 'ছবি' } }] },
    ],
  }),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  visibility.value = {};
});
it('includes Admissions, Curriculum, About us and Campus in both languages on the public origin', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
  const entries = await sitemap();
  for (const route of ['admissions', 'curriculum', 'about', 'campus'])
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
  // The board and advisors live on About us; their old pages only redirect.
  expect(entries.some(entry => /\/(directors|advisors)$/.test(entry.url))).toBe(false);
});

it('lists the gallery and its albums only once the gallery is switched on', async () => {
  expect((await sitemap()).some(entry => entry.url.includes('/gallery'))).toBe(false);
  visibility.value = { showGallery: true };
  const urls = (await sitemap()).map(entry => entry.url);
  expect(urls).toEqual(expect.arrayContaining([
    `${DEFAULT_SITE_URL}/bengali/gallery`,
    `${DEFAULT_SITE_URL}/english/gallery`,
    `${DEFAULT_SITE_URL}/bengali/gallery/parents-day`,
    `${DEFAULT_SITE_URL}/english/gallery/parents-day`,
    `${DEFAULT_SITE_URL}/bengali/gallery/bengali-only`,
  ]));
  // An album with no English name has no English page.
  expect(urls).not.toContain(`${DEFAULT_SITE_URL}/english/gallery/bengali-only`);
});
