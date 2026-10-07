import { createHash, randomBytes } from 'node:crypto';

/** Resume token: in the guardian's cookie and emailed link. Only its hash is stored. */
export function newResumeToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** A token as it arrives from a cookie or link: the right length and alphabet, or null. */
export function cleanToken(value: string | null | undefined): string | null {
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}
