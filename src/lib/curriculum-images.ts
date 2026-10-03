import type { MultilingualText } from '@/types/sanity';

// Each key matches a curriculum card, so unrelated subjects do not share a scene.
const images: Record<string, { file: string; alt: MultilingualText }> = {
  integration: {
    file: 'integration-subject',
    alt: {
      english:
        'Illustrative photo: Quran study alongside mathematics and science materials',
      bengali: 'প্রতীকী ছবি: গণিত ও বিজ্ঞানের সামগ্রীর পাশাপাশি কুরআন অধ্যয়ন',
    },
  },
  languages: {
    file: 'languages-subject',
    alt: {
      english:
        'Illustrative photo: Listening and speaking equipment beside reading and writing materials',
      bengali:
        'প্রতীকী ছবি: পড়া ও লেখার সামগ্রীর পাশে শোনা ও বলার অনুশীলনের সরঞ্জাম',
    },
  },
  'arabic-medium': {
    file: 'arabic-medium-subject',
    alt: {
      english:
        'Illustrative photo: Arabic lesson on a classroom whiteboard with an Arabic studies book',
      bengali: 'প্রতীকী ছবি: শ্রেণিকক্ষের বোর্ডে আরবি পাঠ ও আরবি শিক্ষার বই',
    },
  },
  'higher-education': {
    file: 'higher-education-subject',
    alt: {
      english:
        'Illustrative photo: SSC and Dakhil examination preparation materials',
      bengali: 'প্রতীকী ছবি: এসএসসি ও দাখিল পরীক্ষার প্রস্তুতির সামগ্রী',
    },
  },
  hifz: {
    file: 'hifz-subject',
    alt: {
      english:
        'Illustrative photo: Quran memorization study with a Hifz revision chart',
      bengali:
        'প্রতীকী ছবি: হিফজের পুনরাবৃত্তি তালিকাসহ কুরআন মুখস্থের অধ্যয়ন',
    },
  },
  transport: {
    file: 'transport-realistic',
    alt: {
      english:
        'Illustrative photo: School transport vehicle outside a school entrance',
      bengali: 'প্রতীকী ছবি: স্কুলের প্রবেশপথে পরিবহন গাড়ি',
    },
  },
  hadith: {
    file: 'hadith-subject',
    alt: {
      english:
        'Illustrative photo: Hadith study book and memorization revision materials',
      bengali: 'প্রতীকী ছবি: হাদিসের বই ও মুখস্থের পুনরাবৃত্তির সামগ্রী',
    },
  },
  translation: {
    file: 'translation-subject',
    alt: {
      english:
        'Illustrative photo: Arabic and Bengali translation practice beside a Quran',
      bengali: 'প্রতীকী ছবি: কুরআনের পাশে আরবি ও বাংলা অনুবাদের অনুশীলন',
    },
  },
  ethics: {
    file: 'ethics-subject',
    alt: {
      english:
        'Illustrative photo: Classroom sharing supplies and a respect, kindness and honesty reminder',
      bengali:
        'প্রতীকী ছবি: শ্রেণিকক্ষে ভাগাভাগির সামগ্রী ও সম্মান, দয়া এবং সততার স্মারক',
    },
  },
  history: {
    file: 'history-subject',
    alt: {
      english:
        'Illustrative photo: Islamic history book, geography map and timeline study materials',
      bengali:
        'প্রতীকী ছবি: ইসলামী ইতিহাসের বই, ভূগোলের মানচিত্র ও সময়রেখা অধ্যয়নের সামগ্রী',
    },
  },
  recreation: {
    file: 'recreation-realistic',
    alt: {
      english:
        'Illustrative photo: School terrace play space with a football and plants',
      bengali: 'প্রতীকী ছবি: ফুটবল ও গাছসহ স্কুলের ছাদে খেলার জায়গা',
    },
  },
  quran: {
    file: 'quran-study-realistic',
    alt: {
      english:
        'Illustrative photo: Closed Quran placed respectfully on a wooden rehal',
      bengali: 'প্রতীকী ছবি: কাঠের রেহালে সম্মানের সঙ্গে রাখা বন্ধ কুরআন',
    },
  },
  arabic: {
    file: 'arabic-subject',
    alt: {
      english:
        'Illustrative photo: Arabic alphabet reading and writing practice',
      bengali: 'প্রতীকী ছবি: আরবি বর্ণমালা পড়া ও লেখার অনুশীলন',
    },
  },
  aqidah: {
    file: 'aqidah-subject',
    alt: {
      english: 'Illustrative photo: Aqidah and faith study materials',
      bengali: 'প্রতীকী ছবি: আকিদাহ ও ইমান অধ্যয়নের সামগ্রী',
    },
  },
  fiqh: {
    file: 'fiqh-subject',
    alt: {
      english:
        'Illustrative photo: Ablution practice area and a Fiqh study folder',
      bengali: 'প্রতীকী ছবি: অজুর অনুশীলনের স্থান ও ফিকহ শিক্ষার ফোল্ডার',
    },
  },
};

export function curriculumImage(key: string) {
  const image = images[key] || images.integration;
  return { src: `/images/curriculum/${image.file}.webp`, alt: image.alt };
}
