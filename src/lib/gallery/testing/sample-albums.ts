import type { AlbumIn, AlbumPhotoIn } from '../albums';

// The gallery in the local preview (ADMISSIONS_LOCAL=1), where there is no Sanity: a few albums made of the site's own
// photos, across two years, with a story, videos (made-up ids: the covers stay blank) and an all-time album. Dev and
// e2e only (e2e/gallery.spec.ts); the live site reads Studio → Gallery.

const bi = (bengali: string, english: string) => ({ bengali, english });
const photo = (key: string, file: string, ratio: number, alt: [string, string], caption?: [string, string]): AlbumPhotoIn => ({
  _key: key,
  src: `/images/${file}`,
  ratio,
  alt: bi(...alt),
  ...(caption ? { caption: bi(...caption) } : {}),
});

const meeting = photo('meeting', 'campus/meeting.jpg', 1.333, ['সভাকক্ষে শিক্ষকেরা', 'Teachers in the meeting room'], ['শিক্ষকদের কথা', 'The teachers speak']);
const office = photo('office', 'campus/office.jpg', 1.333, ['অফিস কক্ষ', 'The office']);
const entrance = photo('entrance', 'campus/entrance-day.jpg', 1.333, ['দিনের বেলা প্রবেশপথ', 'The entrance by day'], ['প্রবেশপথ', 'The entrance']);
const teachers = photo('teachers', 'home/why-teachers.jpg', 1.385, ['ক্লাসে শিক্ষক', 'A teacher in class']);
const van = photo('van', 'home/school-van.jpg', 0.75, ['স্কুলের গাড়ি', 'The school van'], ['সকালের গাড়ি', 'The morning van']);
const books = photo('books', 'campus/books.jpg', 1.332, ['বইয়ের তাক', 'Bookshelves']);
const classroom = photo('classroom', 'home/campus-classroom.jpg', 1.333, ['শ্রেণিকক্ষে শিক্ষার্থীরা', 'Students in a classroom']);
const building = photo('building', 'home/campus-building.jpg', 1.333, ['স্কুল ভবন', 'The school building']);

export const SAMPLE_ALBUMS: AlbumIn[] = [
  {
    _id: 'sample-parents-day',
    slug: 'parents-day-2026',
    title: bi('অভিভাবক সমাবেশ', 'Parents’ day'),
    date: '2026-10-11',
    topic: 'events',
    summary: bi('[দুই লাইনের সারকথা: কারা এসেছিলেন, কী নিয়ে কথা হলো]', '[Two lines: who came and what was discussed]'),
    photos: [meeting, office, entrance, teachers, van, books],
    photoCount: 6,
    videos: [
      { _key: 'whole', url: 'https://youtu.be/sample00001', title: bi('সমাবেশের পুরো ভিডিও', 'The whole meeting'), length: '8:20' },
      { _key: 'van', url: 'https://youtube.com/shorts/sample00002', title: bi('সকালের ভ্যান', 'The morning van'), length: '0:38' },
    ],
    story: bi('[অফিস বা শ্রেণিশিক্ষকের লেখা, দুই-তিন লাইন: দিনটি কেমন ছিল।]\n\n[দ্বিতীয় অনুচ্ছেদ, ইচ্ছে হলে।]', '[Two or three lines by the office or the class teacher: how the day went.]\n\n[A second paragraph, if wanted.]'),
    quote: { text: bi('[শিক্ষকের এক বা দুই লাইনের কথা, হুবহু]', '[A teacher’s words, one or two lines]'), by: bi('[শিক্ষকের নাম], [পদ]', '[Teacher’s name], [role]') },
  },
  {
    _id: 'sample-painting',
    slug: 'painting-morning',
    title: bi('রং-তুলির সকাল', 'A morning of painting'),
    date: '2026-09-24',
    topic: 'classes',
    photos: [classroom, books, teachers],
    photoCount: 3,
  },
  {
    _id: 'sample-nursery-video',
    slug: 'nursery-morning',
    title: bi('নার্সারির ক্লাসে একটি সকাল', 'A morning in Nursery'),
    date: '2026-09-09',
    topic: 'classes',
    videos: [{ _key: 'nursery', url: 'https://www.youtube.com/watch?v=sample00003', title: bi('নার্সারির ক্লাসে একটি সকাল', 'A morning in Nursery'), length: '1:40' }],
  },
  {
    _id: 'sample-quran-2025',
    slug: 'quran-recitation-2025',
    title: bi('কুরআন তিলাওয়াত', 'Quran recitation'),
    date: '2025-12-04',
    topic: 'quran',
    photos: [meeting, classroom],
    photoCount: 2,
  },
  {
    _id: 'sample-campus',
    slug: 'campus',
    title: bi('ক্যাম্পাস', 'The campus'),
    evergreen: true,
    topic: 'campus',
    photos: [building, entrance, office, books],
    photoCount: 4,
  },
];
