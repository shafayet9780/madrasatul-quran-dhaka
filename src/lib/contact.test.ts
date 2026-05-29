import { describe, it, expect } from 'vitest';
import { activePhones } from './contact';
import type { ContactInfo } from '@/types/sanity';

const phone = (number: string, isActive: boolean, isPrimary: boolean): ContactInfo['phone'][number] => ({
  number,
  type: 'main',
  isActive,
  isPrimary,
});

describe('activePhones', () => {
  it('returns [] for missing contact info', () => {
    expect(activePhones(undefined)).toEqual([]);
    expect(activePhones({})).toEqual([]);
  });

  it('drops inactive numbers', () => {
    const info: ContactInfo = { phone: [phone('111', true, false), phone('222', false, false)] };
    expect(activePhones(info).map((p) => p.number)).toEqual(['111']);
  });

  it('lists the primary number first, keeping the rest in order', () => {
    const info: ContactInfo = {
      phone: [phone('111', true, false), phone('222', true, true), phone('333', true, false)],
    };
    expect(activePhones(info).map((p) => p.number)).toEqual(['222', '111', '333']);
  });
});
