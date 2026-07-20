import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { blobDelete, blobList, getAllReferences } = vi.hoisted(() => ({
  blobDelete: vi.fn(),
  blobList: vi.fn(),
  getAllReferences: vi.fn(),
}))

vi.mock('@vercel/blob', () => ({
  del: blobDelete,
  list: blobList,
}))
vi.mock('@/lib/queries/downloads', () => ({
  getAllBlobReferences: getAllReferences,
}))

import { GET } from './route'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

function request(secret = 'cron-secret') {
  return new NextRequest('https://school.test/api/cron/downloads-cleanup', {
    headers: { authorization: `Bearer ${secret}` },
  })
}

describe('scheduled downloads cleanup', () => {
  it('protects draft/published references and deletes only an aged orphan', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret')
    vi.stubEnv('DOWNLOADS_ORPHAN_GRACE_DAYS', '7')
    vi.setSystemTime(new Date('2026-07-19T00:00:00.000Z'))
    getAllReferences.mockResolvedValue(new Set(['downloads/library/referenced.pdf']))
    blobList.mockResolvedValue({
      hasMore: false,
      blobs: [
        {
          pathname: 'downloads/library/referenced.pdf',
          uploadedAt: new Date('2026-07-01'),
        },
        {
          pathname: 'downloads/library/orphan.pdf',
          uploadedAt: new Date('2026-07-01'),
        },
      ],
    })
    blobDelete.mockResolvedValue(undefined)

    const response = await GET(request())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(blobList).toHaveBeenCalledWith({
      prefix: 'downloads/',
      limit: 1000,
    })
    expect(blobDelete).toHaveBeenCalledWith('downloads/library/orphan.pdf')
    expect(body.deleted).toBe(1)
  })

  it('fails before deletion when the bounded Blob scan would be exceeded', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret')
    getAllReferences.mockResolvedValue(new Set())
    blobList.mockResolvedValue({ hasMore: true, cursor: 'more', blobs: [] })

    const response = await GET(request())

    expect(response.status).toBe(503)
    expect(blobDelete).not.toHaveBeenCalled()
  })
})
