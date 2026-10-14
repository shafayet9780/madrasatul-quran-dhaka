import { describe, expect, it } from 'vitest';
import { sitePhone } from './phone';

describe('sitePhone', () => {
  it('prints a Bangladeshi mobile the local way, in the page digits', () => {
    expect(sitePhone('+880 1301 226644', 'bengali')).toEqual({ display: '০১৩০১-২২৬৬৪৪', tel: 'tel:+8801301226644', e164: '+8801301226644' });
    expect(sitePhone('01733-202368', 'english')?.display).toBe('01733-202368');
  });

  it('keeps other numbers as they are and drops what is not a number', () => {
    expect(sitePhone('+44 20 7946 0958', 'english')?.display).toBe('+442079460958');
    expect(sitePhone('call us', 'english')).toBeNull();
    expect(sitePhone(undefined, 'bengali')).toBeNull();
  });
});
