import { afterEach, expect, it, vi } from 'vitest';
import robots from './robots';
import { DEFAULT_SITE_URL } from '@/lib/site-url';
afterEach(() => vi.unstubAllEnvs());
it('keeps search-engine crawl protections shared and leaves rendering resources accessible', () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
  const result = robots();
  const rules = result.rules as Array<{
    userAgent: string | string[];
    allow?: string;
    disallow: string | string[];
  }>;
  expect(rules[0]).toMatchObject({ userAgent: '*', allow: '/' });
  expect(rules[0].disallow).toContain('/studio');
  expect(rules[0].disallow).toContain('/survey');
  expect(rules[0].disallow).toContain('/bengali/downloads');
  expect(rules[0].disallow).not.toContain('/_next/');
  expect(rules[0].disallow).not.toContain('/*?*');
  expect(
    rules.some(rule =>
      ['Googlebot', 'Bingbot', 'Slurp'].includes(String(rule.userAgent))
    )
  ).toBe(false);
  expect(result.sitemap).toBe(`${DEFAULT_SITE_URL}/sitemap.xml`);
});
it('preserves the existing blocked crawler policy', () => {
  const rules = robots().rules as Array<{
    userAgent: string | string[];
    disallow: string | string[];
  }>;
  expect(rules[1]).toMatchObject({ disallow: '/' });
  expect(rules[1].userAgent).toContain('GPTBot');
  expect(rules[1].userAgent).toContain('AhrefsBot');
});
