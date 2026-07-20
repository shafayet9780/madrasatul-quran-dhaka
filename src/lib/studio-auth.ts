import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function studioAuthConfigured(): boolean {
  return (
    process.env.STUDIO_AUTH_ENABLED === 'true' &&
    Boolean(process.env.STUDIO_USERNAME) &&
    Boolean(process.env.STUDIO_PASSWORD)
  )
}

export function isValidStudioAuthorization(header: string | null): boolean {
  if (!header?.startsWith('Basic ') || !studioAuthConfigured()) return false
  try {
    const credentials = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const separator = credentials.indexOf(':')
    if (separator < 0) return false
    return (
      safeEqual(credentials.slice(0, separator), process.env.STUDIO_USERNAME || '') &&
      safeEqual(credentials.slice(separator + 1), process.env.STUDIO_PASSWORD || '')
    )
  } catch {
    return false
  }
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  return Boolean(origin && origin === request.nextUrl.origin)
}

export function isAuthorizedStudioAdminRequest(request: NextRequest): boolean {
  if (!isSameOrigin(request)) return false
  if (process.env.NODE_ENV === 'production' || studioAuthConfigured()) {
    return (
      studioAuthConfigured() &&
      isValidStudioAuthorization(request.headers.get('authorization'))
    )
  }
  return true
}
