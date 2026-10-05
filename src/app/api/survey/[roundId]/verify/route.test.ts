import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { selectRound, verifyMobile, allow } = vi.hoisted(() => ({ selectRound: vi.fn(), verifyMobile: vi.fn(), allow: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/survey/rate-limit', () => ({ allow, SURVEY_LIMITS: { guardianLookup: {}, guardianValue: {} } }));
vi.mock('@/lib/survey/db', () => ({
  getDb: () => ({ select: () => ({ from: () => ({ where: () => ({ limit: selectRound }) }) }) }),
}));
vi.mock('@/lib/survey/guardian', () => ({ verifyMobile }));

import { POST } from './route';

const ROUND_ID = '6f1d2a8e-3b4c-4d5e-8f90-1a2b3c4d5e6f';
const hour = 60 * 60 * 1000;
const round = (kind = 'G1') => ({ id: ROUND_ID, kind, linkKey: 'secret-key', opensAt: new Date(Date.now() - hour), closesAt: new Date(Date.now() + hour), snapshot: { classes: [] } });

const call = (body: unknown) =>
  POST(
    new NextRequest(`https://school.test/api/survey/${ROUND_ID}/verify`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json', 'x-survey-key': 'secret-key' },
    }),
    { params: Promise.resolve({ roundId: ROUND_ID }) }
  );

afterEach(() => vi.clearAllMocks());

describe('guardian verify route', () => {
  it('answers only whether the mobile is on record', async () => {
    selectRound.mockResolvedValue([round()]);
    allow.mockResolvedValue(true);
    verifyMobile.mockResolvedValue(true);
    const response = await call({ studentErpId: '১০০১৪', mobile: '01915482736' });
    expect(await response.json()).toEqual({ verified: true });
    expect(verifyMobile).toHaveBeenCalledWith('10014', '8801915482736');
  });

  it('passes a foreign number on in its canonical form', async () => {
    selectRound.mockResolvedValue([round()]);
    allow.mockResolvedValue(true);
    verifyMobile.mockResolvedValue(true);
    expect(await (await call({ studentErpId: '10014', mobile: '+44 7911 123456' })).json()).toEqual({ verified: true });
    expect(verifyMobile).toHaveBeenCalledWith('10014', '447911123456');
  });

  it('answers "not verified" for an impossible number without checking', async () => {
    selectRound.mockResolvedValue([round()]);
    allow.mockResolvedValue(true);
    expect(await (await call({ studentErpId: '10014', mobile: '123' })).json()).toEqual({ verified: false });
    expect(verifyMobile).not.toHaveBeenCalled();
  });

  it('limits checks per mobile too, so one number cannot be tried against every student', async () => {
    selectRound.mockResolvedValue([round()]);
    let calls = 0;
    // The first value key (per student) passes, the second (per mobile) is used up.
    allow.mockImplementation(async (key: string) => !key.startsWith('survey:guardianValue:') || calls++ === 0);
    expect((await call({ studentErpId: '10015', mobile: '01915482736' })).status).toBe(429);
    expect(verifyMobile).not.toHaveBeenCalled();
  });

  it('rejects a malformed body and does not answer after closing', async () => {
    allow.mockResolvedValue(true);
    selectRound.mockResolvedValue([round()]);
    expect((await call({ studentErpId: 10014 })).status).toBe(400);
    selectRound.mockResolvedValue([{ ...round(), closesAt: new Date(Date.now() - 5 * 60 * 1000) }]);
    expect((await call({ studentErpId: '10014', mobile: '01915482736' })).status).toBe(403);
  });

  it('limits checks per student so mobiles cannot be guessed', async () => {
    selectRound.mockResolvedValue([round()]);
    allow.mockImplementation(async (key: string) => !key.startsWith('survey:guardianValue:'));
    expect((await call({ studentErpId: '10014', mobile: '01915482736' })).status).toBe(429);
    expect(verifyMobile).not.toHaveBeenCalled();
  });

  it('is not available on teacher rounds', async () => {
    selectRound.mockResolvedValue([round('T1')]);
    allow.mockResolvedValue(true);
    expect((await call({ studentErpId: '10014', mobile: '01915482736' })).status).toBe(404);
  });
});
