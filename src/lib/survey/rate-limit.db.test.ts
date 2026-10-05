import { afterAll, describe, expect, it } from 'vitest';
import { like } from 'drizzle-orm';
import { getDb } from './db';
import { allow } from './rate-limit';
import { rateLimits } from './schema';

const key = `test-rl-${Date.now()}`;
afterAll(() => getDb().delete(rateLimits).where(like(rateLimits.key, 'test-rl-%')));

describe('allow', () => {
  it('counts within a window and starts over after it', async () => {
    const t0 = new Date();
    expect(await allow(key, 2, 1000, t0)).toBe(true);
    expect(await allow(key, 2, 1000, t0)).toBe(true);
    expect(await allow(key, 2, 1000, t0)).toBe(false);
    expect(await allow(key, 2, 1000, new Date(t0.getTime() + 1500))).toBe(true);
  });
});
