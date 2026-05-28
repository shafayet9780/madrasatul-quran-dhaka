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

import { contentService } from './content-service';

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

  it('getAllPages returns an empty array when the fetch fails', async () => {
    sanityFetchMock.mockImplementation(async () => {
      throw new Error('boom');
    });
    expect(await contentService.getAllPages()).toEqual([]);
  });
});
