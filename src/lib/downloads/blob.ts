export const CLEANUP_ELIGIBLE_BLOB_PREFIX = 'downloads/'
export const RESTRICTED_DOWNLOAD_BLOB_PREFIX = 'downloads/library/'

const PUBLIC_BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'

export function isSafeBlobPathname(pathname: string): boolean {
  if (
    !pathname ||
    pathname.startsWith('/') ||
    pathname.includes('\\') ||
    /[\u0000-\u001F?#]/.test(pathname)
  ) {
    return false
  }

  return pathname.split('/').every((segment) => segment && segment !== '.' && segment !== '..')
}

export function isCleanupEligibleBlobPathname(pathname: string): boolean {
  return isSafeBlobPathname(pathname) && pathname.startsWith(CLEANUP_ELIGIBLE_BLOB_PREFIX)
}

export function trustedPublicBlobUrl({
  baseUrl,
  pathname,
  allowed,
}: {
  baseUrl: string | undefined
  pathname: string
  allowed: (pathname: string) => boolean
}): string | null {
  if (!baseUrl || !isSafeBlobPathname(pathname) || !allowed(pathname)) return null

  try {
    const base = new URL(baseUrl)
    if (
      base.protocol !== 'https:' ||
      !base.hostname.endsWith(PUBLIC_BLOB_HOST_SUFFIX) ||
      base.username ||
      base.password ||
      (base.pathname !== '/' && base.pathname !== '') ||
      base.search ||
      base.hash
    ) {
      return null
    }

    const encodedPathname = pathname
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/')
    return `${base.origin}/${encodedPathname}`
  } catch {
    return null
  }
}
