import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CycleState } from './cycle';
import { buildSnapshot, type FormDocument } from './snapshot';
import { liveFormDocument } from './testing/live-form';

const state = vi.hoisted(() => ({ doc: null as unknown, testPass: false, preview: false, cycle: null as unknown }));
const getCurrentCycle = vi.hoisted(() => vi.fn(async () => state.cycle));

vi.mock('@/lib/sanity-fetch', () => ({ sanityFetch: async () => state.doc }));
vi.mock('./local', () => ({ localOverrides: () => null }));
vi.mock('./test-pass', () => ({ hasTestPass: async () => state.testPass }));
vi.mock('./session', () => ({ currentApplication: async () => null }));
vi.mock('./cycle', () => ({ FORM_QUERY: 'form', getCurrentCycle, previewDraftMode: () => state.preview }));

const { getLandingIntake } = await import('./pages');

const doc = (enabled = true): FormDocument => ({ ...liveFormDocument(), formSettings: { isEnabled: enabled } });
// Published and switched on, but past its closing date.
const closed = (): FormDocument => {
  const d = doc();
  return { ...d, cycle: { ...d.cycle, opensAt: '2020-01-01T00:00:00Z', closesAt: '2020-02-01T00:00:00Z' } };
};
const cycle = (over: Partial<CycleState> = {}): CycleState => ({
  cycleId: 'c1',
  session: '2027',
  version: 3,
  snapshot: buildSnapshot(doc()),
  enabled: true,
  window: 'open',
  problems: [],
  ...over,
});

describe('getLandingIntake', () => {
  beforeEach(() => {
    Object.assign(state, { doc: doc(), testPass: false, preview: false, cycle: cycle() });
    getCurrentCycle.mockClear();
  });

  it('reads the published form in season, without the database', async () => {
    const { intake, snapshot } = await getLandingIntake();
    expect(intake).toMatchObject({ state: 'open', session: '2027' });
    expect(snapshot?.settings.applicationFee).toBeGreaterThan(0);
    expect(getCurrentCycle).not.toHaveBeenCalled();
  });

  it("uses the database's cycle when the form is switched off, keeping its fees", async () => {
    Object.assign(state, { doc: doc(false), cycle: cycle({ enabled: false }) });
    const { intake, snapshot } = await getLandingIntake();
    expect(intake.state).toBe('off');
    expect(snapshot?.settings.applicationFee).toBeGreaterThan(0);
    expect(getCurrentCycle).toHaveBeenCalledOnce();
  });

  it('uses the cycle for a test pass and a draft preview, which open a closed form', async () => {
    Object.assign(state, { doc: closed(), testPass: false });
    expect((await getLandingIntake()).intake.state).toBe('closed');
    expect(getCurrentCycle).not.toHaveBeenCalled();
    Object.assign(state, { testPass: true, cycle: cycle({ testPass: true }) });
    expect((await getLandingIntake()).intake.state).toBe('open');
    Object.assign(state, { testPass: false, preview: true });
    expect((await getLandingIntake()).intake.state).toBe('open');
    expect(getCurrentCycle).toHaveBeenCalledTimes(2);
  });

  it('is off with no cycle at all', async () => {
    Object.assign(state, { doc: null, cycle: null });
    expect(await getLandingIntake()).toEqual({ intake: { state: 'off' } });
  });
});
