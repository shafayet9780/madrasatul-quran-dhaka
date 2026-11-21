import { describe, expect, it } from 'vitest';
import { checkWindows, currentWindow, type AdmissionWindow } from './windows';

const pre: AdmissionWindow = { kind: 'preAdmission', opensAt: '2026-10-10T00:00:00Z', closesAt: '2026-11-15T18:00:00Z' };
const adm: AdmissionWindow = { kind: 'admission', opensAt: '2026-11-25T00:00:00Z', closesAt: '2027-01-31T18:00:00Z' };
const at = (iso: string) => new Date(iso);

describe('currentWindow', () => {
  const settings = { windows: [adm, pre] };
  it('is the open window while one is open', () => {
    expect(currentWindow(settings, at('2026-10-20T00:00:00Z'))).toEqual({ ...pre, state: 'open' });
    expect(currentWindow(settings, at('2026-12-01T00:00:00Z'))).toEqual({ ...adm, state: 'open' });
  });
  it('is the next window between two, and before the first', () => {
    expect(currentWindow(settings, at('2026-11-20T00:00:00Z'))).toEqual({ ...adm, state: 'not_open' });
    expect(currentWindow(settings, at('2026-10-01T00:00:00Z'))).toEqual({ ...pre, state: 'not_open' });
  });
  it('is the last window, closed, once all have closed', () => {
    expect(currentWindow(settings, at('2027-02-01T00:00:00Z'))).toEqual({ ...adm, state: 'closed' });
  });
  it('stays open without a deadline, until the form is switched off', () => {
    expect(currentWindow({ windows: [pre, { kind: 'admission', opensAt: adm.opensAt }] }, at('2027-06-01T00:00:00Z')).state).toBe('open');
  });
  it('reads the cycle’s own dates as one pre-admission window while there are no windows', () => {
    expect(currentWindow({ opensAt: pre.opensAt, closesAt: pre.closesAt }, at('2026-11-20T00:00:00Z'))).toEqual({ ...pre, state: 'closed' });
    expect(currentWindow({ windows: [] }, at('2026-11-20T00:00:00Z'))).toEqual({ kind: 'preAdmission', state: 'open' });
  });
});

describe('checkWindows', () => {
  it('accepts windows one after another', () => {
    expect(checkWindows([pre, adm])).toEqual([]);
    expect(checkWindows(undefined)).toEqual([]);
  });
  it('asks for a kind and a deadline after the opening', () => {
    expect(checkWindows([{ opensAt: '2026-11-02T00:00:00Z', closesAt: '2026-11-01T00:00:00Z' }])).toEqual([
      'Window 1: choose Pre-admission or Admission.',
      'Window 1: the deadline must be after the opening time.',
    ]);
  });
  it('refuses overlapping windows, an open end included', () => {
    expect(checkWindows([pre, { ...adm, opensAt: '2026-11-15T00:00:00Z' }])).toEqual(['Windows 1 and 2 overlap: one must close before the other opens.']);
    expect(checkWindows([{ kind: 'preAdmission', opensAt: pre.opensAt }, adm])).toHaveLength(1);
  });
});
