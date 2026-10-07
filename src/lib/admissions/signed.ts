import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Short signed values for cookies: `payload.expiry.signature` (HMAC-SHA256, base64url). Used to give
// a device access to an application found with "Find my application" without reissuing the
// guardian's resume token (their emailed link and other devices keep working).

const b64 = (b: Buffer) => b.toString('base64url');

export function signValue(payload: string, key: Buffer, ttlSeconds: number, now = Date.now()): string {
  const body = `${Buffer.from(payload).toString('base64url')}.${Math.floor(now / 1000) + ttlSeconds}`;
  return `${body}.${b64(createHmac('sha256', key).update(body).digest())}`;
}

export function verifySignedValue(value: string | undefined | null, key: Buffer, now = Date.now()): string | null {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const [payload, expiry, sig] = parts;
  const expected = createHmac('sha256', key).update(`${payload}.${expiry}`).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  if (!/^\d+$/.test(expiry) || Number(expiry) * 1000 < now) return null;
  return Buffer.from(payload, 'base64url').toString();
}

const holder = globalThis as { __admissionsEphemeralKey?: Buffer };

/**
 * ADMISSIONS_SECRET, else derived from CRON_SECRET (already set for the survey); the local preview
 * gets a random per-process key. Null when neither exists (Find then cannot open applications).
 */
export function signingKey(env: Record<string, string | undefined> = process.env): Buffer | null {
  const secret = env.ADMISSIONS_SECRET || env.CRON_SECRET;
  if (secret) return createHmac('sha256', 'madrasatul-quran admissions access').update(secret).digest();
  if (env.ADMISSIONS_LOCAL === '1' && !env.VERCEL) return (holder.__admissionsEphemeralKey ??= randomBytes(32));
  return null;
}
