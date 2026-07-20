import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  isAuthorizedStudioAdminRequest,
  isValidStudioAuthorization,
} from './studio-auth'

afterEach(() => {
  vi.unstubAllEnvs()
})

function request(authorization?: string) {
  return new NextRequest('https://example.test/studio/api/downloads/share-link', {
    headers: {
      origin: 'https://example.test',
      ...(authorization ? { authorization } : {}),
    },
  })
}

describe('Studio administrative authorization', () => {
  it('allows same-origin local development when Basic Auth is not configured', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('STUDIO_AUTH_ENABLED', 'false')
    expect(isAuthorizedStudioAdminRequest(request())).toBe(true)
  })

  it('fails closed for anonymous production requests', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('STUDIO_AUTH_ENABLED', 'false')
    expect(isAuthorizedStudioAdminRequest(request())).toBe(false)
  })

  it('requires valid production Basic Auth and same origin', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('STUDIO_AUTH_ENABLED', 'true')
    vi.stubEnv('STUDIO_USERNAME', 'editor')
    vi.stubEnv('STUDIO_PASSWORD', 'strong-password')
    const header = `Basic ${Buffer.from('editor:strong-password').toString('base64')}`
    expect(isValidStudioAuthorization(header)).toBe(true)
    expect(isAuthorizedStudioAdminRequest(request(header))).toBe(true)
    expect(isAuthorizedStudioAdminRequest(new NextRequest(
      'https://example.test/studio/api/downloads/share-link',
      { headers: { origin: 'https://attacker.test', authorization: header } },
    ))).toBe(false)
  })
})
