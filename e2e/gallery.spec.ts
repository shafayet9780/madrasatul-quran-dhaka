import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Runs against the local preview (pnpm test:e2e:admissions), where the gallery is switched on with sample albums
// (src/lib/gallery/testing/sample-albums.ts). Nothing loads from YouTube: the covers and the player are cut off.

async function expectNoSeriousAxe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.route(/youtube(-nocookie)?\.com|ytimg\.com/, (route) => route.abort());
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: /শুধু জরুরিগুলো|Reject non-essential/ }).click({ timeout: 3000 }).catch(() => {});
}

test('the gallery lists the albums month by month, filters them, and plays a video on tap', async ({ page, isMobile }) => {
  await open(page, '/bengali/gallery');
  await expect(page.locator('h1')).toHaveText('আমাদের দিনলিপি');
  if (!isMobile) await expect(page.getByRole('navigation', { name: 'প্রধান মেনু' }).first().getByRole('link', { name: 'গ্যালারি' })).toHaveAttribute('aria-current', 'page');

  const albums = page.getByRole('region', { name: '২০২৬ সালের অ্যালবাম' });
  await expect(albums.getByRole('heading', { level: 3 })).toHaveText(['অক্টোবর ২০২৬', 'সেপ্টেম্বর ২০২৬']);
  await expect(albums.getByRole('link', { name: /অভিভাবক সমাবেশ/ })).toHaveAttribute('href', '/bengali/gallery/parents-day-2026');

  // Two years of albums: the year switch shows; only topics with albums get a chip.
  const bar = page.getByRole('group', { name: 'অ্যালবাম বাছাই' });
  await expect(bar.getByRole('group', { name: 'বিষয়' }).getByRole('button')).toHaveText(['সব', 'কুরআন ও হিফজ', 'ক্লাস', 'অনুষ্ঠান', 'ভিডিও']);
  await bar.getByRole('button', { name: '২০২৫' }).click();
  await expect(page.locator('#gallery-albums')).toHaveText('২০২৫ সালের অ্যালবাম');
  await expect(page.getByRole('link', { name: /কুরআন তিলাওয়াত/ })).toBeVisible();
  await bar.getByRole('button', { name: '২০২৬' }).click();
  await bar.getByRole('button', { name: 'ভিডিও', exact: true }).click();
  const rows = page.getByRole('region', { name: '২০২৬ সালের অ্যালবাম' });
  await expect(rows.getByRole('listitem')).toHaveCount(2);

  // A video plays in a window; until then nothing from YouTube is on the page.
  await expect(page.locator('iframe')).toHaveCount(0);
  await rows.getByRole('link', { name: /সমাবেশের পুরো ভিডিও/ }).click();
  const player = page.getByRole('dialog', { name: 'সমাবেশের পুরো ভিডিও' });
  await expect(player.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/sample00001/);
  await player.getByRole('button', { name: 'বন্ধ করুন' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);

  await expect(page.getByRole('heading', { name: 'সব সময়ের অ্যালবাম' })).toBeVisible();
  await expectNoSeriousAxe(page);
});

test('an album with text opens as a story, and its photos open in the viewer', async ({ page }) => {
  await open(page, '/bengali/gallery/parents-day-2026');
  await expect(page.locator('h1')).toHaveText('অভিভাবক সমাবেশ');
  await expect(page.getByRole('link', { name: 'হোয়াটসঅ্যাপে পাঠান' })).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=.*gallery%2Fparents-day-2026/);
  await expect(page.getByRole('heading', { name: 'এই অ্যালবামের সব ছবি' })).toBeVisible();
  await expect(page.getByRole('link', { name: /আগের অ্যালবাম/ })).toHaveAttribute('href', '/bengali/gallery/painting-morning');
  await expectNoSeriousAxe(page);

  await page.getByRole('button', { name: 'বড় করে দেখুন: অফিস কক্ষ' }).click();
  const viewer = page.getByRole('dialog', { name: 'ছবি বড় করে দেখা' });
  await expect(viewer).toContainText('২ / ৬');
  await expect(page).toHaveURL(/#photo-2$/);
  await page.keyboard.press('ArrowRight');
  await expect(viewer).toContainText('৩ / ৬');
  await expect(viewer.getByRole('link', { name: 'এই ছবিটি পাঠান' })).toHaveAttribute('href', /photo-3/);
  await page.keyboard.press('Escape');
  await expect(viewer).toBeHidden();
  await expect(page).not.toHaveURL(/#photo/);

  // A shared link opens its photo.
  await page.goto('/bengali/gallery/parents-day-2026#photo-5');
  await expect(page.getByRole('dialog', { name: 'ছবি বড় করে দেখা' })).toContainText('৫ / ৬');
});

test('an album without text is its photos, in English too', async ({ page }) => {
  await open(page, '/english/gallery/painting-morning');
  await expect(page.locator('h1')).toHaveText('A morning of painting');
  await expect(page.getByText('24 September 2026')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'All the photos in this album' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^See it larger:/ })).toHaveCount(3);
  await expect(page.getByRole('link', { name: /Later album/ })).toHaveAttribute('href', '/english/gallery/parents-day-2026');
  await expect(page.getByRole('link', { name: /Earlier album/ })).toHaveAttribute('href', '/english/gallery/nursery-morning');
  expect(await page.locator('script[type="application/ld+json"]').first().textContent()).toContain('"@type":"ImageGallery"');
  expect((await page.request.get('/english/gallery/no-such-album')).status()).toBe(404);
});
