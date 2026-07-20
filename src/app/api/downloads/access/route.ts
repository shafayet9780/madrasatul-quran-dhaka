import { NextRequest, NextResponse } from 'next/server'
import {
  accessCookieOptions,
  canAccessDownloadTarget,
  verifyDownloadAccessToken,
} from '@/lib/downloads/access'
import { DOWNLOAD_ACCESS_COOKIE } from '@/lib/downloads/types'
import {
  getDownloadCategoryById,
  getDownloadableById,
} from '@/lib/queries/downloads'

function redirect(request: NextRequest, pathname: string, search = '') {
  const url = new URL(pathname, request.url)
  url.search = search
  const response = NextResponse.redirect(url)
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || undefined
  const secret = process.env.DOWNLOADS_LINK_SIGNING_SECRET || ''

  try {
    const claims = verifyDownloadAccessToken(token, secret)
    let pathname = '/english/downloads'
    let search = ''

    if (claims.scope === 'category') {
      const category = await getDownloadCategoryById(claims.targetId!)
      if (!category || !canAccessDownloadTarget(claims, category)) {
        throw new Error('Category is not published or link was revoked')
      }
      search = `?category=${encodeURIComponent(category.slug.current)}`
    } else if (claims.scope === 'item') {
      const item = await getDownloadableById(claims.targetId!)
      if (!item || !canAccessDownloadTarget(claims, item)) {
        throw new Error('Item is not published or link was revoked')
      }
      pathname = `/english/downloads/${encodeURIComponent(item.slug.current)}`
    }

    const response = redirect(request, pathname, search)
    const options = accessCookieOptions(claims)
    response.cookies.set({ ...options, value: token! })
    return response
  } catch {
    const response = redirect(request, '/english/downloads')
    response.cookies.set({
      name: DOWNLOAD_ACCESS_COOKIE,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
    return response
  }
}
