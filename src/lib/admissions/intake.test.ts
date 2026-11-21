import { describe, expect, it } from 'vitest';
import { ctaStatus, ctaTitle, intakeFrom, intakeStatus, nextChange, sessionOrNext, type Intake } from './intake';
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

  it('takes the kind and dates from the window that applies now', () => {
    const windows = [
      { kind: 'preAdmission' as const, opensAt: '2026-10-01T00:00:00Z', closesAt: '2026-10-20T00:00:00Z' },
      { kind: 'admission' as const, opensAt: '2026-10-25T00:00:00Z' },
    ];
    expect(intakeFrom(doc({ windows }), now)).toMatchObject({ state: 'open', kind: 'admission', opensAt: '2026-10-25T00:00:00Z', closesAt: undefined });
  });
});

describe('ctaTitle and ctaStatus', () => {
  const intro = (key: string, values?: Record<string, string>) => `intro.${t(key, values)}`;
  it('names the pre-admission as before', () => {
    expect(ctaTitle({ state: 'open', kind: 'preAdmission' }, '2027', t)).toBe('title {"session":"2027"}');
    expect(ctaTitle({ state: 'open' }, '2027', t)).toBe('title {"session":"2027"}');
    expect(ctaStatus({ state: 'open', kind: 'preAdmission' }, 'english', intro, t, now)).toBe('intro.statusOpenNoDeadline');
  });
  it('says admission is open, and to fill in the pre-admission form', () => {
    expect(ctaTitle({ state: 'open', kind: 'admission' }, '2027', t)).toBe('titleAdmissionOpen {"session":"2027"}');
    expect(ctaTitle({ state: 'not_open', kind: 'admission' }, '2027', t)).toBe('titleAdmission {"session":"2027"}');
    expect(ctaStatus({ state: 'open', kind: 'admission' }, 'english', intro, t, now)).toBe('admissionHint');
    expect(ctaStatus({ state: 'open', kind: 'admission', closesAt: '2026-12-01T17:59:00Z' }, 'english', intro, t, now)).toMatch(/^admissionHintDeadline /);
  });
  it('counts down the admission’s last week, and announces its opening', () => {
    expect(ctaStatus({ state: 'open', kind: 'admission', closesAt: '2026-11-05T17:59:00Z' }, 'english', intro, t, now)).toMatch(/^intro\.statusClosingSoon /);
    expect(ctaStatus({ state: 'not_open', kind: 'admission', opensAt: '2026-11-10T04:00:00Z' }, 'english', intro, t, now)).toMatch(/^intro\.statusNotOpen /);
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

describe('sessionOrNext', () => {
  it('keeps the form’s session, else names the coming school year', () => {
    expect(sessionOrNext('2027-28', now)).toBe('2027-28');
    expect(sessionOrNext(undefined, now)).toBe('2027');
  });
});

describe('nextChange', () => {
  const at = (iso: string) => new Date(iso);
  it('is the opening time before the form opens, then the closing time', () => {
    const intake: Intake = { state: 'not_open', opensAt: '2026-11-05T00:00:00Z', closesAt: '2026-12-01T00:00:00Z' };
    expect(nextChange(intake, now)).toEqual(at('2026-11-05T00:00:00Z'));
    expect(nextChange(intake, at('2026-11-06T00:00:00Z'))).toEqual(at('2026-12-01T00:00:00Z'));
  });
  it('is nothing once both have passed, or without dates', () => {
    expect(nextChange({ state: 'closed', opensAt: '2026-01-01T00:00:00Z', closesAt: '2026-02-01T00:00:00Z' }, now)).toBeUndefined();
    expect(nextChange({ state: 'open' }, now)).toBeUndefined();
    expect(nextChange({ state: 'open', closesAt: 'not a date' }, now)).toBeUndefined();
  });
});
