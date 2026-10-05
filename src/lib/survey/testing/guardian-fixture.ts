import type { RoundSnapshot } from '../snapshot';
import { t1FixtureSnapshot } from './t1-fixture';

// Sample guardian rounds for local development and end-to-end tests: short versions of the real
// G1/G2 templates (the seed holds the full ones). Same classes as the T1 fixture.

const INTRO = 'দয়া করে পূর্ণ আমানতদারিতার সাথে রিভিউ দিবেন (উপযুক্ত প্রমাণ চাওয়া হতে পারে)।';
const marks = (key: string, text: string, areaKey: string, hint?: string) => ({
  key,
  text,
  ...(hint ? { hint } : {}),
  type: 'marks' as const,
  options: [],
  areaKey,
  required: true,
  allowNA: false,
});
const options = (key: string, text: string, areaKey: string, list: [string, string, number][], extra: { hint?: string; naLabel?: string } = {}) => ({
  key,
  text,
  ...(extra.hint ? { hint: extra.hint } : {}),
  type: 'options' as const,
  options: list.map(([k, label, mark]) => ({ key: k, label, mark })),
  areaKey,
  required: true,
  allowNA: Boolean(extra.naLabel),
  ...(extra.naLabel ? { naLabel: extra.naLabel } : {}),
});

export function g1FixtureSnapshot(takenAt = new Date()): RoundSnapshot {
  const base = t1FixtureSnapshot(takenAt);
  return {
    ...base,
    template: {
      id: 'survey-template-g1-v1',
      version: 1,
      kind: 'G1',
      title: 'ক্লাস পরিচালনার উপর অভিভাবক রিভিউ',
      intro: INTRO,
      commentLabel: 'বিশেষ কোন পরামর্শ ও মন্তব্য',
      layout: 'by-subject',
      scale: [10, 8, 6, 4],
      questions: [
        marks('lesson-learned', 'পড়ানো লেসন আপনার সন্তান শিখেছে কি না?', 'teaching-effectiveness'),
        marks('extra-homework', 'অতিরিক্ত হোমওয়ার্ক দেওয়া হয় কি না?', 'assessment', '১০ = পরিমাণ ঠিক আছে, ৪ = অনেক বেশি'),
        marks('overall-satisfaction', 'সার্বিকভাবে আপনি শিক্ষকের কাজে সন্তুষ্ট কি না?', 'overall-satisfaction'),
      ],
    },
    areas: [
      { key: 'teaching-effectiveness', name: 'পাঠদানের কার্যকারিতা', group: 'teaching' },
      { key: 'assessment', name: 'মূল্যায়ন ও খাতা দেখা', group: 'teaching' },
      { key: 'overall-satisfaction', name: 'সার্বিক সন্তুষ্টি', group: 'teaching' },
    ],
  };
}

export function g2FixtureSnapshot(takenAt = new Date()): RoundSnapshot {
  const base = t1FixtureSnapshot(takenAt);
  return {
    ...base,
    template: {
      id: 'survey-template-g2-v1',
      version: 1,
      kind: 'G2',
      title: 'শিক্ষার্থীর উপর অভিভাবক রিভিউ',
      intro: INTRO,
      commentLabel: 'কোন পরামর্শ ও মন্তব্য',
      scale: [10, 8, 6, 4],
      questions: [
        options('attendance', 'নিয়মিত ক্লাস করে কি না?', 'attendance', [['above-90', 'উপস্থিতি > ৯০%', 10], ['80-90', 'উপস্থিতি ৮০–৯০%', 8], ['70-80', 'উপস্থিতি ৭০–৮০%', 6], ['below-70', 'উপস্থিতি < ৭০%', 4]]),
        options('study-at-home', 'বাসায় নিয়মিত পড়া পড়ে কি না?', 'focus-habits', [['4h', '৪ ঘন্টা +', 10], ['3h', '৩ ঘন্টা +', 8.5], ['2h', '২ ঘন্টা +', 7], ['1h', '১ ঘন্টা +', 5.5], ['under-1h', '১ ঘন্টার কম', 4]], { hint: 'নন ডে কেয়ার শিক্ষার্থীদের জন্য প্রযোজ্য', naLabel: 'প্রযোজ্য নয় (ডে কেয়ার)' }),
        options('devices', 'নিজে থেকে মোবাইল বা ডিভাইস দেখে কি না?', 'interest-home', [['never', 'দেখে না', 10], ['1-2-weekly', 'সপ্তাহে ২/১ বার', 7], ['3-plus-weekly', 'সপ্তাহে ৩/৪ বার বা তার বেশি', 4]]),
        options('peer-complaints', 'ক্লাসে অন্য বাচ্চাদের সাথে মারামারি বা বাজে কথা বলে এই অভিযোগ মাদ্রাসা থেকে আসে কি না?', 'peer-conduct', [['often', 'প্রায়ই আসে', 4], ['sometimes', 'মাঝে মাঝে আসে', 7], ['never', 'আসে না', 10]]),
      ],
    },
    areas: [
      { key: 'attendance', name: 'উপস্থিতি', group: 'student' },
      { key: 'focus-habits', name: 'মনোযোগ ও পড়ার অভ্যাস', group: 'student' },
      { key: 'interest-home', name: 'আগ্রহ ও বাসার অভ্যাস', group: 'student' },
      { key: 'peer-conduct', name: 'সহপাঠীদের সাথে আচরণ', group: 'student' },
    ],
  };
}
