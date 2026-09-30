import { describe, expect, it, vi } from 'vitest';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { config } from './proxy';
vi.mock('next-intl/middleware', () => ({ default: () => vi.fn() }));

describe('public image routes', () => {
  it('serves generated images without locale redirects', () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        url: '/images/curriculum/learning.webp',
      })
    ).toBe(false);
  });
  it('retains localization and Studio authentication matching', () => {
    for (const url of [
      '/curriculum',
      '/bengali/curriculum',
      '/studio',
      '/studio/structure',
    ])
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
  });
});
