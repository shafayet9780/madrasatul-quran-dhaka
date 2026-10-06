import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { selectRound, submitGuardian, allow } = vi.hoisted(() => ({ selectRound: vi.fn(), submitGuardian: vi.fn(), allow: vi.fn(async (_key: string) => true) }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/survey/rate-limit', () => ({ allow, SURVEY_LIMITS: { guardianSubmit: {}, guardianValue: {} } }));
vi.mock('@/lib/survey/db', () => ({
  getDb: () => ({ select: () => ({ from: () => ({ where: () => ({ limit: selectRound }) }) }) }),
}));
vi.mock('@/lib/survey/guardian', () => ({ submitGuardian }));
vi.mock('@/lib/survey/sheets-mirror', () => ({ mirrorPending: async () => ({}) }));
vi.mock('next/server', async (original) => ({ ...(await original<typeof import('next/server')>()), after: (task: () => unknown) => void task() }));

import { POST } from './route';

const ROUND_ID = '6f1d2a8e-3b4c-4d5e-8f90-1a2b3c4d5e6f';
const minute = 60 * 1000;
const round = (kind = 'G2', closesIn = 60 * minute) => ({ id: ROUND_ID, kind, linkKey: 'secret-key', opensAt: new Date(Date.now() - 60 * minute), closesAt: new Date(Date.now() + closesIn), snapshot: {} });
const body = {
  submissionId: '0b6f6c1e-8f5a-4d7e-9c1b-2a3d4e5f6a7b',
  classKey: 'kg',
  sectionKey: 'a',
  studentErpId: '10014',
  submitter: { name: 'ক', relation: 'father', mobile: '01915482736' },
  answers: { attendance: 'above-90' },
};

const call = (payload: unknown) =>
  POST(
    new NextRequest(`https://school.test/api/survey/${ROUND_ID}/guardian-submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json', 'x-survey-key': 'secret-key' },
    }),
    { params: Promise.resolve({ roundId: ROUND_ID }) }
  );

afterEach(() => {
  vi.clearAllMocks();
  allow.mockImplementation(async () => true);
});

describe('guardian submit route', () => {
  it('passes a valid form on and answers with its receipt', async () => {
    selectRound.mockResolvedValue([round()]);
    submitGuardian.mockResolvedValue({ ok: true, receiptToken: 'tok' });
    const response = await call(body);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, receiptToken: 'tok' });
    expect(submitGuardian.mock.calls[0][1]).toMatchObject({ comment: '', submitter: { relationOther: '' } });
  });

  it('answers 422 when the form does not fit and 400 for a malformed one', async () => {
    selectRound.mockResolvedValue([round()]);
    submitGuardian.mockResolvedValue({ ok: false, reason: 'incomplete', missing: ['devices'] });
    expect((await call(body)).status).toBe(422);
    expect((await call({ ...body, submissionId: 'not-a-uuid' })).status).toBe(400);
  });

  it('accepts a form in the grace period, but not on a teacher round or after it', async () => {
    submitGuardian.mockResolvedValue({ ok: true, receiptToken: 'tok' });
    selectRound.mockResolvedValue([round('G2', -5 * minute)]);
    expect((await call(body)).status).toBe(200);
    selectRound.mockResolvedValue([round('G2', -15 * minute)]);
    expect((await call(body)).status).toBe(403);
    selectRound.mockResolvedValue([round('T1')]);
    expect((await call(body)).status).toBe(404);
  });

  it('stops repeated forms for one child, whatever the IP', async () => {
    selectRound.mockResolvedValue([round()]);
    allow.mockImplementation(async (key: string) => !key.startsWith('survey:guardianValue:'));
    expect((await call(body)).status).toBe(429);
    expect(submitGuardian).not.toHaveBeenCalled();
  });

  it('counts a padded student ID as the same child', async () => {
    selectRound.mockResolvedValue([round()]);
    submitGuardian.mockResolvedValue({ ok: true, receiptToken: 'tok' });
    await call(body);
    await call({ ...body, studentErpId: ' 10014\t' });
    const keys = allow.mock.calls.map(([key]) => key).filter((key: string) => key.startsWith('survey:guardianValue:'));
    expect(new Set(keys).size).toBe(1);
    expect(submitGuardian.mock.calls[1][1].studentErpId).toBe('10014');
  });
});
