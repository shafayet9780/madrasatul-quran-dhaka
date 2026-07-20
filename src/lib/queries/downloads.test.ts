import { beforeEach, describe, expect, it, vi } from 'vitest'

const { freshFetch } = vi.hoisted(() => ({ freshFetch: vi.fn() }))
vi.mock('@/lib/sanity', () => ({
  client: {
    withConfig: vi.fn(() => ({ fetch: freshFetch })),
  },
  previewClient: {},
}))
vi.mock('@/lib/sanity-fetch', () => ({ sanityFetch: vi.fn() }))

import { sanityFetch } from '@/lib/sanity-fetch'
import { getDownloadableBySlug, getDownloadables } from './downloads'

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
