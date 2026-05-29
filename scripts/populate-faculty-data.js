const { createClient } = require('@sanity/client');
const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Faculty seed script — Directors, Teachers, and Departments.
 *
 * WRITES TO THE LIVE SANITY DATASET. Read before running.
 * Uses stable _id's so re-running updates the same documents (createOrReplace)
 * instead of creating duplicates. No images are attached — female / photo-less
 * profiles fall back to the gender placeholder configured in Site Settings.
 *
 * Run:  node scripts/populate-faculty-data.js
 */

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const slug = (current) => ({ _type: 'slug', current });
const ml = (bengali, english) => ({ bengali, english });
const mlSlug = (bengali, english) => ({ bengali: slug(bengali), english: slug(english) });
const para = (bengali, english) => ({
  bengali: [{ _type: 'block', _key: 'b', style: 'normal', markDefs: [], children: [{ _type: 'span', _key: 's', text: bengali, marks: [] }] }],
  english: [{ _type: 'block', _key: 'b', style: 'normal', markDefs: [], children: [{ _type: 'span', _key: 's', text: english, marks: [] }] }],
});

const departments = [
  { _id: 'department.islamic-studies', name: ml('ইসলামী শিক্ষা', 'Islamic Studies'), slugEn: 'islamic-studies', slugBn: 'islamic-studies', order: 1 },
  { _id: 'department.nctb', name: ml('এনসিটিবি পাঠ্যক্রম', 'NCTB Curriculum'), slugEn: 'nctb-curriculum', slugBn: 'nctb-curriculum', order: 2 },
  { _id: 'department.co-curricular', name: ml('সহ-পাঠক্রমিক', 'Co-curricular'), slugEn: 'co-curricular', slugBn: 'co-curricular', order: 3 },
];

const directors = [
  {
    _id: 'director.chairman',
    name: ml('মাওলানা আব্দুল্লাহ', 'Maulana Abdullah'),
    slugEn: 'maulana-abdullah',
    slugBn: 'maulana-abdullah',
    designation: ml('চেয়ারম্যান', 'Chairman'),
    seniority: 'chairman',
    gender: 'male',
    order: 1,
    featured: true,
  },
  {
    _id: 'director.principal',
    name: ml('ড. ফাতিমা খাতুন', 'Dr. Fatima Khatun'),
    slugEn: 'dr-fatima-khatun',
    slugBn: 'dr-fatima-khatun',
    designation: ml('অধ্যক্ষ', 'Principal'),
    seniority: 'principal',
    gender: 'female',
    order: 2,
    featured: true,
  },
];

const teachers = [
  { _id: 'teacher.1', name: ml('হাফেজ ইব্রাহিম', 'Hafez Ibrahim'), slugEn: 'hafez-ibrahim', dept: 'department.islamic-studies', gender: 'male', subjects: ml(['কুরআন', 'হিফজ'], ['Quran', 'Hifz']), exp: 12, seniority: 'head_of_department' },
  { _id: 'teacher.2', name: ml('উস্তাজা আয়েশা', 'Ustaza Ayesha'), slugEn: 'ustaza-ayesha', dept: 'department.islamic-studies', gender: 'female', subjects: ml(['আরবি', 'ফিকহ'], ['Arabic', 'Fiqh']), exp: 8 },
  { _id: 'teacher.3', name: ml('মোঃ রহিম', 'Md. Rahim'), slugEn: 'md-rahim', dept: 'department.nctb', gender: 'male', subjects: ml(['গণিত', 'বিজ্ঞান'], ['Mathematics', 'Science']), exp: 10 },
];

async function run() {
  const docs = [];

  for (const d of departments) {
    docs.push({
      _id: d._id,
      _type: 'department',
      name: d.name,
      slug: mlSlug(d.slugBn, d.slugEn),
      displayOrder: d.order,
    });
  }

  for (const d of directors) {
    docs.push({
      _id: d._id,
      _type: 'director',
      name: d.name,
      slug: mlSlug(d.slugBn, d.slugEn),
      designation: d.designation,
      seniority: d.seniority,
      gender: d.gender,
      summary: ml('শিক্ষায় নিবেদিত একজন অভিজ্ঞ নেতৃত্ব।', 'An experienced leader dedicated to education.'),
      message: para('আসসালামু আলাইকুম। আমাদের প্রতিষ্ঠানে আপনাকে স্বাগতম।', 'Assalamu Alaikum. Welcome to our institution.'),
      fullBio: para('দীর্ঘ অভিজ্ঞতাসম্পন্ন একজন শিক্ষাবিদ।', 'An educator with long experience.'),
      qualifications: ml(['কামিল', 'এম.এ'], ['Kamil', 'M.A']),
      displayOrder: d.order,
      featured: d.featured,
    });
  }

  for (const t of teachers) {
    docs.push({
      _id: t._id,
      _type: 'teacher',
      name: t.name,
      slug: mlSlug(t.slugEn, t.slugEn),
      gender: t.gender,
      seniority: t.seniority,
      department: { _type: 'reference', _ref: t.dept },
      summary: ml('একজন নিবেদিতপ্রাণ শিক্ষক।', 'A dedicated teacher.'),
      fullBio: para('শিক্ষার্থীদের গড়ে তুলতে নিবেদিত।', 'Dedicated to nurturing students.'),
      subjects: t.subjects,
      yearsOfExperience: t.exp,
      displayOrder: 0,
    });
  }

  for (const doc of docs) {
    await client.createOrReplace(doc);
    console.log(`✓ ${doc._type}: ${doc._id}`);
  }
  console.log(`\nSeeded ${docs.length} documents.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
