import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { authorize, getCategoryById, getItemById } = vi.hoisted(() => ({
  authorize: vi.fn(),
  getCategoryById: vi.fn(),
  getItemById: vi.fn(),
}))

vi.mock('@/lib/studio-auth', () => ({
  isAuthorizedStudioAdminRequest: authorize,
}))
vi.mock('@/lib/queries/downloads', () => ({
  getDownloadCategoryById: getCategoryById,
  getDownloadableById: getItemById,
}))

import { POST } from './route'

const secret = 'a-download-signing-secret-with-more-than-32-bytes'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

function request(body: unknown) {
  return new NextRequest('https://school.test/studio/api/downloads/share-link', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('Studio share-link route', () => {
  it('does not allow a permanent library-wide link', async () => {
    authorize.mockReturnValue(true)
    vi.stubEnv('DOWNLOADS_LINK_SIGNING_SECRET', secret)
    const response = await POST(request({ scope: 'library', lifetime: 'never' }))
    expect(response.status).toBe(400)
  })

  it('generates a permanent published-item link with no expiry', async () => {
    authorize.mockReturnValue(true)
    getItemById.mockResolvedValue({ _id: 'item-1', shareVersion: 4 })
    vi.stubEnv('DOWNLOADS_LINK_SIGNING_SECRET', secret)
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://school.test')

    const response = await POST(request({
      scope: 'item',
      targetId: 'item-1',
      lifetime: 'never',
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.url).toMatch(/^https:\/\/school\.test\/api\/downloads\/access\?token=/)
    expect(body.expiresAt).toBeNull()
  })

  it('fails closed when the signing secret is weak', async () => {
    authorize.mockReturnValue(true)
    vi.stubEnv('DOWNLOADS_LINK_SIGNING_SECRET', 'placeholder')
    const response = await POST(request({ scope: 'library', lifetime: 7 }))
    expect(response.status).toBe(503)
  })
})
