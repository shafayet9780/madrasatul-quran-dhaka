import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { authorize, handleUpload } = vi.hoisted(() => ({
  authorize: vi.fn(),
  handleUpload: vi.fn(),
}))

vi.mock('@/lib/studio-auth', () => ({
  isAuthorizedStudioAdminRequest: authorize,
}))
vi.mock('@vercel/blob/client', () => ({ handleUpload }))

import { POST } from './route'

afterEach(() => {
  vi.clearAllMocks()
})

function request() {
  return new NextRequest('https://school.test/api/studio/downloads/upload', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'blob.generate-client-token' }),
  })
}

describe('Studio direct-upload route', () => {
  it('fails closed for an unauthorized token request', async () => {
    authorize.mockReturnValue(false)
    handleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => {
      await onBeforeGenerateToken(
        'downloads/library/lesson.pdf',
        JSON.stringify({
          purpose: 'restricted-download',
          filename: 'lesson.pdf',
          contentType: 'application/pdf',
          size: 100,
        }),
      )
    })

    const response = await POST(request())
    expect(response.status).toBe(400)
  })

  it('issues a restricted, immutable upload capability for valid metadata', async () => {
    authorize.mockReturnValue(true)
    handleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => {
      const token = await onBeforeGenerateToken(
        'downloads/library/lesson.pdf',
        JSON.stringify({
          purpose: 'restricted-download',
          filename: 'lesson.pdf',
          contentType: 'application/pdf',
          size: 100,
        }),
      )
      return { token }
    })

    const response = await POST(request())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.token).toEqual(expect.objectContaining({
      addRandomSuffix: true,
      allowOverwrite: false,
      maximumSizeInBytes: 50 * 1024 * 1024,
    }))
  })
})
