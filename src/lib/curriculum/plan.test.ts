import { describe, expect, it } from 'vitest';
import { axisPos, classOrderProblem, clock, curriculumPlan, dayAxis, splitAtStages, strandRanges, type CurriculumDoc, type LaneLabels } from './plan';
import seed from '../../../scripts/data/cms-coverage-seed.json';
import english from '../../../messages/english.json';
import bengali from '../../../messages/bengali.json';

const doc = seed.curriculum as CurriculumDoc;
const lanes = (m: typeof english) => m.home.plan.segments as LaneLabels;
const plan = curriculumPlan(doc, 'english', lanes(english))!;

describe('the curriculum from the Studio', () => {
  it('groups Nursery to Class 11 into the three stages, with Dakhil and Mutawassita as board blocks', () => {
    expect(plan.stages.map((s) => [s.from, s.to])).toEqual([[0, 3], [3, 7], [7, 13]]);
    expect(plan.blocks).toEqual([{ board: 'dakhil', from: 10, to: 12 }, { board: 'mutawassita', from: 12, to: 13 }]);
    expect(plan.strandEnd).toBe(10);
  });

  it('draws the lanes: the Quran class by class to Class 5, the others to Class 8', () => {
    const lane = (s: string) => plan.strands.find((x) => x.strand === s)!.segments.map((g) => [g.from, g.to, g.label]);
    expect(lane('quran').map(([a, b, l]) => [a, b, l])).toEqual([[0, 1, 'Qaida'], [1, 2, 'Ammapara'], [2, 3, 'Nazera'], [3, 4, 'Hifz 1'], [4, 5, 'Hifz 2'], [5, 6, 'Hifz 3'], [6, 7, 'Shunani']]);
    expect(lane('arabic')).toEqual([[0, 10, 'Arabic language']]);
    expect(lane('islam')).toEqual([[0, 7, 'Islamic studies'], [7, 10, 'Islamic studies, in Arabic']]);
    expect(lane('general')).toEqual([[0, 6, 'Bangla, English, Maths'], [6, 7, '+ Science'], [7, 10, '+ BGS']]);
  });

  it('writes each stage’s hours in both languages, and keeps the splits', () => {
    expect(plan.stages.map((s) => s.hours)).toEqual(['9:00 am to 1:00 pm', '7:00 am to 8:30 pm', '8:00 am to 1:00 pm']);
    expect(curriculumPlan(doc, 'bengali', lanes(bengali))!.stages[1].hours).toBe('সকাল ৭:০০ থেকে রাত ৮:৩০');
    expect(plan.stages.map((s) => s.split)).toEqual([[25, 25, 50], [70, 15, 15], [0, 50, 50]]);
    for (const s of plan.stages) expect(s.split.reduce((a, b) => a + b)).toBe(100);
  });

  it('marks the hifz years limited, the AQVI general books and the book levels', () => {
    expect(plan.classes.flatMap((c, i) => (c.limited ? [i] : []))).toEqual([3, 4, 5, 6]);
    expect(plan.classes.flatMap((c, i) => (c.generalBooks === 'aqvi' ? [i] : []))).toEqual([0, 1]);
    expect(plan.classes.slice(0, 10).map((c) => c.level)).toEqual(['N', 'KG', '1', '2', '3', '4', '5', '6', '7', '8']);
    expect(plan.classes[6].general).toEqual(['bangla', 'english', 'maths', 'science']);
  });

  it('gives each strand its class range', () => {
    expect(strandRanges(plan)).toEqual({
      quran: { from: 'Nursery', to: 'Class 5' },
      arabic: { from: 'Nursery', to: 'Class 8' },
      islam: { from: 'Nursery', to: 'Class 8', inArabicFrom: 'Class 6' },
      general: { from: 'Nursery', to: 'Class 8', toDakhil: true },
    });
  });

  it('is null until it has three stages and every class sits in one, in order', () => {
    expect(curriculumPlan(null, 'english', lanes(english))).toBeNull();
    expect(curriculumPlan({ ...doc, stages: doc.stages!.slice(0, 2) }, 'english', lanes(english))).toBeNull();
    expect(curriculumPlan({ ...doc, classes: [...doc.classes!].reverse() }, 'english', lanes(english))).toBeNull();
  });

  it('says why a class list can’t be drawn', () => {
    expect(classOrderProblem(doc.classes)).toBeNull();
    expect(classOrderProblem([...doc.classes!, { stage: 1 }])).toMatch(/stage order/);
    expect(classOrderProblem(doc.classes!.filter((c) => c.stage !== 2))).toMatch(/three stages/);
    expect(classOrderProblem([...doc.classes!, { stage: 3 }])).toMatch(/come after/);
    expect(classOrderProblem([...doc.classes!.slice(0, 10), { stage: 2, board: 'dakhil' }, ...doc.classes!.slice(10)])).toMatch(/stage order/);
  });

  it('keeps goals with a title and text, the figure in the page’s digits', () => {
    expect(curriculumPlan(doc, 'bengali', lanes(bengali))!.goals[0].figure).toBe('৯০%+');
    expect(plan.goals).toHaveLength(6);
    expect(plan.glance).toHaveLength(5);
  });
});

describe('the hours axis', () => {
  it('runs over the longest day with a tick at 1:00 pm', () => {
    const axis = dayAxis(plan);
    expect(axis).toEqual({ from: 420, to: 1230, ticks: [420, 780, 1230] });
    expect(axis.ticks.map((m) => axisPos(axis, m))).toEqual([0, (360 / 810) * 100, 100]);
    expect(axis.ticks.map((m) => clock(m, 'english', true))).toEqual(['7 am', '1 pm', '8:30 pm']);
    expect(axis.ticks.map((m) => clock(m, 'bengali', true))).toEqual(['সকাল ৭টা', 'দুপুর ১টা', 'রাত ৮:৩০']);
  });
});

describe('splitAtStages', () => {
  it('cuts a segment where stages meet', () => {
    expect(splitAtStages(plan, 3, 4)).toEqual([[3, 4]]);
    expect(splitAtStages(plan, 0, 10)).toEqual([[0, 3], [3, 7], [7, 10]]);
  });
});
