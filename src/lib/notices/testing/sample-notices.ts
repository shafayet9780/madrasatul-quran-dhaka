import type { NoticeIn } from '../notices';

// The notice board in the local preview (ADMISSIONS_LOCAL=1), where there is no Sanity: notices across two years, of
// every type, one pinned, one with no English, with a PDF (a made-up address) and a picture (one of the site's own
// photos standing in for a scan). Dev and e2e only (e2e/notices.spec.ts); the live site reads Studio → Notices.

const bi = (bengali: string, english?: string) => ({ bengali, english });
const pdf = (key: string, name: [string, string], size: number) => ({ _type: 'file' as const, _key: key, url: `https://example.com/${key}.pdf`, size, name: bi(...name) });
const scan = { _type: 'image' as const, _key: 'scan', src: '/images/campus/books.jpg', alt: bi('সই করা নোটিশ', 'The signed notice'), ratio: 1.332 };

export const SAMPLE_NOTICES: NoticeIn[] = [
  {
    _id: 'sample-parents-meeting',
    number: { year: 2026, serial: 19 },
    title: bi('অভিভাবক সমাবেশ, ২৪ অক্টোবর শনিবার', 'Parents’ meeting, Saturday 24 October'),
    date: '2026-10-18',
    type: 'general',
    body: bi('সকল অভিভাবককে জানানো যাচ্ছে যে, [সময়] স্কুল ভবনে অভিভাবক সমাবেশ হবে।\n\nপ্রত্যেক শিক্ষার্থীর একজন অভিভাবককে আসার অনুরোধ করা হলো।', 'All parents are informed that a parents’ meeting will be held at the school at [time].\n\nOne parent of each student is asked to come.'),
  },
  {
    _id: 'sample-holiday',
    number: { year: 2026, serial: 18 },
    title: bi('সরকারি ছুটিতে স্কুল বন্ধ, [তারিখ]'),
    date: '2026-10-15',
    type: 'holiday',
    body: bi('সকল অভিভাবক ও শিক্ষার্থীকে জানানো যাচ্ছে যে, [ছুটির নাম] উপলক্ষে [তারিখ] স্কুল ও অফিস বন্ধ থাকবে।\n\nপরদিন থেকে ক্লাস ও ভ্যান চলবে আগের সময়ে।'),
  },
  {
    _id: 'sample-exam-routine',
    number: { year: 2026, serial: 17 },
    title: bi('অর্ধবার্ষিক পরীক্ষার রুটিন', 'Half-yearly exam routine'),
    date: '2026-10-12',
    type: 'exam',
    pinnedUntil: '2099-12-31',
    body: bi('সকল অভিভাবক ও শিক্ষার্থীকে জানানো যাচ্ছে যে, অর্ধবার্ষিক পরীক্ষা [তারিখ] থেকে শুরু হবে। প্রতিটি শ্রেণির বিষয় ও সময় সংযুক্ত রুটিনে দেওয়া আছে।', 'All parents and students are informed that the half-yearly exams begin on [date]. Each class’s subjects and times are in the attached routine.'),
    attachments: [pdf('routine', ['অর্ধবার্ষিক পরীক্ষার রুটিন', 'Half-yearly exam routine'], 245_760), scan],
  },
  {
    _id: 'sample-results',
    number: { year: 2026, serial: 16 },
    title: bi('প্রথম সাময়িক পরীক্ষার ফলাফল প্রকাশ', 'First term results'),
    date: '2026-10-08',
    type: 'exam',
    body: bi('রিপোর্ট কার্ড [তারিখ] থেকে অফিসে পাওয়া যাবে।', 'Report cards can be collected from the office from [date].'),
  },
  {
    _id: 'sample-assessment',
    number: { year: 2026, serial: 15 },
    title: bi('প্রি-অ্যাডমিশন ২০২৭: অ্যাসেসমেন্টের নিয়ম', 'Pre-admission 2027: the assessment'),
    date: '2026-10-05',
    type: 'admission',
    attachments: [pdf('assessment', ['অ্যাসেসমেন্টের নিয়ম', 'The assessment'], 180_224)],
  },
  {
    _id: 'sample-recruitment',
    number: { year: 2026, serial: 13 },
    title: bi('শিক্ষক নিয়োগ বিজ্ঞপ্তি', 'Teachers wanted'),
    date: '2026-09-28',
    type: 'general',
    body: bi('[বিষয়] শিক্ষক নেওয়া হবে। যোগ্যতা ও আবেদনের নিয়ম বিজ্ঞপ্তিতে।', '[Subject] teachers are wanted. The qualifications and how to apply are in the notice.'),
    attachments: [scan],
  },
  {
    _id: 'sample-old-holiday',
    number: { year: 2025, serial: 31 },
    title: bi('শীতকালীন ছুটি', 'Winter holiday'),
    date: '2025-12-20',
    type: 'holiday',
    body: bi('[তারিখ] থেকে [তারিখ] পর্যন্ত স্কুল বন্ধ থাকবে।', 'The school is closed from [date] to [date].'),
  },
];
