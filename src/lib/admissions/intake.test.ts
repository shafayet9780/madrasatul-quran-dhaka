import { describe, expect, it } from 'vitest';
import { intakeFrom, intakeStatus, type Intake } from './intake';
import type { FormDocument } from './snapshot';
import { liveFormDocument } from './testing/live-form';

const now = new Date('2026-11-01T06:00:00Z');

function doc(cycle: Partial<NonNullable<FormDocument['cycle']>> = {}, enabled = true): FormDocument {
  const d = liveFormDocument(now);
  return { ...d, formSettings: { isEnabled: enabled }, cycle: { ...d.cycle, ...cycle } };
}

// Echoes the key and values, so the tests read which sentence was picked.
const t = (key: string, values?: Record<string, string>) => (values ? `${key} ${JSON.stringify(values)}` : key);

describe('intakeFrom', () => {
  it('is off when the form is switched off, missing or incomplete', () => {
    expect(intakeFrom(doc({}, false), now).state).toBe('off');
    expect(intakeFrom(null, now).state).toBe('off');
    expect(intakeFrom(doc({ session: undefined }), now).state).toBe('off');
  });

  it('follows the opening and closing dates', () => {
    expect(intakeFrom(doc({ opensAt: '2026-11-10T00:00:00Z' }), now).state).toBe('not_open');
    expect(intakeFrom(doc({ opensAt: '2026-10-01T00:00:00Z', closesAt: '2026-12-01T00:00:00Z' }), now)).toMatchObject({
      state: 'open',
      session: '2027',
      closesAt: '2026-12-01T00:00:00Z',
    });
    expect(intakeFrom(doc({ closesAt: '2026-10-31T00:00:00Z' }), now).state).toBe('closed');
  });
});

describe('intakeStatus', () => {
  const at = (intake: Intake) => intakeStatus(intake, 'english', t, now);

  it('announces the opening date before the form opens', () => {
    expect(at({ state: 'not_open', opensAt: '2026-11-10T04:00:00Z' })).toBe('statusNotOpen {"opens":"10 November, 10:00 am"}');
  });

  it('counts down the last week and the last day', () => {
    expect(at({ state: 'open', closesAt: '2026-12-01T17:59:00Z' })).toMatch(/^statusOpen /);
    expect(at({ state: 'open', closesAt: '2026-11-05T17:59:00Z' })).toMatch(/^statusClosingSoon \{"days":"4"/);
    expect(at({ state: 'open', closesAt: '2026-11-01T17:59:00Z' })).toMatch(/^statusLastDay /);
    expect(at({ state: 'open' })).toBe('statusOpenNoDeadline');
  });

  it('writes Bengali digits for the Bengali site', () => {
    expect(intakeStatus({ state: 'open', closesAt: '2026-11-05T17:59:00Z' }, 'bengali', t, now)).toContain('"days":"৪"');
  });

  it('reports closed and off', () => {
    expect(at({ state: 'closed' })).toBe('statusClosed');
    expect(at({ state: 'off' })).toBe('statusUnavailable');
  });
});
