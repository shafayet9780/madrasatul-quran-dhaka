import { describe, it, expect, beforeEach, vi } from 'vitest';

const { fetchMock, previewFetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  previewFetchMock: vi.fn(),
}));

vi.mock('./sanity', () => {
  const client = { fetch: fetchMock, withConfig: () => client };
  const previewClient = { fetch: previewFetchMock };
  return {
    client,
    previewClient,
    getClient: (preview?: boolean) => (preview ? previewClient : client),
    isDevMode: () => false,
  };
});

import { CONTENT_REVALIDATE, refreshBy, SANITY_TAG, sanityFetch, sanityFetchWithPreview } from './sanity-fetch';

vi.mock('./admissions/local', () => ({ localOverrides: () => null }));

beforeEach(() => {
  fetchMock.mockReset();
  previewFetchMock.mockReset();
});

describe('sanityFetch (contract)', () => {
  it('returns the fetched data', async () => {
    fetchMock.mockResolvedValue({ title: 'hello' });
    const data = await sanityFetch<{ title: string }>({ query: '*[_type=="x"]' });
    expect(data).toEqual({ title: 'hello' });
  });

  it('calls the published client with the given query and params', async () => {
    fetchMock.mockResolvedValue([]);
    await sanityFetch({ query: 'QUERY', params: { slug: 'abc' } });
    // Contract: query + params are forwarded. The 3rd options arg is an
    // implementation detail that changes under Cache Components — not asserted.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('QUERY');
    expect(fetchMock.mock.calls[0][1]).toEqual({ slug: 'abc' });
  });

  it('throws when the underlying fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    await expect(sanityFetch({ query: 'Q' })).rejects.toThrow();
  });
});

describe('sanityFetchWithPreview (contract)', () => {
  it('uses the preview client when preview=true', async () => {
    previewFetchMock.mockResolvedValue({ draft: true });
    const data = await sanityFetchWithPreview({ query: 'Q', preview: true });
    expect(data).toEqual({ draft: true });
    expect(previewFetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the published client when preview=false', async () => {
    fetchMock.mockResolvedValue({ draft: false });
    await sanityFetchWithPreview({ query: 'Q', preview: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(previewFetchMock).not.toHaveBeenCalled();
  });
});

describe('cache lifetime', () => {
  it('keeps published content for an hour, refreshable by the Sanity webhook', async () => {
    fetchMock.mockResolvedValue(null);
    await sanityFetch({ query: 'Q', tags: ['homePage'] });
    expect(fetchMock.mock.calls[0][2]).toEqual({ next: { revalidate: CONTENT_REVALIDATE, tags: ['homePage', SANITY_TAG] } });
  });

  it('refreshes the page by an opening or closing time within the hour', async () => {
    fetchMock.mockResolvedValue(true);
    const now = new Date('2026-11-01T06:00:00Z');
    await refreshBy(new Date('2026-11-01T06:10:00Z'), now);
    expect(fetchMock.mock.calls[0][2]).toEqual({ next: { revalidate: 600 } });
    await refreshBy(new Date('2026-11-01T06:00:20Z'), now);
    expect(fetchMock.mock.calls[1][2]).toEqual({ next: { revalidate: 60 } });
    // Past, more than an hour away, or none: the hour stands.
    await refreshBy(new Date('2026-11-01T05:00:00Z'), now);
    await refreshBy(new Date('2026-11-01T08:00:00Z'), now);
    await refreshBy(undefined, now);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
