import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { selectRound } = vi.hoisted(() => ({ selectRound: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/survey/rate-limit', () => ({ allow: async () => true, SURVEY_LIMITS: { lookup: {} } }));
vi.mock('@/lib/survey/db', () => ({
  getDb: () => ({ select: () => ({ from: () => ({ where: () => ({ limit: selectRound }) }) }) }),
}));

import { POST } from './route';

const ROUND_ID = '6f1d2a8e-3b4c-4d5e-8f90-1a2b3c4d5e6f';
const minute = 60 * 1000;
const round = (closesIn: number) => ({
  id: ROUND_ID,
  linkKey: 'secret-key',
  opensAt: new Date(Date.now() - 60 * minute),
  closesAt: new Date(Date.now() + closesIn * minute),
  snapshot: { teachers: [{ key: '90001', name: 'উস্তাদ আব্দুল্লাহ' }] },
});

const call = (teacherId: unknown) =>
  POST(
    new NextRequest(`https://school.test/api/survey/${ROUND_ID}/teacher`, {
      method: 'POST',
      body: JSON.stringify({ teacherId }),
      headers: { 'content-type': 'application/json', 'x-survey-key': 'secret-key' },
    }),
    { params: Promise.resolve({ roundId: ROUND_ID }) }
  );

afterEach(() => vi.clearAllMocks());

describe('teacher lookup route', () => {
  it('finds a teacher by ERP ID typed with Bengali digits and spaces', async () => {
    selectRound.mockResolvedValue([round(60)]);
    const response = await call(' ৯০০০১ ');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ key: '90001', name: 'উস্তাদ আব্দুল্লাহ' });
  });
  it.each(['90002', '', '2000', 'abc'])('answers 404 for %j', async (id) => {
    selectRound.mockResolvedValue([round(60)]);
    expect((await call(id)).status).toBe(404);
  });
  it('rejects a malformed body', async () => {
    selectRound.mockResolvedValue([round(60)]);
    expect((await call(90001)).status).toBe(400);
  });
  it('still finds a teacher in the grace period, so a receipt edit works on another device', async () => {
    selectRound.mockResolvedValue([round(-5)]);
    expect((await call('90001')).status).toBe(200);
  });
  it('refuses after the grace period', async () => {
    selectRound.mockResolvedValue([round(-15)]);
    expect((await call('90001')).status).toBe(403);
  });
});
