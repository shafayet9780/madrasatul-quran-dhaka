import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { selectRound, lookupChildren, allow } = vi.hoisted(() => ({ selectRound: vi.fn(), lookupChildren: vi.fn(), allow: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/survey/rate-limit', () => ({ allow, SURVEY_LIMITS: { guardianLookup: {}, guardianLookupDaily: {}, guardianValue: {} } }));
vi.mock('@/lib/survey/db', () => ({
  getDb: () => ({ select: () => ({ from: () => ({ where: () => ({ limit: selectRound }) }) }) }),
}));
vi.mock('@/lib/survey/guardian', () => ({ lookupChildren }));

import { POST } from './route';

const ROUND_ID = '6f1d2a8e-3b4c-4d5e-8f90-1a2b3c4d5e6f';
const hour = 60 * 60 * 1000;
const round = (kind = 'G2', closesIn = hour) => ({
  id: ROUND_ID,
  kind,
  linkKey: 'secret-key',
  opensAt: new Date(Date.now() - hour),
  closesAt: new Date(Date.now() + closesIn),
  snapshot: {
    classes: [
      { key: 'play', name: 'প্লে', sections: [], subjects: [] },
      { key: 'kg', name: 'কেজি', sections: [{ key: 'a', name: 'A' }], subjects: [] },
    ],
  },
});

const call = (body: unknown, key = 'secret-key') =>
  POST(
    new NextRequest(`https://school.test/api/survey/${ROUND_ID}/lookup`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json', 'x-survey-key': key },
    }),
    { params: Promise.resolve({ roundId: ROUND_ID }) }
  );

afterEach(() => vi.clearAllMocks());

describe('guardian lookup route', () => {
  it('normalises the value and returns only the matched children', async () => {
    selectRound.mockResolvedValue([round()]);
    allow.mockResolvedValue(true);
    lookupChildren.mockResolvedValue([{ erpId: '10014', name: 'Hasan', roll: 19, submittedAt: null }]);
    const response = await call({ classKey: 'kg', sectionKey: 'a', by: 'mobile', value: '০১৯১৫-৪৮২৭৩৬' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ children: [{ erpId: '10014', name: 'Hasan', roll: 19, submittedAt: null }] });
    expect(lookupChildren).toHaveBeenCalledWith(expect.anything(), { classKey: 'kg', sectionKey: 'a', by: 'mobile', value: '8801915482736' }, null);
  });

  it('answers an impossible value like "not found", without searching', async () => {
    selectRound.mockResolvedValue([round()]);
    allow.mockResolvedValue(true);
    expect(await (await call({ classKey: 'play', sectionKey: '', by: 'mobile', value: '123' })).json()).toEqual({ children: [] });
    expect(lookupChildren).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON', async () => {
    selectRound.mockResolvedValue([round()]);
    allow.mockResolvedValue(true);
    const response = await POST(
      new NextRequest(`https://school.test/api/survey/${ROUND_ID}/lookup`, { method: 'POST', body: '{oops', headers: { 'x-survey-key': 'secret-key' } }),
      { params: Promise.resolve({ roundId: ROUND_ID }) }
    );
    expect(response.status).toBe(400);
  });

  it('rejects a class or section that is not in the round', async () => {
    selectRound.mockResolvedValue([round()]);
    allow.mockResolvedValue(true);
    expect((await call({ classKey: 'kg', sectionKey: '', by: 'id', value: '10014' })).status).toBe(400);
    expect((await call({ classKey: 'play', sectionKey: 'a', by: 'id', value: '10014' })).status).toBe(400);
    expect((await call({ classKey: 'six', sectionKey: '', by: 'id', value: '10014' })).status).toBe(400);
  });

  it('needs the link key and a guardian round that is open', async () => {
    allow.mockResolvedValue(true);
    selectRound.mockResolvedValue([round()]);
    expect((await call({ classKey: 'play', sectionKey: '', by: 'id', value: '10014' }, 'wrong')).status).toBe(404);
    selectRound.mockResolvedValue([round('T1')]);
    expect((await call({ classKey: 'play', sectionKey: '', by: 'id', value: '10014' })).status).toBe(404);
    selectRound.mockResolvedValue([round('G2', -5 * 60 * 1000)]);
    expect((await call({ classKey: 'play', sectionKey: '', by: 'id', value: '10014' })).status).toBe(403);
  });

  it('stops an address that looks up too much in a day', async () => {
    selectRound.mockResolvedValue([round()]);
    allow.mockImplementation(async (key: string) => !key.startsWith('survey:guardianLookupDaily:'));
    expect((await call({ classKey: 'play', sectionKey: '', by: 'id', value: '10014' })).status).toBe(429);
    expect(lookupChildren).not.toHaveBeenCalled();
  });

  it('stops repeated lookups of one value, whatever the IP', async () => {
    selectRound.mockResolvedValue([round()]);
    allow.mockImplementation(async (key: string) => !key.startsWith('survey:guardianValue:'));
    const response = await call({ classKey: 'play', sectionKey: '', by: 'id', value: '10014' });
    expect(response.status).toBe(429);
    expect(lookupChildren).not.toHaveBeenCalled();
    const valueKey = allow.mock.calls.map(([key]) => key).find((key: string) => key.startsWith('survey:guardianValue:'));
    expect(valueKey).not.toContain('10014');
  });
});
