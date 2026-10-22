import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn with the design tokens', () => {
  it('keeps a token size and a token colour together', () => {
    expect(cn('text-surface text-18')).toBe('text-surface text-18');
    expect(cn('text-h2 text-ink')).toBe('text-h2 text-ink');
    expect(cn('font-strong font-sans')).toBe('font-strong font-sans');
  });

  it('lets a later size, colour or family win', () => {
    expect(cn('text-15 text-18')).toBe('text-18');
    expect(cn('text-sm text-15')).toBe('text-15');
    expect(cn('text-ink text-on-dark')).toBe('text-on-dark');
    expect(cn('font-sans font-quote')).toBe('font-quote');
  });
});
