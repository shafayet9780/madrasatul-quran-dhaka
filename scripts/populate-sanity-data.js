/**
 * JavaScript version of the Sanity data population script
 * This can run without TypeScript dependencies
 */

const { createClient } = require('@sanity/client');
const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// Site Settings
const siteSettings = {
  _type: 'siteSettings',
  _id: 'siteSettings',
  title: {
    bengali: 'মাদরাসাতুল কুরআন',
    english: 'Madrasatul Quran'
  },
  description: {
    bengali: 'ইসলামী শিক্ষা ও আধুনিক শিক্ষায় উৎকর্ষতা - কুরআন ও সুন্নাহর আলোকে চরিত্র গঠন এবং আধুনিক শিক্ষায় শ্রেষ্ঠত্ব অর্জন',
    english: 'Excellence in Islamic Education & Modern Learning - Character building in the light of Quran and Sunnah and achieving excellence in modern education'
  },
  contactInfo: {
    address: {
      bengali: '১২৩ ইসলামিক এডুকেশন স্ট্রিট, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ',
      english: '123 Islamic Education Street, Dhanmondi, Dhaka-1205, Bangladesh'
    },
    phone: [
      {
        label: {
          bengali: 'প্রধান কার্যালয়',
          english: 'Main Office'
        },
        number: '+880 2-9876543'
      },
      {
        label: {
          bengali: 'ভর্তি কার্যালয়',
          english: 'Admission Office'
        },
        number: '+880 2-9876544'
      }
    ],
    email: [
      {
        label: {
          bengali: 'সাধারণ তথ্য',
          english: 'General Information'
        },
        address: 'info@madrasatulquran.edu.bd'
      },
      {
        label: {
          bengali: 'ভর্তি',
          english: 'Admissions'
        },
        address: 'admission@madrasatulquran.edu.bd'
      }
    ],
    officeHours: {
      bengali: 'শনিবার - বৃহস্পতিবার: সকাল ৯:০০ - বিকাল ৪:০০',
      english: 'Saturday - Thursday: 9:00 AM - 4:00 PM'
    }
  },
  socialMedia: {
    facebook: 'https://facebook.com/madrasatulquran',
    youtube: 'https://youtube.com/@madrasatulquran',
    instagram: 'https://instagram.com/madrasatulquran'
  },
  admissionInfo: {
    admissionPhone: '+880 2-9876544',
    admissionEmail: 'admission@madrasatulquran.edu.bd',
    admissionHours: {
      bengali: 'শনিবার - বৃহস্পতিবার: সকাল ৯:০০ - বিকাল ৫:০০',
      english: 'Saturday - Thursday: 9:00 AM - 5:00 PM'
    }
  },
  statistics: {
    yearsOfService: 25,
    totalStudents: 850,
    graduationRate: 98,
    teacherCount: 45,
    achievements: [
      {
        title: {
          bengali: 'জাতীয় পুরস্কার',
          english: 'National Awards'
        },
        value: '15'
      },
      {
        title: {
          bengali: 'বৃত্তিপ্রাপ্ত শিক্ষার্থী',
          english: 'Scholarship Recipients'
        },
        value: '120+'
      }
    ]
  }
};

// Sample Pages
const pages = [
  {
    _type: 'page',
    title: {
      bengali: 'স্কুলের ইতিহাস',
      english: 'School History'
    },
    slug: {
      bengali: { current: 'school-history' },
      english: { current: 'school-history' }
    },
    content: {
      bengali: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'মাদরাসাতুল কুরআন ১৯৯৮ সালে প্রতিষ্ঠিত হয়েছিল একটি ছোট স্বপ্ন নিয়ে - ইসলামী মূল্যবোধ এবং আধুনিক শিক্ষার সমন্বয়ে একটি আদর্শ শিক্ষা প্রতিষ্ঠান গড়ে তোলা।'
            }
          ]
        }
      ],
      english: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Madrasatul Quran was established in 1998 with a small dream - to create an ideal educational institution that combines Islamic values with modern education.'
            }
          ]
        }
      ]
    },
    publishedAt: new Date().toISOString()
  }
];

// Sample News Events
const newsEvents = [
  {
    _type: 'newsEvent',
    title: {
      bengali: 'বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৫',
      english: 'Annual Sports Competition 2025'
    },
    slug: {
      bengali: { current: 'annual-sports-2025' },
      english: { current: 'annual-sports-2025' }
    },
    excerpt: {
      bengali: 'আমাদের বার্ষিক ক্রীড়া প্রতিযোগিতা অনুষ্ঠিত হবে ১৫ ফেব্রুয়ারি ২০২৫ তারিখে। সকল শ্রেণীর শিক্ষার্থীরা অংশগ্রহণ করবে।',
      english: 'Our annual sports competition will be held on February 15, 2025. Students from all classes will participate in various sporting events.'
    },
    content: {
      bengali: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'মাদরাসাতুল কুরআনের বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৫ অনুষ্ঠিত হবে আগামী ১৫ ফেব্রুয়ারি। এই প্রতিযোগিতায় ফুটবল, ক্রিকেট, দৌড়, লাফ এবং অন্যান্য খেলাধুলার আয়োজন থাকবে। সকল শিক্ষার্থী ও অভিভাবকদের উপস্থিতি কামনা করা হচ্ছে।'
            }
          ]
        }
      ],
      english: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Madrasatul Quran\'s Annual Sports Competition 2025 will be held on February 15. The competition will feature football, cricket, running, jumping, and other sporting events. All students and parents are cordially invited to attend.'
            }
          ]
        }
      ]
    },
    eventDate: '2025-02-15',
    category: 'event',
    featured: true,
    publishedAt: new Date().toISOString()
  },
  {
    _type: 'newsEvent',
    title: {
      bengali: 'জাতীয় কুরআন প্রতিযোগিতায় প্রথম স্থান',
      english: 'First Place in National Quran Competition'
    },
    slug: {
      bengali: { current: 'quran-competition-first-place' },
      english: { current: 'quran-competition-first-place' }
    },
    excerpt: {
      bengali: 'আমাদের শিক্ষার্থী মোহাম্মদ আব্দুল্লাহ জাতীয় কুরআন প্রতিযোগিতায় প্রথম স্থান অধিকার করেছে।',
      english: 'Our student Mohammad Abdullah has secured first place in the National Quran Competition.'
    },
    content: {
      bengali: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'আমাদের অষ্টম শ্রেণীর শিক্ষার্থী মোহাম্মদ আব্দুল্লাহ জাতীয় কুরআন তিলাওয়াত প্রতিযোগিতায় প্রথম স্থান অধিকার করে আমাদের গর্বিত করেছে। এই অর্জন আমাদের ইসলামী শিক্ষার মানের প্রমাণ।'
            }
          ]
        }
      ],
      english: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Our eighth-grade student Mohammad Abdullah has made us proud by securing first place in the National Quran Recitation Competition. This achievement is proof of the quality of our Islamic education.'
            }
          ]
        }
      ]
    },
    category: 'achievement',
    featured: true,
    publishedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _type: 'newsEvent',
    title: {
      bengali: 'নতুন বিজ্ঞান গবেষণাগার উদ্বোধন',
      english: 'New Science Laboratory Inauguration'
    },
    slug: {
      bengali: { current: 'science-lab-inauguration' },
      english: { current: 'science-lab-inauguration' }
    },
    excerpt: {
      bengali: 'আধুনিক যন্ত্রপাতি সহ নতুন বিজ্ঞান গবেষণাগার উদ্বোধন করা হয়েছে।',
      english: 'A new science laboratory with modern equipment has been inaugurated.'
    },
    content: {
      bengali: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'শিক্ষার্থীদের ব্যবহারিক শিক্ষার জন্য অত্যাধুনিক যন্ত্রপাতি সহ একটি নতুন বিজ্ঞান গবেষণাগার উদ্বোধন করা হয়েছে। এই গবেষণাগারে পদার্থবিজ্ঞান, রসায়ন এবং জীববিজ্ঞানের পরীক্ষা-নিরীক্ষার সুবিধা রয়েছে।'
            }
          ]
        }
      ],
      english: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'A new science laboratory with state-of-the-art equipment has been inaugurated for practical education of students. This laboratory has facilities for physics, chemistry, and biology experiments.'
            }
          ]
        }
      ]
    },
    category: 'news',
    featured: false,
    publishedAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    _type: 'newsEvent',
    title: {
      bengali: '২০২৫-২৬ শিক্ষাবর্ষে ভর্তি চলছে',
      english: 'Admission Open for Academic Year 2025-26'
    },
    slug: {
      bengali: { current: 'admission-open-2025-26' },
      english: { current: 'admission-open-2025-26' }
    },
    excerpt: {
      bengali: 'নতুন শিক্ষাবর্ষের জন্য ভর্তির আবেদন চলছে। সীমিত আসন।',
      english: 'Applications are now open for the new academic year. Limited seats available.'
    },
    content: {
      bengali: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: '২০২৫-২৬ শিক্ষাবর্ষের জন্য প্রাক-প্রাথমিক থেকে দশম শ্রেণী পর্যন্ত ভর্তির আবেদন চলছে। আগে আসলে আগে পাবেন ভিত্তিতে আসন বরাদ্দ। বিস্তারিত জানতে ভর্তি অফিসে যোগাযোগ করুন।'
            }
          ]
        }
      ],
      english: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Applications for admission from pre-primary to class ten for the academic year 2025-26 are ongoing. Seats will be allocated on a first-come, first-served basis. Contact the admission office for details.'
            }
          ]
        }
      ]
    },
    category: 'announcement',
    featured: true,
    publishedAt: new Date(Date.now() - 259200000).toISOString()
  }
];

// Sample Academic Programs
const academicPrograms = [
  {
    _type: 'academicProgram',
    title: {
      bengali: 'প্রাথমিক স্তর (প্রথম-পঞ্চম শ্রেণী)',
      english: 'Primary Level (Class I-V)'
    },
    slug: {
      bengali: { current: 'primary-level' },
      english: { current: 'primary-level' }
    },
    description: {
      bengali: 'আমাদের প্রাথমিক স্তরে শিশুদের মৌলিক ইসলামী শিক্ষা এবং একাডেমিক বিষয়ে দক্ষতা অর্জনের সুযোগ রয়েছে। কুরআন তিলাওয়াত, আরবি ভাষা এবং ইসলামী আদব-কায়দার পাশাপাশি বাংলা, ইংরেজি, গণিত ও বিজ্ঞানের মৌলিক শিক্ষা প্রদান করা হয়।',
      english: 'Our primary level provides children with opportunities to gain proficiency in basic Islamic education and academic subjects. Along with Quran recitation, Arabic language, and Islamic etiquette, fundamental education in Bengali, English, Mathematics, and Science is provided.'
    },
    ageRange: '5-10 years',
    duration: '5 years',
    islamicCurriculum: {
      subjects: [
        {
          name: {
            bengali: 'কুরআন তিলাওয়াত',
            english: 'Quran Recitation'
          },
          description: {
            bengali: 'সঠিক উচ্চারণ ও তাজবীদ সহ কুরআন তিলাওয়াত শিক্ষা',
            english: 'Quran recitation with proper pronunciation and Tajweed'
          },
          hoursPerWeek: 5
        },
        {
          name: {
            bengali: 'ইসলামী শিক্ষা',
            english: 'Islamic Studies'
          },
          description: {
            bengali: 'মৌলিক ইসলামী বিশ্বাস, আমল ও নৈতিকতা',
            english: 'Basic Islamic beliefs, practices, and ethics'
          },
          hoursPerWeek: 3
        },
        {
          name: {
            bengali: 'আরবি ভাষা',
            english: 'Arabic Language'
          },
          description: {
            bengali: 'আরবি বর্ণমালা, শব্দ ও বাক্য গঠন',
            english: 'Arabic alphabet, vocabulary, and sentence formation'
          },
          hoursPerWeek: 2
        }
      ]
    },
    nctbCurriculum: {
      subjects: [
        {
          name: {
            bengali: 'বাংলা',
            english: 'Bengali'
          },
          description: {
            bengali: 'মাতৃভাষা বাংলার পড়া, লেখা ও ব্যাকরণ',
            english: 'Reading, writing, and grammar of Bengali language'
          },
          hoursPerWeek: 6
        },
        {
          name: {
            bengali: 'ইংরেজি',
            english: 'English'
          },
          description: {
            bengali: 'ইংরেজি ভাষার মৌলিক দক্ষতা উন্নয়ন',
            english: 'Development of basic English language skills'
          },
          hoursPerWeek: 5
        },
        {
          name: {
            bengali: 'গণিত',
            english: 'Mathematics'
          },
          description: {
            bengali: 'সংখ্যা, যোগ-বিয়োগ, গুণ-ভাগ ও মৌলিক জ্যামিতি',
            english: 'Numbers, addition-subtraction, multiplication-division, and basic geometry'
          },
          hoursPerWeek: 5
        },
        {
          name: {
            bengali: 'প্রাথমিক বিজ্ঞান',
            english: 'Primary Science'
          },
          description: {
            bengali: 'প্রকৃতি ও পরিবেশ সম্পর্কে মৌলিক ধারণা',
            english: 'Basic concepts about nature and environment'
          },
          hoursPerWeek: 3
        }
      ]
    },
    coCurricularActivities: [
      {
        name: {
          bengali: 'কুরআন প্রতিযোগিতা',
          english: 'Quran Competition'
        },
        description: {
          bengali: 'বার্ষিক কুরআন তিলাওয়াত ও হিফজ প্রতিযোগিতা',
          english: 'Annual Quran recitation and memorization competition'
        },
        category: 'islamic_competition'
      },
      {
        name: {
          bengali: 'খেলাধুলা',
          english: 'Sports Activities'
        },
        description: {
          bengali: 'ফুটবল, ক্রিকেট ও অন্যান্য খেলাধুলা',
          english: 'Football, cricket, and other sports activities'
        },
        category: 'sports'
      }
    ],
    prerequisites: {
      bengali: 'ন্যূনতম বয়স ৫ বছর। প্রাথমিক পড়া-লেখার ক্ষমতা থাকলে ভালো।',
      english: 'Minimum age 5 years. Basic reading and writing ability is preferred.'
    },
    outcomes: {
      bengali: [
        'কুরআন সঠিকভাবে তিলাওয়াত করতে পারবে',
        'মৌলিক ইসলামী শিক্ষা অর্জন করবে',
        'বাংলা ও ইংরেজিতে পড়া-লেখার দক্ষতা অর্জন করবে',
        'গণিতের মৌলিক বিষয়গুলো বুঝতে পারবে'
      ],
      english: [
        'Able to recite Quran correctly',
        'Acquire basic Islamic education',
        'Develop reading and writing skills in Bengali and English',
        'Understand basic mathematical concepts'
      ]
    },
    order: 1
  },
  {
    _type: 'academicProgram',
    title: {
      bengali: 'মাধ্যমিক স্তর (ষষ্ঠ-দশম শ্রেণী)',
      english: 'Secondary Level (Class VI-X)'
    },
    slug: {
      bengali: { current: 'secondary-level' },
      english: { current: 'secondary-level' }
    },
    description: {
      bengali: 'মাধ্যমিক স্তরে শিক্ষার্থীরা গভীর ইসলামী জ্ঞান অর্জনের পাশাপাশি এসএসসি পরীক্ষার জন্য প্রস্তুতি নেয়। হাদিস, ফিকহ, তাফসীর এবং আরবি সাহিত্যের পাশাপাশি বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা বিভাগের বিষয়সমূহ পড়ানো হয়।',
      english: 'At the secondary level, students acquire deep Islamic knowledge while preparing for SSC examination. Along with Hadith, Fiqh, Tafsir, and Arabic literature, subjects from Science, Humanities, and Business Studies are taught.'
    },
    ageRange: '11-16 years',
    duration: '5 years',
    islamicCurriculum: {
      subjects: [
        {
          name: {
            bengali: 'হাদিস শরীফ',
            english: 'Hadith Studies'
          },
          description: {
            bengali: 'নবী (সা.) এর হাদিস অধ্যয়ন ও ব্যাখ্যা',
            english: 'Study and explanation of Prophet\'s (PBUH) Hadith'
          },
          hoursPerWeek: 4
        },
        {
          name: {
            bengali: 'ফিকহ শাস্ত্র',
            english: 'Islamic Jurisprudence'
          },
          description: {
            bengali: 'ইসলামী আইন ও বিধি-বিধান',
            english: 'Islamic law and regulations'
          },
          hoursPerWeek: 3
        },
        {
          name: {
            bengali: 'তাফসীর',
            english: 'Quranic Exegesis'
          },
          description: {
            bengali: 'কুরআনের ব্যাখ্যা ও তাৎপর্য',
            english: 'Explanation and significance of Quran'
          },
          hoursPerWeek: 3
        }
      ]
    },
    nctbCurriculum: {
      subjects: [
        {
          name: {
            bengali: 'পদার্থবিজ্ঞান',
            english: 'Physics'
          },
          hoursPerWeek: 4
        },
        {
          name: {
            bengali: 'রসায়ন',
            english: 'Chemistry'
          },
          hoursPerWeek: 4
        },
        {
          name: {
            bengali: 'জীববিজ্ঞান',
            english: 'Biology'
          },
          hoursPerWeek: 4
        },
        {
          name: {
            bengali: 'উচ্চতর গণিত',
            english: 'Higher Mathematics'
          },
          hoursPerWeek: 4
        }
      ]
    },
    order: 2
  }
];

// Sample Facilities
const facilities = [
  {
    _type: 'facility',
    name: {
      bengali: 'প্রধান মসজিদ',
      english: 'Main Mosque'
    },
    slug: {
      bengali: { current: 'main-mosque' },
      english: { current: 'main-mosque' }
    },
    description: {
      bengali: 'আমাদের প্রধান মসজিদে ৫০০ জন মুসল্লির একসাথে নামাজ আদায়ের ব্যবস্থা রয়েছে। এটি সুন্দর ইসলামী স্থাপত্যে নির্মিত এবং শিক্ষার্থী ও শিক্ষকদের দৈনিক পাঁচ ওয়াক্ত নামাজ, জুমার নামাজ এবং বিশেষ অনুষ্ঠানের জন্য ব্যবহৃত হয়।',
      english: 'Our main mosque has facilities for 500 worshippers to pray together. It is built in beautiful Islamic architecture and is used by students and teachers for daily five prayers, Friday prayers, and special occasions.'
    },
    category: 'islamic',
    capacity: 500,
    features: {
      bengali: ['এয়ার কন্ডিশনিং', 'সাউন্ড সিস্টেম', 'মিহরাব ও মিম্বর', 'মহিলাদের আলাদা অংশ', 'ওজুর স্থান'],
      english: ['Air Conditioning', 'Sound System', 'Mihrab & Minbar', 'Separate Women\'s Section', 'Wudu Area']
    },
    specifications: {
      area: 2000,
      equipment: {
        bengali: ['মাইক্রোফোন সিস্টেম', 'সিলিং ফ্যান', 'কার্পেট', 'কুরআন স্ট্যান্ড'],
        english: ['Microphone System', 'Ceiling Fans', 'Carpets', 'Quran Stands']
      },
      accessibility: {
        bengali: ['হুইলচেয়ার প্রবেশযোগ্য', 'র‍্যাম্প সুবিধা'],
        english: ['Wheelchair Accessible', 'Ramp Facility']
      }
    },
    safetyFeatures: {
      bengali: ['জরুরি প্রস্থান', 'ফায়ার এক্সটিংগুইশার', 'প্রাথমিক চিকিৎসা বক্স'],
      english: ['Emergency Exits', 'Fire Extinguishers', 'First Aid Box']
    },
    usageSchedule: {
      bengali: 'দৈনিক ৫টি নামাজের সময়, জুমার নামাজ এবং বিশেষ অনুষ্ঠান',
      english: 'Daily 5 prayer times, Friday prayers, and special occasions'
    },
    displayOrder: 1,
    featured: true
  },
  {
    _type: 'facility',
    name: {
      bengali: 'কম্পিউটার ল্যাব',
      english: 'Computer Laboratory'
    },
    slug: {
      bengali: { current: 'computer-lab' },
      english: { current: 'computer-lab' }
    },
    description: {
      bengali: 'আধুনিক কম্পিউটার ল্যাবে ৪০টি কম্পিউটার রয়েছে যেখানে শিক্ষার্থীরা কম্পিউটার বিজ্ঞান, প্রোগ্রামিং এবং ডিজিটাল সাক্ষরতার বিষয়গুলো হাতে-কলমে শিখতে পারে। উচ্চ গতির ইন্টারনেট সংযোগ এবং আধুনিক সফটওয়্যার সুবিধা রয়েছে।',
      english: 'The modern computer laboratory has 40 computers where students can learn computer science, programming, and digital literacy hands-on. High-speed internet connection and modern software facilities are available.'
    },
    category: 'academic',
    capacity: 40,
    features: {
      bengali: ['হাই-স্পিড ইন্টারনেট', 'প্রজেক্টর', 'এয়ার কন্ডিশনিং', 'আধুনিক সফটওয়্যার', 'প্রিন্টার ও স্ক্যানার'],
      english: ['High-Speed Internet', 'Projector', 'Air Conditioning', 'Modern Software', 'Printer & Scanner']
    },
    specifications: {
      area: 800,
      equipment: {
        bengali: ['৪০টি ডেস্কটপ কম্পিউটার', 'ইন্টারেক্টিভ হোয়াইটবোর্ড', 'নেটওয়ার্ক সুইচ', 'ইউপিএস সিস্টেম'],
        english: ['40 Desktop Computers', 'Interactive Whiteboard', 'Network Switch', 'UPS System']
      }
    },
    displayOrder: 2,
    featured: true
  },
  {
    _type: 'facility',
    name: {
      bengali: 'বিজ্ঞান গবেষণাগার',
      english: 'Science Laboratory'
    },
    slug: {
      bengali: { current: 'science-laboratory' },
      english: { current: 'science-laboratory' }
    },
    description: {
      bengali: 'পদার্থবিজ্ঞান, রসায়ন এবং জীববিজ্ঞানের জন্য আলাদা আলাদা গবেষণাগার রয়েছে। শিক্ষার্থীরা এখানে বিভিন্ন পরীক্ষা-নিরীক্ষা করে বিজ্ঞানের বিষয়গুলো ব্যবহারিকভাবে শিখতে পারে।',
      english: 'There are separate laboratories for Physics, Chemistry, and Biology. Students can learn science subjects practically by conducting various experiments here.'
    },
    category: 'academic',
    capacity: 30,
    features: {
      bengali: ['আধুনিক যন্ত্রপাতি', 'নিরাপত্তা সরঞ্জাম', 'রাসায়নিক সংরক্ষণ', 'মাইক্রোস্কোপ'],
      english: ['Modern Equipment', 'Safety Equipment', 'Chemical Storage', 'Microscopes']
    },
    displayOrder: 3,
    featured: false
  },
  {
    _type: 'facility',
    name: {
      bengali: 'লাইব্রেরি',
      english: 'Library'
    },
    slug: {
      bengali: { current: 'library' },
      english: { current: 'library' }
    },
    description: {
      bengali: 'আমাদের লাইব্রেরিতে ১০,০০০+ বই রয়েছে যার মধ্যে ইসলামী বই, একাডেমিক বই, গল্প-উপন্যাস এবং রেফারেন্স বই অন্তর্ভুক্ত। শান্ত পরিবেশে পড়াশোনার জন্য আলাদা পড়ার কক্ষ রয়েছে।',
      english: 'Our library has 10,000+ books including Islamic books, academic books, stories-novels, and reference books. There are separate reading rooms for studying in a quiet environment.'
    },
    category: 'academic',
    capacity: 100,
    features: {
      bengali: ['১০,০০০+ বই', 'ডিজিটাল ক্যাটালগ', 'পড়ার কক্ষ', 'ইন্টারনেট সুবিধা', 'ফটোকপি সেবা'],
      english: ['10,000+ Books', 'Digital Catalog', 'Reading Rooms', 'Internet Facility', 'Photocopy Service']
    },
    displayOrder: 4,
    featured: true
  },
  {
    _type: 'facility',
    name: {
      bengali: 'খেলার মাঠ',
      english: 'Sports Ground'
    },
    slug: {
      bengali: { current: 'sports-ground' },
      english: { current: 'sports-ground' }
    },
    description: {
      bengali: 'বিশাল খেলার মাঠে ফুটবল, ক্রিকেট, ভলিবল এবং অন্যান্য খেলাধুলার সুবিধা রয়েছে। শিক্ষার্থীদের শারীরিক সুস্থতা ও খেলাধুলার দক্ষতা বৃদ্ধির জন্য নিয়মিত খেলাধুলার আয়োজন করা হয়।',
      english: 'The large sports ground has facilities for football, cricket, volleyball, and other sports. Regular sports activities are organized to improve students\' physical fitness and sports skills.'
    },
    category: 'recreational',
    capacity: 200,
    features: {
      bengali: ['ফুটবল মাঠ', 'ক্রিকেট পিচ', 'ভলিবল কোর্ট', 'দর্শক গ্যালারি', 'খেলার সরঞ্জাম'],
      english: ['Football Field', 'Cricket Pitch', 'Volleyball Court', 'Spectator Gallery', 'Sports Equipment']
    },
    displayOrder: 5,
    featured: false
  }
];

async function createOrUpdateDocument(doc) {
  try {
    if (doc._id) {
      const existing = await client.getDocument(doc._id).catch(() => null);
      if (existing) {
        console.log(`Updating ${doc._type}: ${doc._id}`);
        return await client.patch(doc._id).set(doc).commit();
      }
    }
    
    console.log(`Creating ${doc._type}: ${doc.title?.english || doc.name?.english || doc._id}`);
    return await client.create(doc);
  } catch (error) {
    console.error(`Error creating/updating ${doc._type}:`, error);
    throw error;
  }
}

async function validateEnvironment() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
    'SANITY_API_TOKEN',
  ];

  console.log('🔍 Checking environment variables...');
  console.log(`   - PROJECT_ID: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ? '✅' : '❌'}`);
  console.log(`   - DATASET: ${process.env.NEXT_PUBLIC_SANITY_DATASET ? '✅' : '❌'}`);
  console.log(`   - API_TOKEN: ${process.env.SANITY_API_TOKEN ? '✅ (length: ' + process.env.SANITY_API_TOKEN.length + ')' : '❌'}`);

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`  - ${envVar}`));
    console.error('\nPlease check your .env.local file and ensure all required variables are set.');
    console.error('\nCurrent working directory:', process.cwd());
    console.error('Looking for .env.local at:', resolve(process.cwd(), '.env.local'));
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

async function testConnection() {
  try {
    console.log('🔌 Testing Sanity connection...');
    await client.fetch('*[_type == "siteSettings"][0]');
    console.log('✅ Sanity connection successful');
  } catch (error) {
    console.error('❌ Failed to connect to Sanity:', error);
    console.error('\nPlease check your Sanity configuration and API token.');
    process.exit(1);
  }
}

async function populateAllData() {
  console.log('🚀 Starting Sanity CMS data population...\n');
  
  try {
    await validateEnvironment();
    await testConnection();
    
    console.log('\n📋 Populating Site Settings...');
    await createOrUpdateDocument(siteSettings);
    console.log('✅ Site Settings populated successfully');

    console.log('\n📄 Populating Pages...');
    for (const page of pages) {
      await createOrUpdateDocument(page);
    }
    console.log(`✅ ${pages.length} Pages populated successfully`);

    console.log('\n📰 Populating News & Events...');
    for (const newsEvent of newsEvents) {
      await createOrUpdateDocument(newsEvent);
    }
    console.log(`✅ ${newsEvents.length} News & Events populated successfully`);

    console.log('\n🎓 Populating Academic Programs...');
    for (const program of academicPrograms) {
      await createOrUpdateDocument(program);
    }
    console.log(`✅ ${academicPrograms.length} Academic Programs populated successfully`);

    console.log('\n🏢 Populating Facilities...');
    for (const facility of facilities) {
      await createOrUpdateDocument(facility);
    }
    console.log(`✅ ${facilities.length} Facilities populated successfully`);
    
    console.log('\n🎉 All data populated successfully!');
    console.log('\nYou can now:');
    console.log('1. Visit your Sanity Studio to review the content');
    console.log('2. Test the website with the populated data');
    console.log('3. Run "npm run test-content" to verify the integration');
    
  } catch (error) {
    console.error('\n❌ Error during data population:', error);
    process.exit(1);
  }
}

async function cleanupData() {
  console.log('🧹 Cleaning up test data...\n');
  
  try {
    await validateEnvironment();
    await testConnection();
    
    const contentTypes = ['page', 'newsEvent', 'academicProgram', 'facility', 'translationTask'];
    
    for (const contentType of contentTypes) {
      console.log(`Deleting ${contentType} documents...`);
      const documents = await client.fetch(`*[_type == "${contentType}"]._id`);
      
      if (documents.length > 0) {
        await client.delete({ query: `*[_type == "${contentType}"]` });
        console.log(`✅ Deleted ${documents.length} ${contentType} documents`);
      } else {
        console.log(`ℹ️  No ${contentType} documents found`);
      }
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'populate':
      await populateAllData();
      break;
    case 'cleanup':
      await cleanupData();
      break;
    case 'test-connection':
      await validateEnvironment();
      await testConnection();
      console.log('✅ Connection test completed successfully');
      break;
    default:
      console.log('📖 Sanity CMS Data Population Script\n');
      console.log('Available commands:');
      console.log('  populate        - Populate Sanity with sample data');
      console.log('  cleanup         - Remove all test data from Sanity');
      console.log('  test-connection - Test connection to Sanity');
      console.log('\nUsage:');
      console.log('  node scripts/populate-sanity-data.js populate');
      console.log('  node scripts/populate-sanity-data.js cleanup');
      console.log('  node scripts/populate-sanity-data.js test-connection');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}