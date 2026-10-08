// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { previewDraftMode } from './cycle';

describe('previewDraftMode', () => {
  it('applies only on a Vercel preview with the switch set', () => {
    expect(previewDraftMode({ ADMISSIONS_PREVIEW_DRAFT: '1', VERCEL_ENV: 'preview' })).toBe(true);
    expect(previewDraftMode({ ADMISSIONS_PREVIEW_DRAFT: '1', VERCEL_ENV: 'production' })).toBe(false);
    expect(previewDraftMode({ ADMISSIONS_PREVIEW_DRAFT: '1' })).toBe(false);
    expect(previewDraftMode({ VERCEL_ENV: 'preview' })).toBe(false);
  });
});
