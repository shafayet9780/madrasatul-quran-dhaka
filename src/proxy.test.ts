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

describe('survey routes', () => {
  const auth = `Basic ${Buffer.from('test-editor:test-password').toString('base64')}`;
  const production = () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STUDIO_AUTH_ENABLED', 'true');
    vi.stubEnv('STUDIO_USERNAME', 'test-editor');
    vi.stubEnv('STUDIO_PASSWORD', 'test-password');
  };
  const locale = (response: Response) => response.headers.get('x-middleware-request-x-next-intl-locale');

  it('serves survey links in Bengali without a locale redirect or login', () => {
    production();
    for (const url of ['http://localhost/survey/t1-2026-10?k=abc', 'http://localhost/survey/receipt/xyz']) {
      const response = proxy(new NextRequest(url));
      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(locale(response)).toBe('bengali');
    }
  });
  it('requires the Studio login for admin pages', () => {
    production();
    const denied = proxy(new NextRequest('http://localhost/admin/rounds'));
    expect(denied.status).toBe(401);
    expect(denied.headers.get('www-authenticate')).toContain('Basic');
    const allowed = proxy(new NextRequest('http://localhost/admin/rounds', { headers: { authorization: auth } }));
    expect(allowed.headers.get('x-middleware-next')).toBe('1');
    expect(locale(allowed)).toBe('bengali');
  });
  it('refuses admin pages when the login is not configured in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STUDIO_AUTH_ENABLED', 'false');
    expect(proxy(new NextRequest('http://localhost/admin')).status).toBe(503);
  });
  it('leaves look-alike paths to the locale middleware', () => {
    production();
    for (const url of ['http://localhost/surveys', 'http://localhost/administration']) {
      expect(proxy(new NextRequest(url))).toBeUndefined();
    }
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
      '/survey/t1-2026-10',
      '/admin',
      '/admin/reports/class',
    ])
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
  });
});
