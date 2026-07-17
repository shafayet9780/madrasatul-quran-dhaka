import { describe, expect, it } from 'vitest';
import { sanitizePathWithAllowedQuery } from './url';

describe('analytics URL sanitization', () => {
  it('keeps only safe UTM query params in page paths', () => {
    const sanitized = sanitizePathWithAllowedQuery(
      '/english/pre-admission',
      '?utm_source=facebook&utm_medium=paid&gclid=raw-gclid&fbclid=raw-fbclid&email=test@example.com&phone=123'
    );

    expect(sanitized).toBe('/english/pre-admission?utm_source=facebook&utm_medium=paid');
    expect(sanitized).not.toContain('gclid');
    expect(sanitized).not.toContain('fbclid');
    expect(sanitized).not.toContain('email');
    expect(sanitized).not.toContain('phone');
  });

  it('returns only the pathname when no safe params are present', () => {
    expect(
      sanitizePathWithAllowedQuery('/bengali/admissions', '?gclid=raw&message=hello')
    ).toBe('/bengali/admissions');
  });
});
