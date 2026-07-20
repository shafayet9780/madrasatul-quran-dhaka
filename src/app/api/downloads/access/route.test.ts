import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createDownloadAccessToken } from '@/lib/downloads/access'

const { getCategoryById, getItemById } = vi.hoisted(() => ({
  getCategoryById: vi.fn(),
  getItemById: vi.fn(),
}))

vi.mock('@/lib/queries/downloads', () => ({
  getDownloadCategoryById: getCategoryById,
  getDownloadableById: getItemById,
}))

import { GET } from './route'

const secret = 'a-download-signing-secret-with-more-than-32-bytes'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('downloads access exchange', () => {
  it('sets a session cookie and redirects a permanent item link to its clean URL', async () => {
    vi.stubEnv('DOWNLOADS_LINK_SIGNING_SECRET', secret)
    const { token } = createDownloadAccessToken({
      scope: 'item',
      targetId: 'item-1',
      targetShareVersion: 3,
      lifetime: 'never',
      secret,
    })
    getItemById.mockResolvedValue({
      _id: 'item-1',
      shareVersion: 3,
      slug: { current: 'lesson-plan' },
    })

    const response = await GET(new NextRequest(
      `https://school.test/api/downloads/access?token=${encodeURIComponent(token)}`,
    ))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://school.test/english/downloads/lesson-plan')
    expect(response.headers.get('set-cookie')).toContain('mq_download_access=')
    expect(response.headers.get('set-cookie')).not.toMatch(/expires=/i)
  })

  it('clears access when the target share version has been revoked', async () => {
    vi.stubEnv('DOWNLOADS_LINK_SIGNING_SECRET', secret)
    const { token } = createDownloadAccessToken({
      scope: 'item',
      targetId: 'item-1',
      targetShareVersion: 1,
      lifetime: 'never',
      secret,
    })
    getItemById.mockResolvedValue({
      _id: 'item-1',
      shareVersion: 2,
      slug: { current: 'lesson-plan' },
    })

    const response = await GET(new NextRequest(
      `https://school.test/api/downloads/access?token=${encodeURIComponent(token)}`,
    ))

    expect(response.headers.get('location')).toBe('https://school.test/english/downloads')
    expect(response.headers.get('set-cookie')).toMatch(/Max-Age=0/i)
  })
})
