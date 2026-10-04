import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { selectRound, loadBatch } = vi.hoisted(() => ({ selectRound: vi.fn(), loadBatch: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/survey/db', () => ({
  getDb: () => ({ select: () => ({ from: () => ({ where: () => ({ limit: selectRound }) }) }) }),
}));
vi.mock('@/lib/survey/t1', () => ({ loadBatch }));

import { POST } from './route';

const ROUND_ID = '6f1d2a8e-3b4c-4d5e-8f90-1a2b3c4d5e6f';
const minute = 60 * 1000;
// Closed five minutes ago: inside the 10-minute grace.
const inGrace = () => ({ id: ROUND_ID, linkKey: 'secret-key', opensAt: new Date(Date.now() - 60 * minute), closesAt: new Date(Date.now() - 5 * minute) });
const key = { teacherKey: 'ustad-abdullah', classKey: 'nursery', sectionKey: 'a', subjectKey: 'quran' };

const call = () =>
  POST(
    new NextRequest(`https://school.test/api/survey/${ROUND_ID}/batch`, {
      method: 'POST',
      body: JSON.stringify(key),
      headers: { 'content-type': 'application/json', 'x-survey-key': 'secret-key' },
    }),
    { params: Promise.resolve({ roundId: ROUND_ID }) }
  );

afterEach(() => vi.clearAllMocks());

describe('survey batch route during the grace period', () => {
  it('reopens work already started', async () => {
    selectRound.mockResolvedValue([inGrace()]);
    loadBatch.mockResolvedValue({ status: 'draft', students: [] });
    expect((await call()).status).toBe(200);
  });
  it('refuses to start a new class', async () => {
    selectRound.mockResolvedValue([inGrace()]);
    loadBatch.mockResolvedValue({ status: 'new', students: [] });
    expect((await call()).status).toBe(403);
  });
});
