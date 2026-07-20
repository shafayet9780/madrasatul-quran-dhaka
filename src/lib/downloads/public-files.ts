import { NextResponse } from 'next/server'
import { getPublicDownloadSettings } from '@/lib/queries/downloads'
import { trustedPublicBlobUrl } from './blob'
import { contentDisposition } from './format'
import type { PublicDownloadKind, VercelBlobFile } from './types'

const canonicalPublicDownloads: Record<
  PublicDownloadKind,
  { pathname: string; filename: string; contentType: string }
> = {
  prospectus: {
    pathname: 'prospectus/madrasatul-quran-prospectus.pdf',
    filename: 'Madrasatul-Quran-Prospectus.pdf',
    contentType: 'application/pdf',
  },
  curriculum: {
    pathname: 'curriculum/madrasatul_quran_detailed_curriculum.pdf',
    filename: 'Madrasatul-Quran-Detailed-Curriculum.pdf',
    contentType: 'application/pdf',
  },
  codeOfConduct: {
    pathname: 'prospectus/parents_code_of_conduct_mqd.pdf',
    filename: 'Madrasatul-Quran-Parents-Code-of-Conduct.pdf',
    contentType: 'application/pdf',
  },
}

const publicDownloadPrefixes: Record<PublicDownloadKind, string> = {
  prospectus: 'downloads/public/prospectus/',
  curriculum: 'downloads/public/curriculum/',
  codeOfConduct: 'downloads/public/code-of-conduct/',
}

export function selectPublicDownload(
  kind: PublicDownloadKind,
  settings: Awaited<ReturnType<typeof getPublicDownloadSettings>>,
  baseUrl: string | undefined,
): Pick<VercelBlobFile, 'url' | 'originalFilename' | 'contentType' | 'size'> | null {
  const canonical = canonicalPublicDownloads[kind]
  const configured = settings?.[kind]
  const pathname = configured?.pathname || canonical.pathname
  const url = trustedPublicBlobUrl({
    baseUrl,
    pathname,
    allowed: (candidate) =>
      candidate === canonical.pathname ||
      candidate.startsWith(publicDownloadPrefixes[kind]),
  })
  if (!url) return null

  if (configured?.pathname) {
    return {
      url,
      originalFilename: configured.originalFilename,
      contentType: configured.contentType,
      size: configured.size,
    }
  }

  return {
    url,
    originalFilename: canonical.filename,
    contentType: canonical.contentType,
    size: 0,
  }
}

export async function resolvePublicDownload(
  kind: PublicDownloadKind,
): Promise<Pick<VercelBlobFile, 'url' | 'originalFilename' | 'contentType' | 'size'> | null> {
  const settings = await getPublicDownloadSettings().catch(() => null)
  return selectPublicDownload(kind, settings, process.env.BLOB_STORE_URL)
}

export async function servePublicDownload(kind: PublicDownloadKind): Promise<NextResponse> {
  try {
    const file = await resolvePublicDownload(kind)
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Public download is not configured' },
        { status: 500 },
      )
    }

    const response = await fetch(file.url, { cache: 'no-store' })
    if (!response.ok || !response.body) {
      throw new Error(`Blob request failed with status ${response.status}`)
    }

    const headers = new Headers({
        'Content-Type': file.contentType || response.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': contentDisposition(file.originalFilename),
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
    })
    const length = response.headers.get('content-length') || (file.size ? String(file.size) : '')
    if (length) headers.set('Content-Length', length)

    return new NextResponse(response.body, {
      headers,
    })
  } catch (error) {
    console.error(`Error serving public ${kind}:`, error)
    return NextResponse.json(
      { success: false, error: 'Failed to download file' },
      { status: 500 },
    )
  }
}
