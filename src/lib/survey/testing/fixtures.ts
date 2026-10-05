import type { RoundSource } from '../build-round';

/** Published Sanity data for a small T1 round: 2 questions, play + nursery A/B + six, one teacher. */
export function roundSource(id = 'round-1', slug = 't1-2026-10'): RoundSource {
  return {
    round: {
      _id: id,
      label: 'অক্টোবর ২০২৬',
      slug,
      plannedOpensAt: '2026-10-05T02:00:00Z',
      plannedClosesAt: '2026-10-20T17:59:00Z',
      template: {
        _id: 'survey-template-t1-v1',
        kind: 'T1',
        version: 1,
        title: 'স্টুডেন্ট সম্পর্কে শিক্ষকের রিভিউ',
        intro: null,
        commentLabel: null,
        scale: [10, 8, 6, 4],
        questions: [
          { key: 'attendance', text: 'ক্লাসে নিয়মিত উপস্থিত হয় কি না?', hint: null, type: 'marks', options: null, areaKey: 'attendance', required: true, allowNA: null },
          { key: 'attention', text: 'ক্লাসে মনোযোগী কি না?', hint: null, type: 'marks', options: null, areaKey: 'focus-habits', required: null, allowNA: false },
        ],
      },
    },
    areas: [
      { key: 'attendance', name: 'উপস্থিতি', group: 'student' },
      { key: 'focus-habits', name: 'মনোযোগ ও পড়ার অভ্যাস', group: 'student' },
      { key: 'assessment', name: 'মূল্যায়ন ও খাতা দেখা', group: 'teaching' },
    ],
    classes: [
      { key: 'play', name: 'প্লে', sections: null, subjects: [{ key: 'quran', name: 'কুরআন' }] },
      { key: 'nursery', name: 'নার্সারি', sections: [{ key: 'a', name: 'A' }, { key: 'b', name: 'B' }], subjects: [{ key: 'quran', name: 'কুরআন' }, { key: 'arabic', name: 'আরবি' }] },
      { key: 'six', name: 'ষষ্ঠ', sections: [], subjects: null },
    ],
    teachers: [{ key: 'teacher-1', name: 'উস্তাদ আব্দুল্লাহ' }],
  };
}
