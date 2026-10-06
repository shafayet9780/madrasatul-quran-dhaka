/**
 * Seeds survey reference data into Sanity: areas, the T1/G1/G2 templates, classes and survey teachers.
 * Writes published documents with fixed IDs to the dataset in .env.local.
 *
 *   pnpm exec tsx scripts/survey-seed.ts              # create missing documents only
 *   pnpm exec tsx scripts/survey-seed.ts --overwrite  # replace seeded documents (only before any round opens)
 *   pnpm exec tsx scripts/survey-seed.ts --teachers ~/Downloads/teachers_list.xlsx
 *                                                     # also create survey teachers from the ERP teacher export
 *
 * Teachers come from the export, not from this file: the repository is public and the ERP ID starts a survey.
 */
import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import ExcelJS from 'exceljs';
import { resolve } from 'node:path';
import { normaliseTeacherId, titleCase } from '../src/lib/survey/normalise';

config({ path: resolve(process.cwd(), '.env.local') });
const {
  NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
  NEXT_PUBLIC_SANITY_DATASET: dataset,
  SANITY_API_TOKEN: token,
} = process.env;
if (!projectId || !dataset || !token) throw new Error('Sanity project, dataset, and write token are required.');

const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false });
const overwrite = process.argv.includes('--overwrite');
const teachersFile = process.argv.includes('--teachers') ? process.argv[process.argv.indexOf('--teachers') + 1] : undefined;
if (process.argv.includes('--teachers') && (!teachersFile || teachersFile.startsWith('--'))) throw new Error('--teachers needs the path of the ERP teacher export.');

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

const T1_QUESTIONS: [key: string, text: string, shortLabel: string, area: string, hint?: string][] = [
  ['attendance', 'ক্লাসে নিয়মিত উপস্থিত হয় কি না?', 'নিয়মিত উপস্থিতি', 'attendance'],
  ['attention', 'ক্লাসে মনোযোগী কি না?', 'মনোযোগ', 'focus-habits'],
  ['peer-conduct', 'অন্য বাচ্চাদের সাথে মারামারি বা বাজে কথা বলে কি না?', 'মারামারি/বাজে কথা', 'peer-conduct', '১০ = সমস্যা নেই, ৪ = প্রায়ই করে'],
  ['follows-instructions', 'শিক্ষকের নির্দেশ পালন করে কি না?', 'নির্দেশ পালন', 'obedience'],
  ['guardian-coordination', 'অভিভাবক শিক্ষকের সাথে সঠিক কোর্ডিনেশন করে কি না?', 'অভিভাবকের কোর্ডিনেশন', 'guardian-cooperation'],
  ['guardian-off-hours', 'অভিভাবক নির্ধারিত সময়ের বাইরে শিক্ষকের সাথে যোগাযোগ করে কি না?', 'নির্ধারিত সময়ের বাইরে যোগাযোগ', 'guardian-cooperation', '১০ = কখনো করেন না, ৪ = প্রায়ই করেন'],
  ['assessment-80', 'কুইজ বা অন্যান্য এসেসমেন্ট এ শতকরা আশিভাগ মার্ক পায় কি না?', 'এসেসমেন্টে ৮০%', 'results'],
];

const GUARDIAN_INTRO = 'দয়া করে পূর্ণ আমানতদারিতার সাথে রিভিউ দিবেন (উপযুক্ত প্রমাণ চাওয়া হতে পারে)।';

// G1 (guardian rates teaching, per subject): the school's current Google Form, 2026-10-05.
const G1_QUESTIONS: [key: string, text: string, shortLabel: string, area: string, hint?: string][] = [
  ['lesson-learned', 'পড়ানো লেসন আপনার সন্তান শিখেছে কি না?', 'লেসন শেখা', 'teaching-effectiveness'],
  ['class-conduct', 'ক্লাসে উত্তম আচরণ করা হয় কি না?', 'ক্লাসে আচরণ', 'conduct-tarbiyah'],
  ['classwork-checked', 'ক্লাস ওয়ার্ক ঠিকঠাক চেক করা হয় কি না?', 'ক্লাস ওয়ার্ক চেক', 'assessment'],
  ['homework-checked', 'হোমওয়ার্ক নিয়মিত চেক করা হয় কি না?', 'হোমওয়ার্ক চেক', 'assessment'],
  ['extra-homework', 'অতিরিক্ত হোমওয়ার্ক দেওয়া হয় কি না?', 'অতিরিক্ত হোমওয়ার্ক', 'assessment', '১০ = পরিমাণ ঠিক আছে, ৪ = অনেক বেশি'],
  ['quiz-revision', 'কুইজের সিলেবাস রিভাইজ করা হয় কি না?', 'কুইজ রিভিশন', 'assessment'],
  ['exam-scripts', 'পরীক্ষার খাতা ঠিকঠাক চেক করে বাসায় পাঠানো হয় কি না?', 'পরীক্ষার খাতা', 'assessment'],
  ['informs-problems', 'আপনার সন্তানের কোনো সমস্যা বা দুর্বলতা থাকলে আপনাকে অবগত করা হয় কি না?', 'সমস্যা জানানো', 'guardian-communication'],
  ['child-likes-teacher', 'আপনার সন্তান শিক্ষককে পছন্দ করে কি না?', 'শিক্ষককে পছন্দ', 'conduct-tarbiyah'],
  ['overall-satisfaction', 'সার্বিকভাবে আপনি শিক্ষকের কাজে সন্তুষ্ট কি না?', 'সার্বিক সন্তুষ্টি', 'overall-satisfaction'],
];

// G2 (guardian rates own child): descriptive options with hidden marks (spec §2.4), shown in this order.
type G2Question = { key: string; text: string; shortLabel: string; area: string; options: [key: string, label: string, mark: number][]; hint?: string; naLabel?: string; unscored?: boolean };
const G2_QUESTIONS: G2Question[] = [
  { key: 'attendance', text: 'নিয়মিত ক্লাস করে কি না?', shortLabel: 'উপস্থিতি', area: 'attendance', options: [['above-90', 'উপস্থিতি > ৯০%', 10], ['80-90', 'উপস্থিতি ৮০–৯০%', 8], ['70-80', 'উপস্থিতি ৭০–৮০%', 6], ['below-70', 'উপস্থিতি < ৭০%', 4]] },
  // Study hours depend on age; shown as answers only, never marked (owner, 2026-10-06).
  { key: 'study-at-home', unscored: true, text: 'বাসায় নিয়মিত পড়া পড়ে কি না?', hint: 'নন ডে কেয়ার শিক্ষার্থীদের জন্য প্রযোজ্য', naLabel: 'প্রযোজ্য নয় (ডে কেয়ার)', shortLabel: 'বাসায় পড়া', area: 'focus-habits', options: [['4h', '৪ ঘন্টা +', 10], ['3h', '৩ ঘন্টা +', 8.5], ['2h', '২ ঘন্টা +', 7], ['1h', '১ ঘন্টা +', 5.5], ['under-1h', '১ ঘন্টার কম', 4]] },
  { key: 'homework', text: 'হোমওয়ার্ক দেওয়া হলে নিয়মিত করে কি না?', shortLabel: 'হোমওয়ার্ক', area: 'focus-habits', options: [['regular', 'নিয়মিত করে', 10], ['sometimes-missed', 'মাঝে মাঝে বাদ যায়', 8], ['sometimes', 'মাঝে মাঝে করে', 6], ['never', 'করে না', 4]] },
  { key: 'devices', text: 'নিজে থেকে মোবাইল বা ডিভাইস দেখে কি না?', shortLabel: 'মোবাইল/ডিভাইস', area: 'interest-home', options: [['never', 'দেখে না', 10], ['1-2-weekly', 'সপ্তাহে ২/১ বার', 7], ['3-plus-weekly', 'সপ্তাহে ৩/৪ বার বা তার বেশি', 4]] },
  { key: 'likes-madrasa', text: 'বাচ্চা মাদ্রাসা পছন্দ করে কি না?', shortLabel: 'মাদ্রাসা পছন্দ', area: 'interest-home', options: [['very', 'অনেক পছন্দ করে', 10], ['fairly', 'মোটামুটি পছন্দ করে', 8], ['little', 'কম পছন্দ করে', 6], ['not', 'পছন্দ করে না', 4]] },
  { key: 'listens-parents', text: 'পিতামাতার কথা ঠিকঠাক শোনে কি না?', shortLabel: 'কথা শোনা', area: 'obedience', options: [['always', 'ঠিকঠাক শোনে', 10], ['sometimes-not', 'মাঝে মাঝে শোনে না', 8], ['sometimes', 'মাঝে মাঝে শোনে', 6], ['never', 'শোনে না', 4]] },
  { key: 'peer-complaints', text: 'ক্লাসে অন্য বাচ্চাদের সাথে মারামারি বা বাজে কথা বলে এই অভিযোগ মাদ্রাসা থেকে আসে কি না?', shortLabel: 'মারামারির অভিযোগ', area: 'peer-conduct', options: [['often', 'প্রায়ই আসে', 4], ['sometimes', 'মাঝে মাঝে আসে', 7], ['never', 'আসে না', 10]] },
  { key: 'quiz-score', text: 'কুইজে শতকরা কত নাম্বার পায়?', shortLabel: 'কুইজের নম্বর', area: 'results', options: [['80', '৮০%+', 10], ['70', '৭০%+', 8.5], ['60', '৬০%+', 7], ['50', '৫০%+', 5.5], ['below-50', '৫০% এর কম', 4]] },
  { key: 'study-satisfaction', text: 'বাচ্চার সার্বিক পড়াশোনায় আপনি সন্তুষ্ট কি না?', shortLabel: 'পড়াশোনায় সন্তুষ্টি', area: 'interest-home', options: [['satisfied', 'সন্তুষ্ট', 10], ['fairly', 'মোটামুটি সন্তুষ্ট', 7], ['not', 'সন্তুষ্ট নই', 4]] },
];

type Section = [key: string, name: string, erpSectionNames: string[]];
const AB: Section[] = [
  ['a', 'A', ['Section A']],
  ['b', 'B', ['Section B']],
];
const BOYS_GIRLS: Section[] = [
  ['male', 'বালক', ['Male']],
  ['female', 'বালিকা', ['Female']],
];

// Subjects per class: [key, Bengali name]. In Play one teacher teaches everything, so it is rated once.
const PLAY: [string, string][] = [['all', 'সব বিষয়']];
const PRIMARY: [string, string][] = [
  ['arabic', 'আরবি'],
  ['islam', 'ইসলাম শিক্ষা'],
  ['bangla', 'বাংলা'],
  ['english', 'ইংরেজি'],
  ['math', 'গণিত'],
];
const SIX: [string, string][] = [...PRIMARY, ['science', 'বিজ্ঞান'], ['bgs', 'বাংলাদেশ ও বিশ্বপরিচয়']];

const CLASSES: { key: string; name: string; erp: string; sections: Section[]; subjects: [string, string][] }[] = [
  { key: 'play', name: 'প্লে', erp: 'Play', sections: [], subjects: PLAY },
  { key: 'nursery', name: 'নার্সারি', erp: 'Nursery', sections: AB, subjects: PRIMARY },
  { key: 'kg', name: 'কেজি', erp: 'KG', sections: AB, subjects: PRIMARY },
  { key: 'one', name: 'প্রথম', erp: 'One', sections: [], subjects: PRIMARY },
  { key: 'two', name: 'দ্বিতীয়', erp: 'Two', sections: BOYS_GIRLS, subjects: PRIMARY },
  { key: 'three', name: 'তৃতীয়', erp: 'Three', sections: BOYS_GIRLS, subjects: PRIMARY },
  { key: 'four', name: 'চতুর্থ', erp: 'Four', sections: [], subjects: PRIMARY },
  { key: 'five', name: 'পঞ্চম', erp: 'Five', sections: [], subjects: PRIMARY },
  { key: 'six', name: 'ষষ্ঠ', erp: 'Six', sections: [], subjects: SIX },
];

/** Survey teachers from the ERP export (columns ID, Name, Name (Bangla)): [ERP ID, display name]. */
async function readTeachers(file: string): Promise<[erpId: string, name: string][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const sheet = workbook.worksheets[0];
  const rows: string[][] = [];
  sheet.eachRow((row) => rows.push((row.values as unknown[]).slice(1).map((v) => (v == null ? '' : String(v).trim()))));
  const headerIndex = rows.findIndex((r) => r.some((c) => c.toLowerCase() === 'id') && r.some((c) => c.toLowerCase() === 'name'));
  if (headerIndex === -1) throw new Error('No ID / Name header in the teacher export.');
  const header = rows[headerIndex].map((c) => c.toLowerCase());
  const [id, en, bn] = ['id', 'name', 'name (bangla)'].map((title) => header.indexOf(title));
  return rows
    .slice(headerIndex + 1)
    .map((r): [string, string] => [normaliseTeacherId(r[id] ?? ''), (bn >= 0 && r[bn]) || titleCase(r[en] ?? '')])
    .filter(([erpId, name]) => erpId && name);
}

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
    questions: T1_QUESTIONS.map(([key, text, shortLabel, area, hint]) => ({
      _key: key,
      _type: 'surveyQuestion',
      key,
      text,
      shortLabel,
      ...(hint ? { hint } : {}),
      type: 'marks',
      area: { _type: 'reference', _ref: areaId(area) },
      required: true,
      allowNA: false,
    })),
  },
  {
    _id: 'survey-template-g1-v1',
    _type: 'surveyTemplate',
    kind: 'G1',
    version: 1,
    title: 'ক্লাস পরিচালনার উপর অভিভাবক রিভিউ',
    intro: GUARDIAN_INTRO,
    commentLabel: 'বিশেষ কোন পরামর্শ ও মন্তব্য',
    layout: 'by-subject',
    scale: [10, 8, 6, 4],
    questions: G1_QUESTIONS.map(([key, text, shortLabel, area, hint]) => ({
      _key: key,
      _type: 'surveyQuestion',
      key,
      text,
      shortLabel,
      ...(hint ? { hint } : {}),
      type: 'marks',
      area: { _type: 'reference', _ref: areaId(area) },
      required: true,
      allowNA: false,
    })),
  },
  {
    _id: 'survey-template-g2-v1',
    _type: 'surveyTemplate',
    kind: 'G2',
    version: 1,
    title: 'শিক্ষার্থীর উপর অভিভাবক রিভিউ',
    intro: GUARDIAN_INTRO,
    commentLabel: 'কোন পরামর্শ ও মন্তব্য',
    scale: [10, 8, 6, 4],
    questions: G2_QUESTIONS.map((q) => ({
      _key: q.key,
      _type: 'surveyQuestion',
      key: q.key,
      text: q.text,
      shortLabel: q.shortLabel,
      ...(q.hint ? { hint: q.hint } : {}),
      type: 'options',
      options: q.options.map(([key, label, mark]) => ({ _key: key, _type: 'surveyOption', key, label, mark })),
      area: { _type: 'reference', _ref: areaId(q.area) },
      required: true,
      allowNA: Boolean(q.naLabel),
      ...(q.naLabel ? { naLabel: q.naLabel } : {}),
      ...(q.unscored ? { unscored: true } : {}),
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
];

async function main() {
  const TEACHERS = teachersFile ? await readTeachers(resolve(teachersFile.replace(/^~/, process.env.HOME ?? '~'))) : [];
  documents.push(...TEACHERS.map(([erpId, name]) => ({ _id: `survey-teacher-${erpId}`, _type: 'surveyTeacher', key: erpId, name, active: true })));
  const existing = new Set<string>(await client.fetch('*[_id in $ids]._id', { ids: documents.map((d) => d._id) }));
  const tx = client.transaction();
  for (const doc of documents) {
    // Teachers are only ever added: the admin edits their names and Active flag in the Studio.
    if (overwrite && doc._type !== 'surveyTeacher') tx.createOrReplace(doc);
    else if (!existing.has(doc._id)) tx.create(doc);
  }
  const written = documents.filter((d) => (overwrite && d._type !== 'surveyTeacher') || !existing.has(d._id)).length;
  if (written) await tx.commit();
  // Fields added after the first seed: fill them on existing documents without overwriting edits.
  if (!overwrite && existing.has('survey-template-t1-v1')) {
    const missing = Object.fromEntries(T1_QUESTIONS.map(([key, , shortLabel]) => [`questions[_key=="${key}"].shortLabel`, shortLabel]));
    await client.patch('survey-template-t1-v1').setIfMissing(missing).commit();
  }
  // Classes seeded before the school sent its lists: fill empty subject lists and ERP section names.
  if (!overwrite) {
    const seeded = await client.fetch<{ _id: string; subjects?: unknown[]; sections?: { _key: string; erpSectionNames?: string[] }[] }[]>(
      '*[_type == "surveyClass" && _id in $ids]{ _id, subjects, sections[]{ _key, erpSectionNames } }',
      { ids: CLASSES.map((c) => `survey-class-${c.key}`) }
    );
    for (const doc of seeded) {
      const seed = documents.find((d) => d._id === doc._id) as unknown as { subjects: unknown[]; sections: { _key: string; erpSectionNames: string[] }[] };
      const set: Record<string, unknown> = {};
      if (!doc.subjects?.length && seed.subjects.length) set.subjects = seed.subjects;
      for (const section of doc.sections ?? []) {
        const names = seed.sections.find((s) => s._key === section._key)?.erpSectionNames ?? [];
        if (!section.erpSectionNames?.length && names.length) set[`sections[_key=="${section._key}"].erpSectionNames`] = names;
      }
      if (Object.keys(set).length) {
        await client.patch(doc._id).set(set).commit();
        console.log(`Filled ${Object.keys(set).join(', ')} on ${doc._id}.`);
      }
    }
  }
  console.log(
    `${overwrite ? 'Replaced' : 'Created'} ${written} documents; ${overwrite ? 0 : existing.size} already existed. ` +
      `Areas ${AREAS.length}, T1 questions ${T1_QUESTIONS.length}, G1 ${G1_QUESTIONS.length}, G2 ${G2_QUESTIONS.length}, classes ${CLASSES.length}, teachers ${TEACHERS.length}.`
  );
  const missingSubjects = CLASSES.filter((c) => c.subjects.length === 0).length;
  if (missingSubjects) console.log(`Note: ${missingSubjects} classes have no subjects yet.`);
  if (!TEACHERS.length) console.log('Note: no teachers created (pass --teachers <ERP teacher export .xlsx>).');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
