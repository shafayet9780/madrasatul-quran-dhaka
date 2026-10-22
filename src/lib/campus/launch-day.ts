import type { CampusBeatIn, CampusPhotoIn, CampusStopIn, Group, Sky } from './day';

// The day the Campus page launched with, shown while Studio → Campus: a day has no stops. Times and the order are the
// school's (prospectus of 14 October 2026, the hifz day-care routine); [brackets] wait for the owner's list. Photos
// are real; a stop that needs a photo nobody has taken yet (the floors, the roof, the field) stays hidden until it has
// one. The roof and field take the homepage's play-space photos once Studio has them.

const beat = (bn: string, en: string, partBn: string, partEn: string, sky: Sky, groups: Group[]): CampusBeatIn => ({
  time: { bengali: bn, english: en },
  part: { bengali: partBn, english: partEn },
  sky,
  groups,
});
const bi = (bengali: string, english: string) => ({ bengali, english });

const ALL: Group[] = ['preHifz', 'hifz', 'afterHifz'];
const HIFZ: Group[] = ['hifz'];

const PHOTO = {
  building: { src: '/images/home/campus-building.jpg', alt: bi('ছাদে লাল MQD সাইনসহ আটতলা ভবন', 'The eight-storey building with a red MQD sign on the roof') },
  van: {
    src: '/images/home/school-van.jpg',
    alt: bi('মাদরাসাতুল কুরআনের নাম লেখা স্কুলের গাড়ি, পেছনে ভবন', 'The school van with Madrasatul Quran livery, the building behind'),
    name: bi('স্কুলের নিজস্ব গাড়ি', 'The school’s own van'),
  },
  entranceDay: { src: '/images/campus/entrance-day.jpg', alt: bi('আলোকিত সাইনবোর্ড, গাছ ও ফুলসহ স্কুলের প্রবেশপথ', 'The school entrance with its signboard, trees and flowers') },
  entranceEvening: { src: '/images/home/campus-entrance.jpg', alt: bi('সন্ধ্যায় আলোকিত সাইনবোর্ডসহ প্রবেশপথ', 'School entrance at dusk with its lit signboard') },
};

export const LAUNCH_DAY: CampusStopIn[] = [
  {
    _key: 'approach',
    kind: 'approach',
    label: bi('ভোরে', 'At dawn'),
    place: bi('উত্তরা সেন্টার মেট্রো স্টেশন', 'Uttara Center metro station'),
    title: bi('মাদরাসাতুল কুরআনে একটি দিন', 'A day at Madrasatul Quran'),
    text: bi(
      'স্টেশন থেকে পূর্বে ৬০০ মিটার। চলুন, সকাল থেকে রাত পর্যন্ত ক্যাম্পাসের একটি দিন দেখি।',
      '600 metres east of the station. Come and see a day on campus, from morning to night.',
    ),
    clock: [beat('সকাল', 'Morning', 'ভোর', 'Dawn', 'dawn', [])],
    photos: [PHOTO.building],
  },
  {
    _key: 'arrive',
    kind: 'arrive',
    label: bi('সকাল ৭:০০', '7:00 am'),
    place: bi('পথে', 'On the way'),
    title: bi('স্কুলের গাড়ি আসছে', 'The school van is coming'),
    text: bi(
      'হিফজের ছাত্রছাত্রীদের দিন শুরু সকাল ৭টায়। উত্তরা ও মিরপুর থেকে স্কুলের নিজস্ব মাইক্রো ও অটো আসে।',
      'Hifz students start at 7:00 am. The school’s own microbuses and autos come from Uttara and Mirpur.',
    ),
    clock: [beat('৭:০০', '7:00', 'সকাল', 'Morning', 'dawn', HIFZ)],
    photos: [PHOTO.van],
  },
  {
    _key: 'entrance',
    kind: 'entrance',
    label: bi('সকাল ৭:০০', '7:00 am'),
    place: bi('নিচতলা', 'Ground floor'),
    floor: 0,
    title: bi('প্রবেশপথ', 'The entrance'),
    text: bi('[প্রবেশপথে কী হয়, এক লাইনে]', '[What happens at the entrance, in one line]'),
    clock: [beat('৭:০০', '7:00', 'সকাল', 'Morning', 'morning', HIFZ)],
    photos: [PHOTO.entranceDay],
  },
  {
    _key: 'hifz',
    kind: 'floor',
    label: bi('সকাল ৭:০০', '7:00 am'),
    place: bi('[১ম তলা]', '[1st floor]'),
    floor: 1,
    title: bi('হিফজ: সবক ও সাত সবক', 'Hifz: sabaq and sat sabaq'),
    text: bi('সবক: নতুন পড়া। সাত সবক: গত কয়েক দিনের পড়া।', 'Sabaq: the new lesson. Sat sabaq: the last few days’ lessons.'),
    clock: [beat('৭:০০', '7:00', 'সকাল', 'Morning', 'morning', HIFZ)],
  },
  {
    _key: 'after-hifz',
    kind: 'floor',
    label: bi('সকাল ৮:০০', '8:00 am'),
    place: bi('[২য় তলা]', '[2nd floor]'),
    floor: 2,
    title: bi('আফটার হিফজ: ষষ্ঠ শ্রেণি থেকে মুতাওয়াসসিতা', 'After-Hifz: Class 6 to Mutawassita'),
    text: bi('ক্লাস সকাল ৮টা থেকে দুপুর ১টা।', 'Classes from 8:00 am to 1:00 pm.'),
    clock: [beat('৮:০০', '8:00', 'সকাল', 'Morning', 'morning', ['hifz', 'afterHifz'])],
  },
  {
    _key: 'pre-hifz',
    kind: 'floor',
    label: bi('সকাল ৯:০০', '9:00 am'),
    place: bi('[৩য় তলা]', '[3rd floor]'),
    floor: 3,
    title: bi('প্রি-হিফজ: নার্সারি থেকে প্রথম শ্রেণি', 'Pre-Hifz: Nursery to Class 1'),
    text: bi('ক্লাস সকাল ৯টা থেকে দুপুর ১টা।', 'Classes from 9:00 am to 1:00 pm.'),
    clock: [beat('৯:০০', '9:00', 'সকাল', 'Morning', 'day', ALL)],
  },
  {
    _key: 'hifz-classes',
    kind: 'floor',
    label: bi('সকাল ১০:০০', '10:00 am'),
    place: bi('[৪র্থ তলা]', '[4th floor]'),
    floor: 4,
    title: bi('হিফজের ছাত্রছাত্রীদের আরবি, ইসলাম ও সাধারণ ক্লাস', 'Arabic, Islamic studies and general classes for hifz students'),
    text: bi('প্রতিদিন আড়াই ঘণ্টা।', 'Two and a half hours, every day.'),
    clock: [beat('১০:০০', '10:00', 'সকাল', 'Morning', 'day', ALL)],
  },
  {
    _key: 'rooms',
    kind: 'rooms',
    label: bi('সকাল', 'Morning'),
    place: bi('[তলা]', '[Floor]'),
    title: bi('অফিস ও অন্য কক্ষ', 'The office and other rooms'),
    text: bi('অধ্যক্ষের কক্ষ, সভাকক্ষ [আর যা দেখানোর মতো]।', 'The principal’s room, the meeting room [and what else is worth showing].'),
    clock: [beat('১০:০০', '10:00', 'সকাল', 'Morning', 'day', ALL)],
    photos: [
      { src: '/images/campus/office.jpg', alt: bi('অধ্যক্ষের কক্ষে ডেস্ক, চেয়ার ও কমলা সোফা', 'The principal’s room with a desk, chairs and an orange sofa'), name: bi('অধ্যক্ষের কক্ষ', 'The principal’s room') },
      { src: '/images/campus/meeting.jpg', alt: bi('সভাকক্ষে লম্বা টেবিল ও চেয়ার', 'The meeting room with a long table and chairs'), name: bi('সভাকক্ষ', 'The meeting room') },
      { src: '/images/campus/books.jpg', alt: bi('টেবিলে সাজানো নতুন বছরের পাঠ্যবই', 'New textbooks for the year stacked on a table'), name: bi('নতুন বছরের বই', 'Books for the new year') },
    ],
  },
  {
    _key: 'leave',
    kind: 'leave',
    label: bi('দুপুর ১:০০', '1:00 pm'),
    place: bi('প্রবেশপথ', 'The entrance'),
    title: bi('প্রি-হিফজ ও আফটার হিফজের ছুটি', 'Pre-Hifz and After-Hifz go home'),
    text: bi('দুপুর ১টায় তাদের দিন শেষ। হিফজের ছাত্রছাত্রীরা থাকে রাত পর্যন্ত।', 'Their day ends at 1:00 pm. Hifz students stay until night.'),
    clock: [beat('১:০০', '1:00', 'দুপুর', 'Midday', 'day', ALL), beat('১:০০', '1:00', 'দুপুর', 'Midday', 'day', HIFZ)],
    photos: [PHOTO.van],
  },
  {
    _key: 'midday',
    kind: 'moments',
    label: bi('একই সময়ে, ১২:৩০ থেকে পৌনে ৩টা', 'Meanwhile, 12:30 to 2:45'),
    place: bi('[খাবার ও বিশ্রামের জায়গা]', '[Dining and rest area]'),
    title: bi('সালাত, গোসল, খাবার ও ঘুম', 'Salat, a shower, lunch and a nap'),
    text: bi('হিফজ ডে-কেয়ারে দুপুরের খাবার স্কুলেই। ঘুম পৌনে ৩টা পর্যন্ত।', 'In hifz day-care, lunch is at school. The nap lasts until 2:45.'),
    clock: [
      beat('১২:৩০', '12:30', 'দুপুর', 'Midday', 'day', HIFZ),
      beat('১২:৩০', '12:30', 'দুপুর', 'Midday', 'day', HIFZ),
      beat('১২:৩০', '12:30', 'দুপুর', 'Midday', 'day', HIFZ),
      beat('পৌনে ৩টা', '2:45', 'দুপুর', 'Afternoon', 'afternoon', HIFZ),
    ],
    moments: [
      { icon: 'salat', label: bi('সালাত', 'Salat') },
      { icon: 'bath', label: bi('গোসল', 'Shower') },
      { icon: 'meal', label: bi('খাবার', 'Lunch') },
      { icon: 'sleep', label: bi('ঘুম', 'Nap') },
    ],
  },
  {
    _key: 'revision',
    kind: 'moments',
    label: bi('বিকাল ৩:০০', '3:00 pm'),
    place: bi('[হিফজের কক্ষ]', '[Hifz room]'),
    title: bi('আমুখতা, তিলাওয়াত ও নাজেরা', 'Amukhta, tilawat and nazera'),
    text: bi('আসর পর্যন্ত। আমুখতা: পুরোনো পড়ার পুনরাবৃত্তি।', 'Until Asr. Amukhta: revising earlier lessons.'),
    clock: [beat('৩:০০', '3:00', 'বিকাল', 'Afternoon', 'afternoon', HIFZ)],
    moments: [
      { icon: 'revise', label: bi('আমুখতা', 'Amukhta') },
      { icon: 'read', label: bi('তিলাওয়াত', 'Tilawat') },
      { icon: 'read', label: bi('নাজেরা', 'Nazera') },
    ],
  },
  {
    _key: 'roof',
    kind: 'roof',
    label: bi('আসরের পর', 'After Asr'),
    place: bi('ছাদ', 'The roof'),
    title: bi('মেয়েরা ছাদবাগানে', 'Girls in the roof garden'),
    text: bi('খেলার সময়। মেয়েদের খেলা ভবনের ছাদের বাগানে।', 'Play time. The girls play in the garden on the roof.'),
    clock: [beat('আসরের পর', 'After Asr', 'বিকাল', 'Afternoon', 'late', HIFZ)],
  },
  {
    _key: 'field',
    kind: 'field',
    label: bi('আসরের পর', 'After Asr'),
    place: bi('ভবনের পাশে', 'Beside the building'),
    title: bi('ছেলেরা মাঠে', 'Boys on the field'),
    text: bi('ছেলেদের খেলা ক্যাম্পাস সংলগ্ন মাঠে।', 'The boys play on the field next to the campus.'),
    clock: [beat('আসরের পর', 'After Asr', 'বিকাল', 'Afternoon', 'late', HIFZ)],
  },
  {
    _key: 'evening',
    kind: 'moments',
    label: bi('সন্ধ্যা থেকে রাত ৮:২০', 'Maghrib to 8:20 pm'),
    place: bi('[সালাতের জায়গা ও হিফজের কক্ষ]', '[Salat space and hifz room]'),
    title: bi('মাগরিব, নতুন সবক, ইশা', 'Maghrib, the new sabaq, Isha'),
    text: bi('আজকার ও মাগরিবের সালাত, তারপর নতুন সবক মুখস্থ। ৮:২০-এ ইশার সালাত।', 'Adhkar and Maghrib salat, then memorising the new sabaq. Isha salat at 8:20.'),
    clock: [
      beat('মাগরিব', 'Maghrib', 'সন্ধ্যা', 'Evening', 'dusk', HIFZ),
      beat('মাগরিবের পর', 'After Maghrib', 'রাত', 'Night', 'night', HIFZ),
      beat('৮:২০', '8:20', 'রাত', 'Night', 'night', HIFZ),
    ],
    moments: [
      { icon: 'salat', label: bi('মাগরিব', 'Maghrib') },
      { icon: 'read', label: bi('নতুন সবক', 'New sabaq') },
      { icon: 'salat', label: bi('ইশা', 'Isha') },
    ],
  },
  {
    _key: 'exit',
    kind: 'exit',
    label: bi('রাত ৮:৩০', '8:30 pm'),
    place: bi('প্রবেশপথ', 'The entrance'),
    floor: 0,
    title: bi('বাড়ি ফেরা', 'Home time'),
    text: bi('হিফজ ডে-কেয়ারের ছুটি সবসময় রাত ৮:৩০-এ।', 'Hifz day-care always ends at 8:30 pm.'),
    clock: [beat('৮:৩০', '8:30', 'রাত', 'Night', 'night', HIFZ), beat('৮:৩০', '8:30', 'রাত', 'Night', 'night', [])],
    photos: [PHOTO.entranceEvening],
  },
];

/** The launch day, with the homepage's play-space photos (Studio → Homepage) on the roof and field stops. */
export function launchDay(playSpaces?: { roof?: CampusPhotoIn; field?: CampusPhotoIn }): CampusStopIn[] {
  return LAUNCH_DAY.map((s) => {
    const photo = s.kind === 'roof' || s.kind === 'field' ? playSpaces?.[s.kind] : undefined;
    return photo?.asset ? { ...s, photos: [photo] } : s;
  });
}
