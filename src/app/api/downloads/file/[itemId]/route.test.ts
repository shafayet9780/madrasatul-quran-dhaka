import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDownloadAccessToken } from '@/lib/downloads/access'
import { DOWNLOAD_ACCESS_COOKIE } from '@/lib/downloads/types'

const { cookieGet, getItemById } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  getItemById: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}))
vi.mock('@/lib/queries/downloads', () => ({
  getDownloadableById: getItemById,
}))

import { GET } from './route'

const secret = 'a-download-signing-secret-with-more-than-32-bytes'
const blobStore = 'https://school.public.blob.vercel-storage.com'

function item() {
  return {
    _id: 'item-1',
    shareVersion: 1,
    category: { _id: 'category-1', shareVersion: 1 },
    file: {
      pathname: 'downloads/library/lesson-plan.pdf',
      url: 'http://169.254.169.254/latest/meta-data',
      originalFilename: 'Lesson Plan.pdf',
      contentType: 'application/pdf',
      size: 3,
    },
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('protected file delivery', () => {
  it('rejects an item outside the cookie scope before fetching Blob', async () => {
    vi.stubEnv('DOWNLOADS_LINK_SIGNING_SECRET', secret)
    const { token } = createDownloadAccessToken({
      scope: 'item',
      targetId: 'another-item',
      targetShareVersion: 1,
      secret,
    })
    cookieGet.mockImplementation((name) =>
      name === DOWNLOAD_ACCESS_COOKIE ? { value: token } : undefined,
    )
    getItemById.mockResolvedValue(item())
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(new Request('https://school.test/api/downloads/file/item-1'), {
      params: Promise.resolve({ itemId: 'item-1' }),
    })

    expect(response.status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ignores the stored URL and fetches only the trusted Blob pathname', async () => {
    vi.stubEnv('DOWNLOADS_LINK_SIGNING_SECRET', secret)
    vi.stubEnv('BLOB_STORE_URL', blobStore)
    const { token } = createDownloadAccessToken({
      scope: 'item',
      targetId: 'item-1',
      targetShareVersion: 1,
      secret,
    })
    cookieGet.mockReturnValue({ value: token })
    getItemById.mockResolvedValue(item())
    const fetchMock = vi.fn(async () =>
      new Response('pdf', { headers: { 'content-length': '3' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(new Request('https://school.test/api/downloads/file/item-1'), {
      params: Promise.resolve({ itemId: 'item-1' }),
    })

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      `${blobStore}/downloads/library/lesson-plan.pdf`,
      { cache: 'no-store' },
    )
  })
})
