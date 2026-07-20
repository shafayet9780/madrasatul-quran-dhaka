import { NextRequest, NextResponse } from 'next/server'
import {
  createDownloadAccessToken,
  isDownloadLifetime,
  isDownloadSigningSecret,
} from '@/lib/downloads/access'
import type { DownloadLinkLifetime, DownloadScope } from '@/lib/downloads/types'
import {
  getDownloadCategoryById,
  getDownloadableById,
} from '@/lib/queries/downloads'
import {
  isAuthorizedStudioAdminRequest,
} from '@/lib/studio-auth'

export async function POST(request: NextRequest) {
  if (
    !isAuthorizedStudioAdminRequest(request)
  ) {
    return NextResponse.json({ error: 'Studio authorization required' }, { status: 401 })
  }

  const secret = process.env.DOWNLOADS_LINK_SIGNING_SECRET
  if (!isDownloadSigningSecret(secret)) {
    return NextResponse.json({ error: 'Link signing is not configured' }, { status: 503 })
  }

  let input: { scope?: DownloadScope; targetId?: string; lifetime?: DownloadLinkLifetime }
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { scope, targetId, lifetime = 7 } = input
  if (
    !scope ||
    !['library', 'category', 'item'].includes(scope) ||
    !isDownloadLifetime(lifetime) ||
    (scope === 'library' && lifetime === 'never')
  ) {
    return NextResponse.json({ error: 'Invalid link settings' }, { status: 400 })
  }

  let targetShareVersion: number | undefined
  if (scope !== 'library') {
    if (!targetId) return NextResponse.json({ error: 'A published target is required' }, { status: 400 })
    const target =
      scope === 'category'
        ? await getDownloadCategoryById(targetId)
        : await getDownloadableById(targetId)
    if (!target) {
      return NextResponse.json({ error: 'Only published documents can be shared' }, { status: 404 })
    }
    targetShareVersion = target.shareVersion
  }

  const { token, claims } = createDownloadAccessToken({
    scope,
    targetId: scope === 'library' ? undefined : targetId,
    targetShareVersion,
    lifetime,
    secret,
  })
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, '')

  return NextResponse.json({
    url: `${siteUrl}/api/downloads/access?token=${encodeURIComponent(token)}`,
    expiresAt: claims.exp === null ? null : new Date(claims.exp * 1000).toISOString(),
  })
}
