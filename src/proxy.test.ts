import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { config, proxy } from './proxy';
vi.mock('next-intl/middleware', () => ({ default: () => vi.fn() }));
afterEach(() => vi.unstubAllEnvs());

describe('Studio request language', () => {
  it('overrides the request locale with English after successful authentication', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STUDIO_AUTH_ENABLED', 'true');
    vi.stubEnv('STUDIO_USERNAME', 'test-editor');
    vi.stubEnv('STUDIO_PASSWORD', 'test-password');
    const request = new NextRequest('http://localhost/studio/structure', {
      headers: {
        authorization: `Basic ${Buffer.from('test-editor:test-password').toString('base64')}`,
        'X-NEXT-INTL-LOCALE': 'bengali',
      },
    });
    const response = proxy(request);
    expect(response.headers.get('x-middleware-request-x-next-intl-locale')).toBe(
      'english'
    );
    expect(response.headers.get('x-middleware-request-authorization')).toBe(
      request.headers.get('authorization')
    );
  });
  it('still rejects unauthenticated Studio requests', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STUDIO_AUTH_ENABLED', 'true');
    vi.stubEnv('STUDIO_USERNAME', 'test-editor');
    vi.stubEnv('STUDIO_PASSWORD', 'test-password');
    expect(proxy(new NextRequest('http://localhost/studio')).status).toBe(401);
  });
});

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
