import { describe, it, expect, vi } from 'vitest';

// Make getRequestConfig return the raw callback so we can test our own
// locale-resolution logic without next-intl's server/client runtime guard.
vi.mock('next-intl/server', () => ({
  getRequestConfig: (cb: unknown) => cb,
}));

import requestConfig from './i18n';

const resolve = (locale: string | undefined) =>
  (requestConfig as unknown as (p: {
    requestLocale: Promise<string | undefined>;
  }) => Promise<{ locale: string; messages: Record<string, unknown> }>)({
    requestLocale: Promise.resolve(locale),
  });

describe('i18n getRequestConfig', () => {
  it('returns the requested locale when valid', async () => {
    const cfg = await resolve('english');
    expect(cfg.locale).toBe('english');
    expect(cfg.messages).toBeDefined();
  });

  it('loads bengali messages for the bengali locale', async () => {
    const cfg = await resolve('bengali');
    expect(cfg.locale).toBe('bengali');
    expect(cfg.messages).toBeDefined();
  });

  it('falls back to bengali for an invalid locale', async () => {
    const cfg = await resolve('klingon');
    expect(cfg.locale).toBe('bengali');
  });

  it('falls back to bengali when locale is missing', async () => {
    const cfg = await resolve(undefined);
    expect(cfg.locale).toBe('bengali');
  });
});
