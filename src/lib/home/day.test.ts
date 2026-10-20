import { describe, expect, it } from 'vitest';
import bengali from '../../../messages/bengali.json';
import english from '../../../messages/english.json';
import { ROUTINE, routineFor, visibleRoutes } from './day';
import type { TransportRoute } from '@/types/fees';

const bi = (bengali: string, english = bengali) => ({ bengali, english });
const route = (name: string, area: string, stops: string[], visible = true) =>
  ({ _key: name, visible, name: bi(name), area: bi(area), vehicle: 'v', stops: stops.map((s) => ({ _key: s, name: bi(s) })) }) as TransportRoute;

describe('the routine', () => {
  it('has the same parts and steps as the copy in both languages', () => {
    for (const m of [bengali, english]) {
      expect(m.home.day.parts.map((p) => p.steps.length)).toEqual(ROUTINE.map((p) => p.steps.length));
    }
  });
});

describe('routineFor', () => {
  it('uses the launch routine while the CMS has none', () => {
    const parts = routineFor(undefined, 'bengali', bengali.home.day.parts);
    expect(parts.map((p) => p.part)).toEqual(ROUTINE.map((p) => p.part));
    expect(parts[0].steps[0]).toEqual({ kind: 'quran', ...bengali.home.day.parts[0].steps[0] });
  });

  it('uses the CMS routine, leaving out steps and parts without text in this language', () => {
    const cms = [
      { part: 'morning' as const, name: bi('সকাল', 'Morning'), steps: [{ kind: 'quran' as const, time: bi('৭:০০', '7:00'), title: bi('সবক', 'Sabak'), gloss: { bengali: 'নতুন পড়া' } }, { kind: 'meal' as const, time: bi('৮:০০', '8:00') }] },
      { part: 'evening' as const, name: { bengali: 'রাত' }, steps: [{ kind: 'home' as const, time: bi('৮:৩০'), title: bi('ছুটি') }] },
    ];
    expect(routineFor(cms, 'english', [])).toEqual([{ part: 'morning', name: 'Morning', steps: [{ kind: 'quran', time: '7:00', title: 'Sabak' }] }]);
    expect(routineFor(cms, 'bengali', [])[0].steps[0].gloss).toBe('নতুন পড়া');
  });
});

describe('visibleRoutes', () => {
  it('keeps visible routes with stops, in CMS order', () => {
    const routes = [route('M1', 'Mirpur', ['a', 'b']), route('U1', 'Uttara', ['c']), route('U2', 'Uttara', ['e'], false), route('U3', 'Uttara', [])];
    expect(visibleRoutes(routes, 'english')).toEqual([{ name: 'M1', stops: ['a', 'b'] }, { name: 'U1', stops: ['c'] }]);
  });
});
