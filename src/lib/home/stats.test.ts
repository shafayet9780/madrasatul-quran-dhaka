import { describe, expect, it } from 'vitest';
import { floorStep, homeStats } from './stats';

const labels = { students: 'শিক্ষার্থী', teachers: 'শিক্ষক', ratio: 'অনুপাত' };

describe('floorStep', () => {
  it('rounds down in tens from 100 and in fives below', () => {
    expect(floorStep(130)).toBe(130);
    expect(floorStep(138)).toBe(130);
    expect(floorStep(100)).toBe(100);
    expect(floorStep(99)).toBe(95);
    expect(floorStep(28)).toBe(25);
    expect(floorStep(4)).toBe(0);
  });
});

describe('homeStats', () => {
  const cms = {
    totalStudents: 130,
    teacherCount: 28,
    graduationRate: 95,
    yearsOfService: 1,
    achievements: [{ value: '200+', title: { bengali: 'প্রতিষ্ঠানে পড়ানো হয়', english: 'institutions teach it' } }],
  };

  it('prints floors with a plus, the ratio from exact values, then achievements, in Bengali digits', () => {
    expect(homeStats(cms, 'bengali', labels)).toEqual([
      { value: '১৩০+', label: 'শিক্ষার্থী', countTo: 130 },
      { value: '২৫+', label: 'শিক্ষক', countTo: 25 },
      { value: '১:৫', label: 'অনুপাত' },
      { value: '২০০+', label: 'প্রতিষ্ঠানে পড়ানো হয়' },
    ]);
  });

  it('uses Latin digits and the English titles in English', () => {
    expect(homeStats(cms, 'english', labels).map((s) => s.value)).toEqual(['130+', '25+', '1:5', '200+']);
    expect(homeStats(cms, 'english', labels)[3].label).toBe('institutions teach it');
  });

  it('never shows the graduation rate or years of service', () => {
    const values = homeStats(cms, 'english', labels).map((s) => s.value);
    expect(values).not.toContain('95');
    expect(values).not.toContain('1');
  });

  it('skips what the CMS does not have', () => {
    expect(homeStats({ totalStudents: 130 }, 'english', labels)).toEqual([{ value: '130+', label: 'শিক্ষার্থী', countTo: 130 }]);
    expect(homeStats(undefined, 'english', labels)).toEqual([]);
    expect(homeStats({ achievements: [{ value: '200+' }] }, 'english', labels)).toEqual([]);
  });
});
