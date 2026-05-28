import { describe, it, expect, beforeEach, vi } from 'vitest';

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.mock('./sanity', () => ({ client: { fetch: fetchMock } }));
vi.mock('next/headers', () => ({ draftMode: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import {
  generatePreviewUrl,
  generateExitPreviewUrl,
  validatePreviewToken,
} from './preview';

beforeEach(() => {
  fetchMock.mockReset();
  // validatePreviewToken logs to console.error on the failure path; Vitest 4
  // otherwise fails the test when console.error is called.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('generatePreviewUrl', () => {
  it('builds an /api/preview URL with secret, slug, type and lang', () => {
    const url = generatePreviewUrl('newsEvent', 'big-news', 'english');
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/api/preview');
    expect(parsed.searchParams.get('slug')).toBe('big-news');
    expect(parsed.searchParams.get('type')).toBe('newsEvent');
    expect(parsed.searchParams.get('lang')).toBe('english');
    expect(parsed.searchParams.get('secret')).toBe('test-secret');
  });

  it('defaults the language to bengali', () => {
    const url = generatePreviewUrl('page', 'about');
    expect(new URL(url).searchParams.get('lang')).toBe('bengali');
  });
});

describe('generateExitPreviewUrl', () => {
  it('points at /api/exit-preview', () => {
    expect(generateExitPreviewUrl()).toBe('http://localhost:3000/api/exit-preview');
  });
});

describe('validatePreviewToken', () => {
  it('returns true when the token-authenticated fetch succeeds', async () => {
    fetchMock.mockResolvedValue({});
    expect(await validatePreviewToken('good-token')).toBe(true);
  });

  it('returns false when the fetch throws', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('unauthorized');
    });
    expect(await validatePreviewToken('bad-token')).toBe(false);
  });
});
