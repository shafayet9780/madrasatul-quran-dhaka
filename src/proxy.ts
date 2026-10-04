import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import {
  isValidStudioAuthorization,
  studioAuthConfigured,
} from '@/lib/studio-auth'

// Create the internationalization middleware
const intlMiddleware = createMiddleware({
  locales: ['bengali', 'english'],
  defaultLocale: 'bengali',
  localePrefix: 'always',
})

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`)
}

/** Basic Auth gate shared by Studio and the survey admin (production only). */
function basicAuthResponse(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null
  if (!studioAuthConfigured()) {
    return new NextResponse('Studio authentication is not configured', { status: 503 })
  }
  if (!isValidStudioAuthorization(request.headers.get('authorization'))) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Sanity Studio"',
      },
    })
  }
  return null
}

function withLocale(request: NextRequest, locale: 'bengali' | 'english') {
  const headers = new Headers(request.headers)
  headers.set('X-NEXT-INTL-LOCALE', locale)
  return NextResponse.next({ request: { headers } })
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle Sanity Studio routes
  if (pathname.startsWith('/studio')) {
    // Studio uses English outside the localized public routes.
    return basicAuthResponse(request) ?? withLocale(request, 'english')
  }

  // Survey admin and reports: same login as Studio, Bengali, no locale prefix.
  if (isUnder(pathname, '/admin')) {
    return basicAuthResponse(request) ?? withLocale(request, 'bengali')
  }

  // Public survey links are Bengali-only and live outside the locale tree.
  if (isUnder(pathname, '/survey')) {
    return withLocale(request, 'bengali')
  }

  // Handle internationalization for all other routes
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api routes
    // - images/ (public image assets)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - sitemap.xml (SEO sitemap)
    // - robots.txt (SEO robots)
    '/((?!api|images/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
