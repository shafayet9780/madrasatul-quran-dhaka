import { describe, expect, it } from 'vitest';
import { policyView } from './policies';
import type { Policies, SiteSettings } from '@/types/sanity';
import seed from '../../scripts/data/cms-coverage-seed.json';

const settings = { contactInfo: { email: [{ address: 'old@example.com', isActive: false }, { address: 'office@example.com', isActive: true }] } } as SiteSettings;

describe('policyView', () => {
  it('fills in the email, splits paragraphs and dates the page', () => {
    const doc: Policies = {
      updatedAt: '2026-10-20',
      privacy: {
        title: { bengali: 'গোপনীয়তা নীতি', english: 'Privacy Policy' },
        sections: [
          { heading: { english: 'Requests' }, body: { english: 'Write to {email}.\n\nOr call.' } },
          { heading: { english: 'Empty' }, body: { english: '  ' } },
        ],
      },
    };
    expect(policyView(doc, 'privacy', 'english', settings)).toEqual({
      title: 'Privacy Policy',
      intro: '',
      updated: '20 October 2026',
      sections: [{ heading: 'Requests', body: ['Write to office@example.com.', 'Or call.'] }],
    });
    expect(policyView(doc, 'cookies', 'english', settings)).toBeNull();
    expect(policyView(null, 'privacy', 'bengali')).toBeNull();
  });

  it('reads the seeded policies in both languages, without a placeholder left', () => {
    for (const kind of ['privacy', 'cookies'] as const) {
      for (const locale of ['bengali', 'english'] as const) {
        const view = policyView(seed.policies, kind, locale, settings)!;
        expect(view.sections.length).toBeGreaterThan(2);
        expect(JSON.stringify(view)).not.toMatch(/\{email\}|মাদ্রাসাতুল/);
      }
    }
  });
});
