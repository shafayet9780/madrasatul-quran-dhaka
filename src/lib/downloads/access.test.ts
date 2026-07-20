import { describe, expect, it } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  accessCookieOptions,
  canAccessDownloadable,
  createDownloadAccessToken,
  verifyDownloadAccessToken,
} from './access'

const secret = 'a-test-secret-that-is-long-enough-for-tests'
const now = Date.UTC(2026, 6, 19)

describe('download access tokens', () => {
  it('signs and verifies a valid 7-day library token', () => {
    const { token, claims } = createDownloadAccessToken({
      scope: 'library',
      secret,
      now,
    })
    expect(verifyDownloadAccessToken(token, secret, now + 1000)).toEqual(claims)
    expect(claims.exp! - claims.iat).toBe(7 * 24 * 60 * 60)
  })

  it.each([1, 7, 30] as const)('uses the %d-day TTL preset for token and cookie expiry', (ttlDays) => {
    const { claims } = createDownloadAccessToken({ scope: 'library', secret, now, lifetime: ttlDays })
    expect(claims.exp! - claims.iat).toBe(ttlDays * 24 * 60 * 60)
    const options = accessCookieOptions(claims)
    expect('expires' in options && options.expires.getTime()).toBe(claims.exp! * 1000)
  })

  it('creates a never-expiring, revocable category link with a session cookie', () => {
    const { token, claims } = createDownloadAccessToken({
      scope: 'category',
      targetId: 'category-1',
      targetShareVersion: 3,
      lifetime: 'never',
      secret,
      now,
    })
    expect(claims.exp).toBeNull()
    expect(claims.v).toBe(2)
    expect(claims.v === 2 && claims.shareVersion).toBe(3)
    expect(accessCookieOptions(claims)).not.toHaveProperty('expires')
    expect(verifyDownloadAccessToken(token, secret, now + 20 * 365 * 24 * 60 * 60 * 1000)).toEqual(claims)
  })

  it('does not allow a never-expiring library link', () => {
    expect(() =>
      createDownloadAccessToken({ scope: 'library', lifetime: 'never', secret, now }),
    ).toThrow('Library links must expire')
  })

  it('rejects weak signing secrets', () => {
    expect(() =>
      createDownloadAccessToken({ scope: 'library', secret: 'too-short', now }),
    ).toThrow('32 random bytes')
    expect(() => verifyDownloadAccessToken('payload.signature', 'too-short', now))
      .toThrow('Missing or invalid access credentials')
    expect(() =>
      createDownloadAccessToken({
        scope: 'library',
        secret: 'replace_with_a_long_random_secret',
        now,
      }),
    ).toThrow('32 random bytes')
  })

  it('rejects expired, malformed, and tampered tokens', () => {
    const { token } = createDownloadAccessToken({ scope: 'library', secret, now, lifetime: 1 })
    expect(() => verifyDownloadAccessToken(token, secret, now + 24 * 60 * 60 * 1000)).toThrow()
    expect(() => verifyDownloadAccessToken('not-a-token', secret, now)).toThrow()
    expect(() => verifyDownloadAccessToken(`${token}x`, secret, now)).toThrow()
  })

  it('enforces library, category, and item boundaries', () => {
    const item = {
      _id: 'item-1',
      shareVersion: 1,
      category: { _id: 'category-1', shareVersion: 1 },
    }
    const other = {
      _id: 'item-2',
      shareVersion: 1,
      category: { _id: 'category-2', shareVersion: 1 },
    }
    const base = { v: 1 as const, iat: 1, exp: 2 }
    expect(canAccessDownloadable({ ...base, scope: 'library' }, item as never)).toBe(true)
    expect(canAccessDownloadable({ ...base, scope: 'category', targetId: 'category-1' }, item as never)).toBe(true)
    expect(canAccessDownloadable({ ...base, scope: 'category', targetId: 'category-1' }, other as never)).toBe(false)
    expect(canAccessDownloadable({ ...base, scope: 'item', targetId: 'item-1' }, item as never)).toBe(true)
    expect(canAccessDownloadable({ ...base, scope: 'item', targetId: 'item-1' }, other as never)).toBe(false)
  })

  it('invalidates new category and item links when their share version changes', () => {
    const categoryLink = createDownloadAccessToken({
      scope: 'category',
      targetId: 'category-1',
      targetShareVersion: 4,
      lifetime: 'never',
      secret,
      now,
    }).claims
    const itemLink = createDownloadAccessToken({
      scope: 'item',
      targetId: 'item-1',
      targetShareVersion: 2,
      lifetime: 'never',
      secret,
      now,
    }).claims
    const current = {
      _id: 'item-1',
      shareVersion: 2,
      category: { _id: 'category-1', shareVersion: 4 },
    }
    expect(canAccessDownloadable(categoryLink, current as never)).toBe(true)
    expect(canAccessDownloadable(itemLink, current as never)).toBe(true)
    expect(canAccessDownloadable(categoryLink, {
      ...current,
      category: { ...current.category, shareVersion: 5 },
    } as never)).toBe(false)
    expect(canAccessDownloadable(itemLink, { ...current, shareVersion: 3 } as never)).toBe(false)
  })

  it('continues to verify legacy version-1 expiring links', () => {
    const legacyClaims = {
      v: 1,
      scope: 'category',
      targetId: 'category-1',
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + 60,
    }
    const payload = Buffer.from(JSON.stringify(legacyClaims), 'utf8').toString('base64url')
    const signature = createHmac('sha256', secret).update(payload).digest('base64url')
    expect(verifyDownloadAccessToken(`${payload}.${signature}`, secret, now)).toEqual(legacyClaims)
  })
})
