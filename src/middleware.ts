import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'

// Create the internationalization middleware
const intlMiddleware = createMiddleware({
  locales: ['bengali', 'english'],
  defaultLocale: 'english',
  localePrefix: 'always',
})

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle Sanity Studio routes
  if (pathname.startsWith('/studio')) {
    // In production, you might want to add authentication
    if (process.env.NODE_ENV === 'production') {
      // Optional: Add basic auth or IP restriction
      const authHeader = request.headers.get('authorization')
      
      // Example basic auth (you should use a more secure method)
      if (process.env.STUDIO_AUTH_ENABLED === 'true') {
        if (!authHeader || !isValidAuth(authHeader)) {
          return new NextResponse('Authentication required', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Basic realm="Sanity Studio"',
            },
          })
        }
      }
    }
    
    // Allow studio access
    return NextResponse.next()
  }

  // Handle internationalization for all other routes
  return intlMiddleware(request)
}

function isValidAuth(authHeader: string): boolean {
  // Basic auth validation
  const base64Credentials = authHeader.split(' ')[1]
  if (!base64Credentials) return false
  
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
  const [username, password] = credentials.split(':')
  
  // Check against environment variables
  return (
    username === process.env.STUDIO_USERNAME &&
    password === process.env.STUDIO_PASSWORD
  )
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api routes
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - studio routes (Sanity Studio)
    '/((?!api|_next/static|_next/image|favicon.ico|studio).*)',
  ],
}