import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});

/**
 * Sample data for populating Sanity CMS with comprehensive multilingual content
 */

// Site Settings
const siteSettings = {
  _type: 'siteSettings',
  _id: 'siteSettings',
  title: {
    bengali: 'মাদরাসাতুল কুরআন',
    english: 'Madrasatul Quran',
  },
  description: {
    bengali:
      'ইসলামী শিক্ষা ও আধুনিক শিক্ষায় উৎকর্ষতা - কুরআন ও সুন্নাহর আলোকে চরিত্র গঠন এবং আধুনিক শিক্ষায় শ্রেষ্ঠত্ব অর্জন',
    english:
      'Excellence in Islamic Education & Modern Learning - Character building in the light of Quran and Sunnah and achieving excellence in modern education',
  },
  contactInfo: {
    address: {
      bengali: '১২৩ ইসলামিক এডুকেশন স্ট্রিট, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ',
      english:
        '123 Islamic Education Street, Dhanmondi, Dhaka-1205, Bangladesh',
    },
    phone: [
      {
        label: {
          bengali: 'প্রধান কার্যালয়',
          english: 'Main Office',
        },
        number: '+880 2-9876543',
      },
      {
        label: {
          bengali: 'ভর্তি কার্যালয়',
          english: 'Admission Office',
        },
        number: '+880 2-9876544',
      },
    ],
    email: [
      {
        label: {
          bengali: 'সাধারণ তথ্য',
          english: 'General Information',
        },
        address: 'info@madrasatulquran.edu.bd',
      },
      {
        label: {
          bengali: 'ভর্তি',
          english: 'Admissions',
        },
        address: 'admission@madrasatulquran.edu.bd',
      },
    ],
    officeHours: {
      bengali: 'শনিবার - বৃহস্পতিবার: সকাল ৯:০০ - বিকাল ৪:০০',
      english: 'Saturday - Thursday: 9:00 AM - 4:00 PM',
    },
  },
  socialMedia: {
    facebook: 'https://facebook.com/madrasatulquran',
    youtube: 'https://youtube.com/@madrasatulquran',
    instagram: 'https://instagram.com/madrasatulquran',
  },
  admissionInfo: {
    admissionPhone: '+880 2-9876544',
    admissionEmail: 'admission@madrasatulquran.edu.bd',
    admissionHours: {
      bengali: 'শনিবার - বৃহস্পতিবার: সকাল ৯:০০ - বিকাল ৫:০০',
      english: 'Saturday - Thursday: 9:00 AM - 5:00 PM',
    },
  },
  seo: {
    metaTitle: {
      bengali: 'মাদরাসাতুল কুরআন - ইসলামী শিক্ষা ও আধুনিক শিক্ষায় উৎকর্ষতা',
      english: 'Madrasatul Quran - Excellence in Islamic & Modern Education',
    },
    metaDescription: {
      bengali:
        'ঢাকার অগ্রণী ইসলামী শিক্ষা প্রতিষ্ঠান। কুরআন ও সুন্নাহর আলোকে চরিত্র গঠন এবং আধুনিক শিক্ষায় শ্রেষ্ঠত্ব অর্জন।',
      english:
        'Leading Islamic educational institution in Dhaka. Character building through Quran & Sunnah with excellence in modern education.',
    },
    keywords: {
      bengali: [
        'ইসলামী শিক্ষা',
        'মাদরাসা',
        'কুরআন শিক্ষা',
        'ঢাকা',
        'ইসলামী স্কুল',
      ],
      english: [
        'Islamic education',
        'Madrasa',
        'Quran education',
        'Dhaka',
        'Islamic school',
      ],
    },
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
          english: 'National Awards',
        },
        value: '15',
      },
      {
        title: {
          bengali: 'বৃত্তিপ্রাপ্ত শিক্ষার্থী',
          english: 'Scholarship Recipients',
        },
        value: '120+',
      },
    ],
  },
};

// Sample Pages
const pages = [
  {
    _type: 'page',
    title: {
      bengali: 'স্কুলের ইতিহাস',
      english: 'School History',
    },
    slug: {
      bengali: { current: 'school-history' },
      english: { current: 'school-history' },
    },
    content: {
      bengali: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'মাদরাসাতুল কুরআন ১৯৯৮ সালে প্রতিষ্ঠিত হয়েছিল একটি ছোট স্বপ্ন নিয়ে - ইসলামী মূল্যবোধ এবং আধুনিক শিক্ষার সমন্বয়ে একটি আদর্শ শিক্ষা প্রতিষ্ঠান গড়ে তোলা। আজ, ২৫ বছর পর, আমরা গর্বিত যে আমাদের প্রতিষ্ঠান বাংলাদেশের অন্যতম সেরা ইসলামী শিক্ষা প্রতিষ্ঠান হিসেবে পরিচিত।',
            },
          ],
        },
      ],
      english: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Madrasatul Quran was established in 1998 with a small dream - to create an ideal educational institution that combines Islamic values with modern education. Today, 25 years later, we are proud that our institution is recognized as one of the best Islamic educational institutions in Bangladesh.',
            },
          ],
        },
      ],
    },
    publishedAt: new Date().toISOString(),
  },
  {
    _type: 'page',
    title: {
      bengali: 'আমাদের দৃষ্টিভঙ্গি',
      english: 'Our Vision',
    },
    slug: {
      bengali: { current: 'school-vision' },
      english: { current: 'school-vision' },
    },
    content: {
      bengali: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'আমাদের দৃষ্টিভঙ্গি হলো এমন একটি প্রজন্ম গড়ে তোলা যারা ইসলামী মূল্যবোধে দৃঢ়ভাবে প্রতিষ্ঠিত এবং একই সাথে আধুনিক জ্ঞান-বিজ্ঞানে পারদর্শী। আমরা চাই আমাদের শিক্ষার্থীরা দুনিয়া ও আখিরাতে সফল হোক।',
            },
          ],
        },
      ],
      english: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Our vision is to build a generation that is firmly established in Islamic values and at the same time proficient in modern knowledge and science. We want our students to be successful in this world and the hereafter.',
            },
          ],
        },
      ],
    },
    publishedAt: new Date().toISOString(),
  },
];

// Sample News Events
const newsEvents = [
  {
    _type: 'newsEvent',
    title: {
      bengali: 'বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৫',
      english: 'Annual Sports Competition 2025',
    },
    slug: {
      bengali: { current: 'annual-sports-2025' },
      english: { current: 'annual-sports-2025' },
    },
    excerpt: {
      bengali:
        'আমাদের বার্ষিক ক্রীড়া প্রতিযোগিতা অনুষ্ঠিত হবে ১৫ ফেব্রুয়ারি ২০২৫ তারিখে।',
      english:
        'Our annual sports competition will be held on February 15, 2025.',
    },
    content: {
      bengali: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'মাদরাসাতুল কুরআনের বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৫ অনুষ্ঠিত হবে আগামী ১৫ ফেব্রুয়ারি। এই প্রতিযোগিতায় সকল শ্রেণীর শিক্ষার্থীরা অংশগ্রহণ করবে।',
            },
          ],
        },
      ],
      english: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: "Madrasatul Quran's Annual Sports Competition 2025 will be held on February 15. Students from all classes will participate in this competition.",
            },
          ],
        },
      ],
    },
    eventDate: '2025-02-15',
    category: 'event',
    featured: true,
    publishedAt: new Date().toISOString(),
  },
  {
    _type: 'newsEvent',
    title: {
      bengali: 'জাতীয় কুরআন প্রতিযোগিতায় প্রথম স্থান',
      english: 'First Place in National Quran Competition',
    },
    slug: {
      bengali: { current: 'quran-competition-first-place' },
      english: { current: 'quran-competition-first-place' },
    },
    excerpt: {
      bengali:
        'আমাদের শিক্ষার্থী মোহাম্মদ আব্দুল্লাহ জাতীয় কুরআন প্রতিযোগিতায় প্রথম স্থান অধিকার করেছে।',
      english:
        'Our student Mohammad Abdullah has secured first place in the National Quran Competition.',
    },
    content: {
      bengali: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'আমাদের অষ্টম শ্রেণীর শিক্ষার্থী মোহাম্মদ আব্দুল্লাহ জাতীয় কুরআন তিলাওয়াত প্রতিযোগিতায় প্রথম স্থান অধিকার করে আমাদের গর্বিত করেছে। এই অর্জন আমাদের ইসলামী শিক্ষার মানের প্রমাণ।',
            },
          ],
        },
      ],
      english: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Our eighth-grade student Mohammad Abdullah has made us proud by securing first place in the National Quran Recitation Competition. This achievement is proof of the quality of our Islamic education.',
            },
          ],
        },
      ],
    },
    category: 'achievement',
    featured: true,
    publishedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
];

// Sample Academic Programs
const academicPrograms = [
  {
    _type: 'academicProgram',
    title: {
      bengali: 'প্রাথমিক স্তর (প্রথম-পঞ্চম শ্রেণী)',
      english: 'Primary Level (Class I-V)',
    },
    slug: {
      bengali: { current: 'primary-level' },
      english: { current: 'primary-level' },
    },
    description: {
      bengali:
        'আমাদের প্রাথমিক স্তরে শিশুদের মৌলিক ইসলামী শিক্ষা এবং একাডেমিক বিষয়ে দক্ষতা অর্জনের সুযোগ রয়েছে।',
      english:
        'Our primary level provides children with opportunities to gain proficiency in basic Islamic education and academic subjects.',
    },
    ageRange: '5-10 years',
    duration: '5 years',
    islamicCurriculum: {
      subjects: [
        {
          name: {
            bengali: 'কুরআন তিলাওয়াত',
            english: 'Quran Recitation',
          },
          description: {
            bengali: 'সঠিক উচ্চারণ ও তাজবীদ সহ কুরআন তিলাওয়াত',
            english: 'Quran recitation with proper pronunciation and Tajweed',
          },
          hoursPerWeek: 5,
        },
        {
          name: {
            bengali: 'ইসলামী শিক্ষা',
            english: 'Islamic Studies',
          },
          description: {
            bengali: 'মৌলিক ইসলামী বিশ্বাস ও আমল',
            english: 'Basic Islamic beliefs and practices',
          },
          hoursPerWeek: 3,
        },
      ],
    },
    nctbCurriculum: {
      subjects: [
        {
          name: {
            bengali: 'বাংলা',
            english: 'Bengali',
          },
          hoursPerWeek: 6,
        },
        {
          name: {
            bengali: 'ইংরেজি',
            english: 'English',
          },
          hoursPerWeek: 5,
        },
        {
          name: {
            bengali: 'গণিত',
            english: 'Mathematics',
          },
          hoursPerWeek: 5,
        },
      ],
    },
    order: 1,
  },
];

// Sample Staff Members
const staffMembers = [
  {
    _type: 'staffMember',
    name: {
      bengali: 'ড. মোহাম্মদ আব্দুর রহমান',
      english: 'Dr. Mohammad Abdur Rahman',
    },
    position: {
      bengali: 'অধ্যক্ষ',
      english: 'Principal',
    },
    department: 'administration',
    qualifications: {
      bengali: ['পিএইচডি ইসলামিক স্টাডিজ', 'এমএ আরবি সাহিত্য'],
      english: ['PhD Islamic Studies', 'MA Arabic Literature'],
    },
    biography: {
      bengali:
        'ড. মোহাম্মদ আব্দুর রহমান ২৫ বছরের শিক্ষকতার অভিজ্ঞতা নিয়ে আমাদের প্রতিষ্ঠানের নেতৃত্ব দিচ্ছেন।',
      english:
        'Dr. Mohammad Abdur Rahman is leading our institution with 25 years of teaching experience.',
    },
    yearsOfExperience: 25,
    displayOrder: 1,
    isLeadership: true,
  },
  {
    _type: 'staffMember',
    name: {
      bengali: 'মাওলানা আব্দুল করিম',
      english: 'Maulana Abdul Karim',
    },
    position: {
      bengali: 'ইসলামিক স্টাডিজ বিভাগের প্রধান',
      english: 'Head of Islamic Studies Department',
    },
    department: 'islamic_studies',
    qualifications: {
      bengali: ['দাওরায়ে হাদিস', 'এমএ ইসলামিক স্টাডিজ'],
      english: ['Dawra-e-Hadith', 'MA Islamic Studies'],
    },
    yearsOfExperience: 20,
    displayOrder: 2,
    isLeadership: true,
  },
];

// Sample Facilities
const facilities = [
  {
    _type: 'facility',
    name: {
      bengali: 'প্রধান মসজিদ',
      english: 'Main Mosque',
    },
    slug: {
      bengali: { current: 'main-mosque' },
      english: { current: 'main-mosque' },
    },
    description: {
      bengali: 'আমাদের প্রধান মসজিদ ৫০০ জন মুসল্লির নামাজের ব্যবস্থা রয়েছে।',
      english: 'Our main mosque has prayer facilities for 500 worshippers.',
    },
    category: 'islamic',
    capacity: 500,
    features: {
      bengali: ['এয়ার কন্ডিশনিং', 'সাউন্ড সিস্টেম', 'মিহরাব ও মিম্বর'],
      english: ['Air Conditioning', 'Sound System', 'Mihrab & Minbar'],
    },
    displayOrder: 1,
    featured: true,
  },
  {
    _type: 'facility',
    name: {
      bengali: 'কম্পিউটার ল্যাব',
      english: 'Computer Laboratory',
    },
    slug: {
      bengali: { current: 'computer-lab' },
      english: { current: 'computer-lab' },
    },
    description: {
      bengali: 'আধুনিক কম্পিউটার ল্যাব যেখানে ৪০টি কম্পিউটার রয়েছে।',
      english: 'Modern computer laboratory with 40 computers.',
    },
    category: 'academic',
    capacity: 40,
    features: {
      bengali: ['হাই-স্পিড ইন্টারনেট', 'প্রজেক্টর', 'এয়ার কন্ডিশনিং'],
      english: ['High-Speed Internet', 'Projector', 'Air Conditioning'],
    },
    displayOrder: 2,
    featured: true,
  },
];

/**
 * Helper functions for data population
 */

async function createOrUpdateDocument(doc: any) {
  try {
    if (doc._id) {
      // Update existing document
      const existing = await client.getDocument(doc._id).catch(() => null);
      if (existing) {
        console.log(`Updating ${doc._type}: ${doc._id}`);
        return await client.patch(doc._id).set(doc).commit();
      }
    }

    // Create new document
    console.log(
      `Creating ${doc._type}: ${doc.title?.english || doc.name?.english || doc._id}`
    );
    return await client.create(doc);
  } catch (error) {
    console.error(`Error creating/updating ${doc._type}:`, error);
    throw error;
  }
}

async function populateSiteSettings() {
  console.log('\n📋 Populating Site Settings...');
  await createOrUpdateDocument(siteSettings);
  console.log('✅ Site Settings populated successfully');
}

async function populatePages() {
  console.log('\n📄 Populating Pages...');
  for (const page of pages) {
    await createOrUpdateDocument(page);
  }
  console.log(`✅ ${pages.length} Pages populated successfully`);
}

async function populateNewsEvents() {
  console.log('\n📰 Populating News & Events...');
  for (const newsEvent of newsEvents) {
    await createOrUpdateDocument(newsEvent);
  }
  console.log(`✅ ${newsEvents.length} News & Events populated successfully`);
}

async function populateAcademicPrograms() {
  console.log('\n🎓 Populating Academic Programs...');
  for (const program of academicPrograms) {
    await createOrUpdateDocument(program);
  }
  console.log(
    `✅ ${academicPrograms.length} Academic Programs populated successfully`
  );
}

async function populateStaffMembers() {
  console.log('\n👥 Populating Staff Members...');
  for (const staff of staffMembers) {
    await createOrUpdateDocument(staff);
  }
  console.log(`✅ ${staffMembers.length} Staff Members populated successfully`);
}

async function populateFacilities() {
  console.log('\n🏢 Populating Facilities...');
  for (const facility of facilities) {
    await createOrUpdateDocument(facility);
  }
  console.log(`✅ ${facilities.length} Facilities populated successfully`);
}

async function createTranslationTasks() {
  console.log('\n🔄 Creating Translation Tasks...');

  const translationTasks = [
    {
      _type: 'translationTask',
      documentId: 'school-history',
      documentType: 'page',
      language: 'bengali',
      status: 'completed',
      assignedTo: 'translator-1',
      completedBy: 'translator-1',
      completedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      notes: 'Translation completed successfully',
    },
    {
      _type: 'translationTask',
      documentId: 'annual-sports-2025',
      documentType: 'newsEvent',
      language: 'english',
      status: 'in_progress',
      assignedTo: 'translator-2',
      progress: 75,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date().toISOString(),
      notes: 'Translation in progress, 75% completed',
    },
    {
      _type: 'translationTask',
      documentId: 'primary-level',
      documentType: 'academicProgram',
      language: 'bengali',
      status: 'pending',
      assignedTo: 'translator-3',
      createdAt: new Date().toISOString(),
      notes: 'Awaiting translator assignment',
    },
  ];

  for (const task of translationTasks) {
    await createOrUpdateDocument(task);
  }

  console.log(
    `✅ ${translationTasks.length} Translation Tasks created successfully`
  );
}

async function validateEnvironment() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
    'SANITY_API_TOKEN',
  ];

  console.log('🔍 Checking environment variables...');
  console.log(
    `   - PROJECT_ID: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ? '✅' : '❌'}`
  );
  console.log(
    `   - DATASET: ${process.env.NEXT_PUBLIC_SANITY_DATASET ? '✅' : '❌'}`
  );
  console.log(
    `   - API_TOKEN: ${process.env.SANITY_API_TOKEN ? '✅ (length: ' + process.env.SANITY_API_TOKEN.length + ')' : '❌'}`
  );

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`  - ${envVar}`));
    console.error(
      '\nPlease check your .env.local file and ensure all required variables are set.'
    );
    console.error('\nCurrent working directory:', process.cwd());
    console.error(
      'Looking for .env.local at:',
      resolve(process.cwd(), '.env.local')
    );
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

/**
 * Main population function
 */
async function populateAllData() {
  console.log('🚀 Starting Sanity CMS data population...\n');

  try {
    // Validate environment and connection
    await validateEnvironment();
    await testConnection();

    // Populate all content types
    await populateSiteSettings();
    await populatePages();
    await populateNewsEvents();
    await populateAcademicPrograms();
    await populateStaffMembers();
    await populateFacilities();
    await createTranslationTasks();

    console.log('\n🎉 All data populated successfully!');
    console.log('\nYou can now:');
    console.log('1. Visit your Sanity Studio to review the content');
    console.log('2. Test the website with the populated data');
    console.log(
      '3. Use the translation dashboard to manage multilingual content'
    );
  } catch (error) {
    console.error('\n❌ Error during data population:', error);
    process.exit(1);
  }
}

/**
 * Cleanup function to remove all test data
 */
async function cleanupData() {
  console.log('🧹 Cleaning up test data...\n');

  try {
    await validateEnvironment();
    await testConnection();

    const contentTypes = [
      'page',
      'newsEvent',
      'academicProgram',
      'staffMember',
      'facility',
      'translationTask',
    ];

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

/**
 * Command line interface
 */
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
      console.log('  npm run populate-sanity populate');
      console.log('  npm run populate-sanity cleanup');
      console.log('  npm run populate-sanity test-connection');
      break;
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export {
  populateAllData,
  cleanupData,
  siteSettings,
  pages,
  newsEvents,
  academicPrograms,
  staffMembers,
  facilities,
};
