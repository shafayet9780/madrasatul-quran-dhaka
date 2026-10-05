import { describe, expect, it } from 'vitest';
import { buildRound } from './build-round';
import { roundSource as source } from './testing/fixtures';
import { roundStatus, surveyAccess } from './round-status';

const now = new Date('2026-10-04T00:00:00Z');

describe('buildRound', () => {
  it('builds the snapshot and summary from published Sanity data', () => {
    const result = buildRound(source(), { now });
    if (!result.ok) throw new Error(result.errors.join('\n'));
    const { round } = result;
    expect(round).toMatchObject({ sanityRoundId: 'round-1', kind: 'T1', slug: 't1-2026-10', label: 'অক্টোবর ২০২৬' });
    expect(round.opensAt.toISOString()).toBe('2026-10-05T02:00:00.000Z');
    expect(round.snapshot.template.questions[1]).toMatchObject({ required: true, allowNA: false, options: [] });
    expect(round.snapshot.template.questions[0].hint).toBeUndefined();
    // Only areas used by the questions are kept.
    expect(round.snapshot.areas.map((a) => a.key)).toEqual(['attendance', 'focus-habits']);
    expect(round.snapshot.classes[2]).toEqual({ key: 'six', name: 'ষষ্ঠ', sections: [], subjects: [] });
    // play 1×1 + nursery 2×2 + six 1×0
    expect(round.summary).toEqual({ questions: 2, classSections: 4, t1Pairs: 5, areas: 2, teachers: 1 });
  });

  it('lets the admin override the planned dates', () => {
    const dates = { opensAt: new Date('2026-10-04T03:00:00Z'), closesAt: new Date('2026-10-10T17:59:00Z') };
    const result = buildRound(source(), { now, dates });
    expect(result.ok && result.round.closesAt).toEqual(dates.closesAt);
  });

  it('explains everything that blocks opening', () => {
    const s = source();
    s.round!.slug = null;
    s.round!.plannedClosesAt = '2026-10-01T00:00:00Z';
    s.round!.template!.questions![0].areaKey = null;
    s.teachers = [];
    s.classes = s.classes.map((c) => ({ ...c, subjects: [] }));
    const result = buildRound(s, { now });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toEqual([
      'লিংক নাম (Link name) দেওয়া হয়নি।',
      'বন্ধের সময় খোলার সময়ের পরে হতে হবে।',
      'প্রশ্ন ১: এরিয়া বাছাই করা হয়নি।',
      'কোনো সক্রিয় শিক্ষক নেই (Studio → Surveys → Teachers)।',
      'কোনো শ্রেণিতে বিষয় যোগ করা হয়নি (Studio → Surveys → Classes & Subjects)।',
    ]);
  });

  it('rejects a round whose closing time has passed', () => {
    const result = buildRound(source(), { now: new Date('2026-10-21T00:00:00Z') });
    expect(!result.ok && result.errors).toEqual(['বন্ধের সময় পেরিয়ে গেছে; সময় বদলান।']);
  });

  it('reports an unpublished round', () => {
    expect(buildRound({ ...source(), round: null }, { now })).toEqual({
      ok: false,
      errors: ['রাউন্ডটি Studio-তে প্রকাশ (Publish) করা হয়নি।'],
    });
  });

  it('surfaces malformed Studio data instead of throwing', () => {
    const s = source();
    s.classes[0].key = 'Play Group';
    const result = buildRound(s, { now });
    expect(!result.ok && result.errors[0]).toMatch(/^Studio-র তথ্যে সমস্যা: classes › 0 › key/);
  });
});

describe('buildRound for guardian templates', () => {
  const now = new Date('2026-10-05T00:00:00Z');
  const withTemplate = (patch: Record<string, unknown>, classes?: ReturnType<typeof source>['classes']) => {
    const base = source();
    return { ...base, ...(classes ? { classes } : {}), round: { ...base.round!, template: { ...base.round!.template!, ...patch } } };
  };
  const withSubjects = source().classes.map((c) => ({ ...c, subjects: c.subjects ?? [{ key: 'math', name: 'গণিত' }] }));

  it('snapshots the G1 layout, defaulting to one subject per screen', () => {
    const byDefault = buildRound(withTemplate({ kind: 'G1' }, withSubjects), { now });
    expect(byDefault.ok && byDefault.round.snapshot.template.layout).toBe('by-subject');
    const byQuestion = buildRound(withTemplate({ kind: 'G1', layout: 'by-question' }, withSubjects), { now });
    expect(byQuestion.ok && byQuestion.round.snapshot.template.layout).toBe('by-question');
    const t1 = buildRound(withTemplate({ layout: 'by-question' }), { now });
    expect(t1.ok && t1.round.snapshot.template.layout).toBeUndefined();
  });

  it('needs subjects in every class for G1', () => {
    const result = buildRound(withTemplate({ kind: 'G1' }), { now });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.join(' ')).toContain('ষষ্ঠ');
  });

  it('rejects N/A on T1 questions, a reserved option key and options without marks', () => {
    const questions = [
      { key: 'q1', text: 'প্রশ্ন', type: 'marks', areaKey: 'attendance', allowNA: true },
      { key: 'q2', text: 'প্রশ্ন', type: 'options', areaKey: 'attendance', options: [{ key: 'na', label: 'ক', mark: 10 }, { key: 'b', label: 'খ', mark: null }] },
    ];
    const result = buildRound(withTemplate({ questions }), { now });
    expect(result.ok).toBe(false);
    const text = !result.ok ? result.errors.join(' | ') : '';
    expect(text).toContain('প্রযোজ্য নয়');
    expect(text).toContain('"na"');
    expect(text).toContain('মার্ক দিন');
  });
});

describe('roundStatus', () => {
  const round = { opensAt: new Date('2026-10-05T00:00:00Z'), closesAt: new Date('2026-10-20T00:00:00Z') };
  it('is scheduled, open, then closed', () => {
    expect(roundStatus(round, new Date('2026-10-04T00:00:00Z'))).toBe('scheduled');
    expect(roundStatus(round, new Date('2026-10-05T00:00:00Z'))).toBe('open');
    expect(roundStatus(round, new Date('2026-10-20T00:00:00Z'))).toBe('closed');
  });
  it('treats a round closed before it opened as closed', () => {
    const closedEarly = { opensAt: new Date('2026-10-05T00:00:00Z'), closesAt: new Date('2026-10-03T00:00:00Z') };
    expect(roundStatus(closedEarly, new Date('2026-10-04T00:00:00Z'))).toBe('closed');
  });
});

describe('surveyAccess', () => {
  const round = { opensAt: new Date('2026-10-05T00:00:00Z'), closesAt: new Date('2026-10-20T00:00:00Z') };
  it('allows a 10-minute grace after closing', () => {
    expect(surveyAccess(round, new Date('2026-10-04T23:00:00Z'))).toBe('scheduled');
    expect(surveyAccess(round, new Date('2026-10-10T00:00:00Z'))).toBe('open');
    expect(surveyAccess(round, new Date('2026-10-20T00:09:59Z'))).toBe('grace');
    expect(surveyAccess(round, new Date('2026-10-20T00:10:00Z'))).toBe('closed');
  });
});
