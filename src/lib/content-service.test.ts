import { describe, it, expect, beforeEach, vi } from 'vitest';

const { sanityFetchMock } = vi.hoisted(() => ({ sanityFetchMock: vi.fn() }));

vi.mock('./sanity-fetch', () => ({
  sanityFetch: sanityFetchMock,
  sanityFetchWithPreview: vi.fn(),
  forceRefreshContent: vi.fn(),
  revalidateTags: vi.fn(),
  handleSanityError: vi.fn(),
}));

vi.mock('./sanity', () => ({
  client: { fetch: vi.fn() },
  previewClient: { fetch: vi.fn() },
  getClient: () => ({ fetch: vi.fn() }),
  urlFor: vi.fn(),
  isDevMode: () => false,
}));

import { contentService, withPhoneUses } from './content-service';
import type { SiteSettings } from '@/types/sanity';

beforeEach(() => {
  sanityFetchMock.mockReset();
  // ContentService logs to console.error on the failure path; Vitest 4
  // otherwise fails the test when console.error is called.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ContentService (published, contract)', () => {
  it('getSiteSettings returns the fetched document', async () => {
    sanityFetchMock.mockResolvedValue({ title: 'MQ' });
    expect(await contentService.getSiteSettings()).toEqual({ title: 'MQ' });
    // It delegates to the shared fetch wrapper rather than fetching directly.
    expect(sanityFetchMock).toHaveBeenCalled();
  });

  it('getSiteSettings returns null when the fetch fails', async () => {
    sanityFetchMock.mockImplementation(async () => {
      throw new Error('boom');
    });
    expect(await contentService.getSiteSettings()).toBeNull();
  });

  it('getNotices returns an empty array when the fetch fails', async () => {
    sanityFetchMock.mockImplementation(async () => {
      throw new Error('boom');
    });
    expect(await contentService.getNotices()).toEqual([]);
  });
});

describe('withPhoneUses (until the clean-up script has run)', () => {
  it('gives old phones the use the script will give them, and leaves new ones alone', () => {
    const old = {
      contactInfo: {
        admissionsPhone: '+8801302332244',
        phone: [
          { number: '+880 1301 226644', label: { english: 'Admin' }, isActive: true },
          { number: '+880 1302-332244', label: { english: 'Senior Admin' }, isActive: true },
          { number: '+880 1304 226644', label: { english: 'Accounts' }, isActive: true },
        ],
      },
    } as unknown as SiteSettings;
    expect(withPhoneUses(old)?.contactInfo?.phone?.map((p) => p.usedFor)).toEqual(['office', 'admissions', 'accounts']);
    const migrated = { contactInfo: { phone: [{ number: '01700000000', usedFor: 'accounts', isActive: true }] } } as SiteSettings;
    expect(withPhoneUses(migrated)).toBe(migrated);
    expect(withPhoneUses(null)).toBeNull();
  });
});
