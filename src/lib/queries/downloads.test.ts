import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { freshFetch, rawFetch } = vi.hoisted(() => ({ freshFetch: vi.fn(), rawFetch: vi.fn() }))
vi.mock('@/lib/sanity', () => ({
  client: {
    withConfig: vi.fn(() => ({ fetch: freshFetch })),
  },
  previewClient: {
    withConfig: vi.fn(({ dataset }: { dataset: string }) => ({ fetch: () => rawFetch(dataset) })),
  },
}))
vi.mock('@/lib/sanity-fetch', () => ({ sanityFetch: vi.fn() }))

import { sanityFetch } from '@/lib/sanity-fetch'
import { client } from '@/lib/sanity'
import { getAllBlobReferences, getDownloadableBySlug, getDownloadables, getPublishedBlobReferences } from './downloads'

describe('downloads queries', () => {
  beforeEach(() => {
    vi.mocked(sanityFetch).mockReset()
    vi.mocked(sanityFetch).mockResolvedValue([])
    freshFetch.mockReset()
    freshFetch.mockResolvedValue(null)
  })

  it('passes null instead of omitting the optional category parameter', async () => {
    await getDownloadables()
    expect(sanityFetch).toHaveBeenCalledWith(
      expect.objectContaining({ params: { categoryId: null } }),
    )
  })

  it('passes a selected category id', async () => {
    await getDownloadables('category-1')
    expect(sanityFetch).toHaveBeenCalledWith(
      expect.objectContaining({ params: { categoryId: 'category-1' } }),
    )
  })

  it('keeps detail-only body and cover data out of library list queries', async () => {
    await getDownloadables()
    const query = vi.mocked(sanityFetch).mock.calls[0][0].query
    expect(query).not.toMatch(/\n\s*body,/)
    expect(query).not.toMatch(/\n\s*coverImage,/)
  })

  it('uses an uncached origin read for authorization-sensitive item details', async () => {
    await getDownloadableBySlug('lesson-plan')
    expect(freshFetch).toHaveBeenCalledWith(
      expect.stringContaining('slug.current == $slug'),
      { slug: 'lesson-plan' },
      { cache: 'no-store' },
    )
  })
})

describe('getAllBlobReferences', () => {
  beforeEach(() => {
    vi.stubEnv('SANITY_API_TOKEN', 'token')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production')
    rawFetch.mockReset()
  })
  afterEach(() => vi.unstubAllEnvs())

  it('keeps a file that either dataset references (they share one Blob store)', async () => {
    rawFetch.mockImplementation(async (dataset: string) =>
      dataset === 'production'
        ? { downloadables: [{ pathname: 'downloads/a.pdf' }], settings: [{ prospectus: { pathname: 'downloads/public/p.pdf' } }] }
        : { downloadables: [{ pathname: 'downloads/b.pdf' }, {}], settings: [] },
    )
    expect([...(await getAllBlobReferences())].sort()).toEqual(['downloads/a.pdf', 'downloads/b.pdf', 'downloads/public/p.pdf'])
    expect(rawFetch.mock.calls.map(([dataset]) => dataset).sort()).toEqual(['development', 'production'])
  })

  it('fails when a dataset cannot be read, so nothing is deleted', async () => {
    rawFetch.mockImplementation(async (dataset: string) => {
      if (dataset === 'development') throw new Error('down')
      return { downloadables: [], settings: [] }
    })
    await expect(getAllBlobReferences()).rejects.toThrow('down')
  })
})

describe('getPublishedBlobReferences', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('reads the published files of both datasets', async () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'development')
    freshFetch.mockReset()
    freshFetch.mockResolvedValueOnce({ downloadables: [{ pathname: 'downloads/a.pdf' }], settings: [] })
    freshFetch.mockResolvedValueOnce({ downloadables: [], settings: [{ curriculum: { pathname: 'downloads/public/c.pdf' } }] })
    vi.mocked(client.withConfig).mockClear()
    expect([...(await getPublishedBlobReferences())].sort()).toEqual(['downloads/a.pdf', 'downloads/public/c.pdf'])
    expect(vi.mocked(client.withConfig).mock.calls.map(([config]) => config?.dataset).sort()).toEqual(['development', 'production'])
  })
})
