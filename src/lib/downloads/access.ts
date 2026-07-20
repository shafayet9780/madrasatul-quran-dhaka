import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  DOWNLOAD_ACCESS_COOKIE,
  DOWNLOAD_LINK_LIFETIMES,
  type DownloadAccessClaims,
  type DownloadLinkLifetime,
  type DownloadScope,
  type Downloadable,
} from './types'

const TOKEN_VERSION = 2
const MIN_SIGNING_SECRET_BYTES = 32
const EXAMPLE_SIGNING_SECRET = 'replace_with_a_long_random_secret'

export class DownloadAccessError extends Error {}

function encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signature(payload: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(payload).digest()
}

export function isDownloadLifetime(value: unknown): value is DownloadLinkLifetime {
  return DOWNLOAD_LINK_LIFETIMES.includes(value as DownloadLinkLifetime)
}

export function isDownloadSigningSecret(value: string | undefined): value is string {
  return Boolean(
    value &&
    value !== EXAMPLE_SIGNING_SECRET &&
    Buffer.byteLength(value, 'utf8') >= MIN_SIGNING_SECRET_BYTES,
  )
}

export function createDownloadAccessToken({
  scope,
  targetId,
  targetShareVersion,
  lifetime = 7,
  secret,
  now = Date.now(),
}: {
  scope: DownloadScope
  targetId?: string
  targetShareVersion?: number
  lifetime?: DownloadLinkLifetime
  secret: string
  now?: number
}): { token: string; claims: DownloadAccessClaims } {
  if (!isDownloadSigningSecret(secret)) {
    throw new DownloadAccessError('The signing secret must contain at least 32 random bytes')
  }
  if (!isDownloadLifetime(lifetime)) throw new DownloadAccessError('Unsupported link lifetime')
  if (scope !== 'library' && !targetId) {
    throw new DownloadAccessError('Category and item links require a target')
  }
  if (
    scope !== 'library' &&
    (!Number.isInteger(targetShareVersion) || (targetShareVersion || 0) < 1)
  ) {
    throw new DownloadAccessError('Category and item links require a share version')
  }
  if (scope === 'library' && targetId) {
    throw new DownloadAccessError('Library links cannot include a target')
  }
  if (scope === 'library' && lifetime === 'never') {
    throw new DownloadAccessError('Library links must expire')
  }

  const iat = Math.floor(now / 1000)
  const claims: DownloadAccessClaims = {
    v: TOKEN_VERSION,
    scope,
    ...(targetId ? { targetId } : {}),
    ...(scope !== 'library' ? { shareVersion: targetShareVersion } : {}),
    iat,
    exp: lifetime === 'never' ? null : iat + lifetime * 24 * 60 * 60,
  }
  const payload = encode(JSON.stringify(claims))
  return {
    token: `${payload}.${signature(payload, secret).toString('base64url')}`,
    claims,
  }
}

export function verifyDownloadAccessToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): DownloadAccessClaims {
  if (!token || !isDownloadSigningSecret(secret)) {
    throw new DownloadAccessError('Missing or invalid access credentials')
  }

  const [payload, suppliedSignature, extra] = token.split('.')
  if (!payload || !suppliedSignature || extra) throw new DownloadAccessError('Malformed access token')

  let supplied: Buffer
  try {
    supplied = Buffer.from(suppliedSignature, 'base64url')
  } catch {
    throw new DownloadAccessError('Malformed access token')
  }

  const expected = signature(payload, secret)
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new DownloadAccessError('Invalid access token')
  }

  let claims: DownloadAccessClaims
  try {
    claims = JSON.parse(decode(payload)) as DownloadAccessClaims
  } catch {
    throw new DownloadAccessError('Malformed access token')
  }

  const commonClaimsAreValid =
    [1, TOKEN_VERSION].includes(claims.v) &&
    ['library', 'category', 'item'].includes(claims.scope) &&
    Number.isInteger(claims.iat) &&
    !(claims.scope === 'library' && claims.targetId) &&
    !(claims.scope !== 'library' && !claims.targetId)

  const expiryIsValid =
    typeof claims.exp === 'number' &&
    Number.isInteger(claims.exp) &&
    claims.exp > claims.iat

  const versionClaimsAreValid =
    claims.v === 1
      ? expiryIsValid
      : (
          (expiryIsValid || (claims.exp === null && claims.scope !== 'library')) &&
          (
            claims.scope === 'library'
              ? claims.shareVersion === undefined
              : Number.isInteger(claims.shareVersion) && (claims.shareVersion || 0) >= 1
          )
        )

  if (!commonClaimsAreValid || !versionClaimsAreValid) {
    throw new DownloadAccessError('Invalid access token claims')
  }

  if (claims.exp !== null && claims.exp <= Math.floor(now / 1000)) {
    throw new DownloadAccessError('Expired access token')
  }
  return claims
}

export function readDownloadAccess(
  cookieValue: string | undefined,
  secret = process.env.DOWNLOADS_LINK_SIGNING_SECRET || '',
): DownloadAccessClaims | null {
  try {
    return verifyDownloadAccessToken(cookieValue, secret)
  } catch {
    return null
  }
}

export function canAccessDownloadable(
  claims: DownloadAccessClaims,
  item: Pick<Downloadable, '_id' | 'category' | 'shareVersion'>,
): boolean {
  if (claims.scope === 'library') return true
  if (claims.scope === 'category') {
    return canAccessDownloadTarget(claims, item.category)
  }
  return canAccessDownloadTarget(claims, item)
}

export function canAccessDownloadTarget(
  claims: DownloadAccessClaims,
  target: { _id: string; shareVersion: number },
): boolean {
  if (claims.scope === 'library') return true
  if (claims.targetId !== target._id) return false
  return claims.v === 1 || claims.shareVersion === target.shareVersion
}

export function accessCookieOptions(claims: DownloadAccessClaims) {
  const options = {
    name: DOWNLOAD_ACCESS_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }
  return claims.exp === null
    ? options
    : { ...options, expires: new Date(claims.exp * 1000) }
}
