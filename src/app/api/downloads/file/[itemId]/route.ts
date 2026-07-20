import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  canAccessDownloadable,
  readDownloadAccess,
} from '@/lib/downloads/access'
import {
  RESTRICTED_DOWNLOAD_BLOB_PREFIX,
  trustedPublicBlobUrl,
} from '@/lib/downloads/blob'
import { contentDisposition } from '@/lib/downloads/format'
import { DOWNLOAD_ACCESS_COOKIE } from '@/lib/downloads/types'
import { getDownloadableById } from '@/lib/queries/downloads'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params
  const cookieStore = await cookies()
  const claims = readDownloadAccess(cookieStore.get(DOWNLOAD_ACCESS_COOKIE)?.value)
  if (!claims) {
    return NextResponse.json({ error: 'Download access is invalid or expired' }, { status: 401 })
  }

  const item = await getDownloadableById(itemId)
  if (!item) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  if (!canAccessDownloadable(claims, item)) {
    return NextResponse.json({ error: 'This link does not grant access to that file' }, { status: 403 })
  }

  try {
    const blobUrl = trustedPublicBlobUrl({
      baseUrl: process.env.BLOB_STORE_URL,
      pathname: item.file.pathname,
      allowed: (pathname) => pathname.startsWith(RESTRICTED_DOWNLOAD_BLOB_PREFIX),
    })
    if (!blobUrl) throw new Error('The configured Blob pathname or store URL is invalid')

    const blob = await fetch(blobUrl, { cache: 'no-store' })
    if (!blob.ok || !blob.body) {
      throw new Error(`Blob request failed with status ${blob.status}`)
    }

    const headers = new Headers({
      'Content-Type': item.file.contentType || 'application/octet-stream',
      'Content-Disposition': contentDisposition(item.file.originalFilename),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    })
    const length = blob.headers.get('content-length') || (item.file.size ? String(item.file.size) : '')
    if (length) headers.set('Content-Length', length)

    return new NextResponse(blob.body, { headers })
  } catch (error) {
    console.error('Protected download failed:', error)
    return NextResponse.json({ error: 'Failed to download file' }, { status: 502 })
  }
}
