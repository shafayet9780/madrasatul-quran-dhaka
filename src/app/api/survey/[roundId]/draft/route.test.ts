import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { selectRound, saveDraft } = vi.hoisted(() => ({ selectRound: vi.fn(), saveDraft: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/survey/db', () => ({
  getDb: () => ({ select: () => ({ from: () => ({ where: () => ({ limit: selectRound }) }) }) }),
}));
vi.mock('@/lib/survey/t1', () => ({ saveDraft }));

import { POST } from './route';

const ROUND_ID = '6f1d2a8e-3b4c-4d5e-8f90-1a2b3c4d5e6f';
const hour = 60 * 60 * 1000;
const openRound = () => ({ id: ROUND_ID, linkKey: 'secret-key', opensAt: new Date(Date.now() - hour), closesAt: new Date(Date.now() + hour) });
const body = { teacherKey: 'ustad-abdullah', classKey: 'nursery', sectionKey: 'a', subjectKey: 'quran', rows: [{ studentErpId: 's1', answers: { attendance: 10 } }] };

function request(key: string | null, payload: unknown = body) {
  return new NextRequest(`https://school.test/api/survey/${ROUND_ID}/draft`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'content-type': 'application/json', ...(key ? { 'x-survey-key': key } : {}) },
  });
}
const call = (req: NextRequest, roundId = ROUND_ID) => POST(req, { params: Promise.resolve({ roundId }) });

afterEach(() => vi.clearAllMocks());

describe('survey draft route', () => {
  it('rejects a missing or wrong link key and unknown rounds the same way', async () => {
    selectRound.mockResolvedValue([openRound()]);
    expect((await call(request(null))).status).toBe(404);
    expect((await call(request('wrong-key!'))).status).toBe(404);
    expect((await call(request('secret-key'), 'not-a-uuid')).status).toBe(404);
    selectRound.mockResolvedValue([]);
    expect((await call(request('secret-key'))).status).toBe(404);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('refuses writes to a closed round', async () => {
    selectRound.mockResolvedValue([{ ...openRound(), closesAt: new Date(Date.now() - hour) }]);
    expect((await call(request('secret-key'))).status).toBe(403);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('validates the body and saves with request metadata', async () => {
    selectRound.mockResolvedValue([openRound()]);
    expect((await call(request('secret-key', { ...body, rows: [] }))).status).toBe(400);
    saveDraft.mockResolvedValue({ ok: true, savedAt: 'now' });
    const response = await call(request('secret-key'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ id: ROUND_ID }),
      { teacherKey: 'ustad-abdullah', classKey: 'nursery', sectionKey: 'a', subjectKey: 'quran' },
      body.rows,
      expect.objectContaining({ userAgent: null })
    );
  });
});
