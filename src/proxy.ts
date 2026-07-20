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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle Sanity Studio routes
  if (pathname.startsWith('/studio')) {
    if (process.env.NODE_ENV === 'production') {
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
    }
    
    // Allow studio access
    return NextResponse.next()
  }

  // Handle internationalization for all other routes
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api routes
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - sitemap.xml (SEO sitemap)
    // - robots.txt (SEO robots)
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
