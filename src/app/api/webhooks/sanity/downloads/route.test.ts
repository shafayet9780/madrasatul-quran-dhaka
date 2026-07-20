import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { blobDelete, getReferences, isValidSignature, revalidateTag } = vi.hoisted(() => ({
  blobDelete: vi.fn(),
  getReferences: vi.fn(),
  isValidSignature: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('@vercel/blob', () => ({ del: blobDelete }))
vi.mock('@sanity/webhook', () => ({
  isValidSignature,
  SIGNATURE_HEADER_NAME: 'sanity-webhook-signature',
}))
vi.mock('next/cache', () => ({ revalidateTag }))
vi.mock('@/lib/queries/downloads', () => ({
  getPublishedBlobReferences: getReferences,
}))

import { POST } from './route'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('Sanity downloads cleanup webhook', () => {
  it('deletes replaced downloads/ uploads but preserves every other Blob path', async () => {
    vi.stubEnv('SANITY_DOWNLOADS_WEBHOOK_SECRET', 'webhook-secret')
    isValidSignature.mockResolvedValue(true)
    getReferences.mockResolvedValue(new Set())
    blobDelete.mockResolvedValue(undefined)
    const request = new NextRequest('https://school.test/api/webhooks/sanity/downloads', {
      method: 'POST',
      headers: { 'sanity-webhook-signature': 'valid' },
      body: JSON.stringify({
        afterId: 'publicDownloadSettings',
        beforeFiles: [
          { pathname: 'prospectus/madrasatul-quran-prospectus.pdf' },
          { pathname: 'curriculum/public.pdf' },
          { pathname: 'images/public.webp' },
          { pathname: 'documents/public.pdf' },
          { pathname: 'downloads/public/prospectus/old.pdf' },
        ],
        afterFiles: [{ pathname: 'downloads/public/prospectus/new.pdf' }],
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(blobDelete).toHaveBeenCalledOnce()
    expect(blobDelete).toHaveBeenCalledWith('downloads/public/prospectus/old.pdf')
    expect(body.deleted).toEqual(['downloads/public/prospectus/old.pdf'])
  })
})
