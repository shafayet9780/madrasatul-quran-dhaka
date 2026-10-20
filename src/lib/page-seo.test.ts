import { describe, expect, it, vi } from 'vitest';
import type { SeoSettings } from '@/types/sanity';

vi.mock('./sanity', () => ({
  urlFor: () => ({ width: () => ({ height: () => ({ fit: () => ({ url: () => 'https://cdn.sanity.io/images/share.jpg' }) }) }) }),
}));
vi.mock('./content-service', () => ({ getContentService: vi.fn() }));

import { seoText, sharePicture } from './page-seo';

const own = { title: 'Own title', description: 'Own description' };

describe('seoText', () => {
  it('keeps the page’s own wording without Studio text', () => {
    expect(seoText(null, 'admissions', 'english', own)).toEqual(own);
    expect(seoText({ pages: { admissions: { title: { english: '  ' } } } }, 'admissions', 'english', own)).toEqual(own);
  });

  it('uses the Studio title and description in the page’s language, each on its own', () => {
    const settings: SeoSettings = { pages: { admissions: { title: { bengali: 'ভর্তি', english: 'Admissions 2027' } } } };
    expect(seoText(settings, 'admissions', 'english', own)).toEqual({ title: 'Admissions 2027', description: 'Own description' });
    expect(seoText(settings, 'admissions', 'bengali', own).title).toBe('ভর্তি');
    // A page without an entry, or no page at all (a notice), keeps its own.
    expect(seoText(settings, 'contact', 'english', own)).toEqual(own);
    expect(seoText(settings, undefined, 'english', own)).toEqual(own);
  });

  it('fills {session} and leaves unknown names as written', () => {
    const settings: SeoSettings = { pages: { preAdmission: { title: { bengali: 'প্রি-অ্যাডমিশন {session} {other}' } } } };
    expect(seoText(settings, 'preAdmission', 'bengali', own, { session: '২০২৭' }).title).toBe('প্রি-অ্যাডমিশন ২০২৭ {other}');
  });
});

describe('sharePicture', () => {
  it('is the Studio picture with its words, or nothing', () => {
    expect(sharePicture(null, 'english')).toBeUndefined();
    const settings = { shareImage: { _type: 'image', asset: { _ref: 'image-x', _type: 'reference' }, alt: { bengali: 'ভবন', english: '' } } } as SeoSettings;
    expect(sharePicture(settings, 'english')).toEqual({ url: 'https://cdn.sanity.io/images/share.jpg', alt: 'ভবন' });
    expect(sharePicture(settings, 'bengali')?.alt).toBe('ভবন');
  });
});
