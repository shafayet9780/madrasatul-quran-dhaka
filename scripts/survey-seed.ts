/**
 * Seeds survey reference data into Sanity: areas, the T1 template, classes and survey teachers.
 * Writes published documents with fixed IDs to the dataset in .env.local.
 *
 *   pnpm exec tsx scripts/survey-seed.ts              # create missing documents only
 *   pnpm exec tsx scripts/survey-seed.ts --overwrite  # replace seeded documents (only before any round opens)
 */
import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env.local') });
const {
  NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
  NEXT_PUBLIC_SANITY_DATASET: dataset,
  SANITY_API_TOKEN: token,
} = process.env;
if (!projectId || !dataset || !token) throw new Error('Sanity project, dataset, and write token are required.');

const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false });
const overwrite = process.argv.includes('--overwrite');

const AREAS: [key: string, name: string, group: 'student' | 'teaching'][] = [
  ['attendance', 'উপস্থিতি', 'student'],
  ['focus-habits', 'মনোযোগ ও পড়ার অভ্যাস', 'student'],
  ['obedience', 'আনুগত্য', 'student'],
  ['peer-conduct', 'সহপাঠীদের সাথে আচরণ', 'student'],
  ['results', 'পড়াশোনার ফলাফল', 'student'],
  ['interest-home', 'আগ্রহ ও বাসার অভ্যাস', 'student'],
  ['guardian-cooperation', 'অভিভাবকের সহযোগিতা', 'student'],
  ['teaching-effectiveness', 'পাঠদানের কার্যকারিতা', 'teaching'],
  ['assessment', 'মূল্যায়ন ও খাতা দেখা', 'teaching'],
  ['conduct-tarbiyah', 'আচরণ ও তারবিয়াহ', 'teaching'],
  ['guardian-communication', 'অভিভাবকের সাথে যোগাযোগ', 'teaching'],
  ['overall-satisfaction', 'সার্বিক সন্তুষ্টি', 'teaching'],
];

const T1_QUESTIONS: [key: string, text: string, area: string, hint?: string][] = [
  ['attendance', 'ক্লাসে নিয়মিত উপস্থিত হয় কি না?', 'attendance'],
  ['attention', 'ক্লাসে মনোযোগী কি না?', 'focus-habits'],
  ['peer-conduct', 'অন্য বাচ্চাদের সাথে মারামারি বা বাজে কথা বলে কি না?', 'peer-conduct', '১০ = সমস্যা নেই, ৪ = প্রায়ই করে'],
  ['follows-instructions', 'শিক্ষকের নির্দেশ পালন করে কি না?', 'obedience'],
  ['guardian-coordination', 'অভিভাবক শিক্ষকের সাথে সঠিক কোর্ডিনেশন করে কি না?', 'guardian-cooperation'],
  ['guardian-off-hours', 'অভিভাবক নির্ধারিত সময়ের বাইরে শিক্ষকের সাথে যোগাযোগ করে কি না?', 'guardian-cooperation', '১০ = কখনো করেন না, ৪ = প্রায়ই করেন'],
  ['assessment-80', 'কুইজ বা অন্যান্য এসেসমেন্ট এ শতকরা আশিভাগ মার্ক পায় কি না?', 'results'],
];

type Section = [key: string, name: string, erpSectionNames: string[]];
const AB: Section[] = [
  ['a', 'A', ['Section A']],
  ['b', 'B', ['Section B']],
];
// ERP section labels for the boys/girls sections are confirmed on the first import dry run.
const BOYS_GIRLS: Section[] = [
  ['male', 'বালক', []],
  ['female', 'বালিকা', []],
];

// Subjects per class: [key, Bengali name]. Filled in when the school sends the list.
const CLASSES: { key: string; name: string; erp: string; sections: Section[]; subjects: [string, string][] }[] = [
  { key: 'play', name: 'প্লে', erp: 'Play', sections: [], subjects: [] },
  { key: 'nursery', name: 'নার্সারি', erp: 'Nursery', sections: AB, subjects: [] },
  { key: 'kg', name: 'কেজি', erp: 'KG', sections: AB, subjects: [] },
  { key: 'one', name: 'প্রথম', erp: 'One', sections: [], subjects: [] },
  { key: 'two', name: 'দ্বিতীয়', erp: 'Two', sections: BOYS_GIRLS, subjects: [] },
  { key: 'three', name: 'তৃতীয়', erp: 'Three', sections: BOYS_GIRLS, subjects: [] },
  { key: 'four', name: 'চতুর্থ', erp: 'Four', sections: [], subjects: [] },
  { key: 'five', name: 'পঞ্চম', erp: 'Five', sections: [], subjects: [] },
  { key: 'six', name: 'ষষ্ঠ', erp: 'Six', sections: [], subjects: [] },
];

// Survey teachers: [key, Bengali name, ERP id]. Filled in when the school sends the list.
const TEACHERS: [key: string, name: string, erpId?: string][] = [];

const areaId = (key: string) => `survey-area-${key}`;

const documents: { _id: string; _type: string; [field: string]: unknown }[] = [
  ...AREAS.map(([key, name, group], i) => ({ _id: areaId(key), _type: 'surveyArea', key, name, group, order: i + 1 })),
  {
    _id: 'survey-template-t1-v1',
    _type: 'surveyTemplate',
    kind: 'T1',
    version: 1,
    title: 'স্টুডেন্ট সম্পর্কে শিক্ষকের রিভিউ',
    intro: 'যে ক্লাস ও বিষয়ে পড়ান, সেই ক্লাসের প্রত্যেক শিক্ষার্থীকে প্রতিটি প্রশ্নে মার্ক দিন।',
    scale: [10, 8, 6, 4],
    questions: T1_QUESTIONS.map(([key, text, area, hint]) => ({
      _key: key,
      _type: 'surveyQuestion',
      key,
      text,
      ...(hint ? { hint } : {}),
      type: 'marks',
      area: { _type: 'reference', _ref: areaId(area) },
      required: true,
      allowNA: false,
    })),
  },
  ...CLASSES.map((c, i) => ({
    _id: `survey-class-${c.key}`,
    _type: 'surveyClass',
    key: c.key,
    name: c.name,
    order: i + 1,
    erpClassNames: [c.erp],
    sections: c.sections.map(([key, name, erpSectionNames]) => ({ _key: key, _type: 'surveySection', key, name, erpSectionNames })),
    subjects: c.subjects.map(([key, name]) => ({ _key: key, _type: 'surveySubject', key, name })),
  })),
  ...TEACHERS.map(([key, name, erpId]) => ({
    _id: `survey-teacher-${key}`,
    _type: 'surveyTeacher',
    key,
    name,
    ...(erpId ? { erpId } : {}),
    active: true,
  })),
];

async function main() {
  const existing = new Set<string>(await client.fetch('*[_id in $ids]._id', { ids: documents.map((d) => d._id) }));
  const tx = client.transaction();
  for (const doc of documents) {
    if (overwrite) tx.createOrReplace(doc);
    else if (!existing.has(doc._id)) tx.create(doc);
  }
  const written = overwrite ? documents.length : documents.filter((d) => !existing.has(d._id)).length;
  if (written) await tx.commit();
  console.log(
    `${overwrite ? 'Replaced' : 'Created'} ${written} documents; ${overwrite ? 0 : existing.size} already existed. ` +
      `Areas ${AREAS.length}, T1 questions ${T1_QUESTIONS.length}, classes ${CLASSES.length}, teachers ${TEACHERS.length}.`
  );
  const missingSubjects = CLASSES.filter((c) => c.subjects.length === 0).length;
  if (missingSubjects) console.log(`Note: ${missingSubjects} classes have no subjects yet.`);
  if (!TEACHERS.length) console.log('Note: no survey teachers yet.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
