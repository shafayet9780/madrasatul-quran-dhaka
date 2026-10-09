// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { signValue, signingKey, verifySignedValue } from './signed';

describe('signed values', () => {
  const key = Buffer.alloc(32, 7);
  it('round-trips until it expires and rejects tampering or another key', () => {
    const now = Date.UTC(2026, 9, 7);
    const v = signValue('app-1,app-2', key, 60, now);
    expect(verifySignedValue(v, key, now + 59_000)).toBe('app-1,app-2');
    expect(verifySignedValue(v, key, now + 61_000)).toBeNull();
    expect(verifySignedValue(v, Buffer.alloc(32, 8), now)).toBeNull();
    const [p, e, s] = v.split('.');
    expect(verifySignedValue(`${Buffer.from('app-3').toString('base64url')}.${e}.${s}`, key, now)).toBeNull();
    expect(verifySignedValue(`${p}.${Number(e) + 1000}.${s}`, key, now)).toBeNull();
    expect(verifySignedValue('garbage', key, now)).toBeNull();
  });

  it('takes the key from the environment', () => {
    expect(signingKey({})).toBeNull();
    expect(signingKey({ CRON_SECRET: 'a' })).toEqual(signingKey({ CRON_SECRET: 'a' }));
    expect(signingKey({ ADMISSIONS_SECRET: 'b', CRON_SECRET: 'a' })).not.toEqual(signingKey({ CRON_SECRET: 'a' }));
    expect(signingKey({ ADMISSIONS_LOCAL: '1' })).toHaveLength(32);
    expect(signingKey({ ADMISSIONS_LOCAL: '1', VERCEL: '1' })).toBeNull();
  });
});
