import { describe, expect, it } from 'vitest';
import { buildCoverage, deviceLabel, duplicateGroups, type BatchSummary } from './coverage';
import { t1FixtureSnapshot } from './testing/t1-fixture';

const snapshot = t1FixtureSnapshot();
// Play teaches only Quran in this test.
snapshot.classes[0].subjects = snapshot.classes[0].subjects.filter((s) => s.key === 'quran');

const batch = (over: Partial<BatchSummary>): BatchSummary => ({
  id: Math.random().toString(36),
  status: 'submitted',
  supersededBy: null,
  duplicateFlag: false,
  teacherName: 'উস্তাদ আব্দুল্লাহ',
  classKey: 'nursery',
  sectionKey: 'a',
  subjectKey: 'quran',
  updatedAt: new Date(),
  submittedAt: new Date(),
  ...over,
});

describe('buildCoverage', () => {
  const batches = [
    batch({}),
    batch({ id: 'old', supersededBy: 'x', subjectKey: 'arabic' }),
    batch({ subjectKey: 'bangla', status: 'draft', submittedAt: null }),
    batch({ subjectKey: 'math', duplicateFlag: true }),
    batch({ subjectKey: 'math', duplicateFlag: true, teacherName: 'উস্তাদ হামযা' }),
  ];
  const coverage = buildCoverage(snapshot, batches);
  const nurseryA = coverage.rows.find((r) => r.classKey === 'nursery' && r.sectionKey === 'a')!;
  const state = (subject: string) => nurseryA.cells.find((c) => c.subjectKey === subject)!.state;

  it('classifies each class-section × subject', () => {
    expect(state('quran')).toBe('done');
    expect(state('arabic')).toBe('todo'); // only a superseded batch
    expect(state('bangla')).toBe('draft');
    expect(state('math')).toBe('dup');
    expect(nurseryA.cells.find((c) => c.subjectKey === 'math')!.teachers).toEqual(['উস্তাদ আব্দুল্লাহ', 'উস্তাদ হামযা']);
  });

  it('marks subjects a class does not have as not applicable and counts coverage', () => {
    const play = coverage.rows.find((r) => r.classKey === 'play')!;
    expect(play.cells.filter((c) => c.state === 'na')).toHaveLength(4);
    // 13 class-sections: play has 1 subject, the other 12 have 5 → 61 pairs; quran + math covered.
    expect(coverage.total).toBe(61);
    expect(coverage.covered).toBe(2);
  });
});

describe('buildCoverage for a subject taught by level', () => {
  const levelled = t1FixtureSnapshot();
  levelled.classes = [{ key: 'two', name: 'দ্বিতীয়', sections: [], subjects: [{ key: 'arabic', name: 'আরবি', byLevel: true }] }];
  const roster = ['s1', 's2', 's3'].map((erpId) => ({ erpId, classKey: 'two', sectionKey: '' }));
  const cell = (batches: BatchSummary[], rated: string[]) =>
    buildCoverage(levelled, batches, { roster, rated: new Map([['arabic', new Set(rated)]]) }).rows[0].cells[0];
  const at = { classKey: 'two', sectionKey: '', subjectKey: 'arabic' };

  it('is partial until every student has a counted rating, from any teacher', () => {
    expect(cell([], [])).toMatchObject({ state: 'todo', progress: { done: 0, total: 3 } });
    expect(cell([batch({ ...at })], ['s1', 's2'])).toMatchObject({ state: 'partial', progress: { done: 2, total: 3 } });
    const both = cell([batch({ ...at }), batch({ ...at, teacherName: 'উস্তাদ হামযা' })], ['s1', 's2', 's3']);
    expect(both).toMatchObject({ state: 'done', teachers: ['উস্তাদ আব্দুল্লাহ', 'উস্তাদ হামযা'] });
  });

  it('counts only finished cells as covered', () => {
    const coverage = buildCoverage(levelled, [batch({ ...at })], { roster, rated: new Map([['arabic', new Set(['s1'])]]) });
    expect([coverage.covered, coverage.total]).toEqual([0, 1]);
  });
});

describe('duplicateGroups', () => {
  it('returns current batches that share a class and subject', () => {
    const groups = duplicateGroups([
      batch({ id: 'a', duplicateFlag: true }),
      batch({ id: 'b', teacherName: 'অন্য', duplicateFlag: true }),
      batch({ id: 'c', subjectKey: 'math' }),
      // Kept both earlier: no longer a duplicate to resolve.
      batch({ id: 'd', subjectKey: 'bangla' }),
      batch({ id: 'e', subjectKey: 'bangla', teacherName: 'অন্য' }),
    ]);
    expect(groups.map((g) => g.map((b) => b.id))).toEqual([['a', 'b']]);
  });
});

describe('deviceLabel', () => {
  it('names common phones and browsers', () => {
    expect(deviceLabel('Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36')).toBe('Android · Chrome');
    expect(deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1')).toBe('iPhone · Safari');
    expect(deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36 Edg/120')).toBe('Windows · Edge');
    expect(deviceLabel(null)).toBe('');
  });
});
