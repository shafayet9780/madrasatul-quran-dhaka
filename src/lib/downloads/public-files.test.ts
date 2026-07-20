import { afterEach, describe, expect, it, vi } from 'vitest'

const { getPublicSettings } = vi.hoisted(() => ({
  getPublicSettings: vi.fn(),
}))

vi.mock('@/lib/queries/downloads', () => ({
  getPublicDownloadSettings: getPublicSettings,
}))

import { selectPublicDownload, servePublicDownload } from './public-files'

describe('public download settings', () => {
  const blobStore = 'https://school.public.blob.vercel-storage.com'

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('prefers the published CMS file', () => {
    const configured = {
      _id: 'publicDownloadSettings' as const,
      _type: 'publicDownloadSettings' as const,
      prospectus: {
        url: 'https://blob.example/new.pdf',
        pathname: 'downloads/public/prospectus/new.pdf',
        originalFilename: 'new.pdf',
        contentType: 'application/pdf',
        size: 42,
        etag: 'etag',
        uploadedAt: '2026-07-19T00:00:00.000Z',
      },
    }
    expect(selectPublicDownload('prospectus', configured, blobStore)?.url)
      .toBe(`${blobStore}/downloads/public/prospectus/new.pdf`)
  })

  it('uses the canonical public file when no CMS file is published', () => {
    expect(selectPublicDownload('curriculum', null, blobStore)?.url)
      .toBe(`${blobStore}/curriculum/madrasatul_quran_detailed_curriculum.pdf`)
    expect(selectPublicDownload('curriculum', null, undefined)).toBeNull()
  })

  it('ignores a stored URL and rejects a pathname outside the configured public scope', () => {
    const configured = {
      _id: 'publicDownloadSettings' as const,
      _type: 'publicDownloadSettings' as const,
      prospectus: {
        url: 'http://169.254.169.254/latest/meta-data',
        pathname: 'downloads/library/private.pdf',
        originalFilename: 'private.pdf',
        contentType: 'application/pdf',
        size: 42,
        etag: 'etag',
        uploadedAt: '2026-07-19T00:00:00.000Z',
      },
    }
    expect(selectPublicDownload('prospectus', configured, blobStore)).toBeNull()
  })

  it.each([
    ['prospectus', 'prospectus/madrasatul-quran-prospectus.pdf'],
    ['curriculum', 'curriculum/madrasatul_quran_detailed_curriculum.pdf'],
    ['codeOfConduct', 'prospectus/parents_code_of_conduct_mqd.pdf'],
  ] as const)('keeps the canonical public %s endpoint path operational', async (kind, pathname) => {
    vi.stubEnv('BLOB_STORE_URL', blobStore)
    getPublicSettings.mockResolvedValue(null)
    const fetchMock = vi.fn(async () =>
      new Response('pdf', {
        headers: {
          'content-type': 'application/pdf',
          'content-length': '3',
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await servePublicDownload(kind)

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(`${blobStore}/${pathname}`, { cache: 'no-store' })
    expect(response.headers.get('content-disposition')).toContain('attachment')
  })
})
