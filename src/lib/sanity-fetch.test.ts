import { describe, it, expect, beforeEach, vi } from 'vitest';

const { fetchMock, previewFetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  previewFetchMock: vi.fn(),
}));

vi.mock('./sanity', () => {
  const client = { fetch: fetchMock };
  const previewClient = { fetch: previewFetchMock };
  return {
    client,
    previewClient,
    getClient: (preview?: boolean) => (preview ? previewClient : client),
    isDevMode: () => false,
  };
});

import { sanityFetch, sanityFetchWithPreview } from './sanity-fetch';

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
