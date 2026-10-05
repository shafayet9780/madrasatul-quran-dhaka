import type { RoundSnapshot } from '../snapshot';

// Sample T1 round for local development and end-to-end tests. Names are illustrative only.
const SUBJECTS = [
  ['quran', 'কুরআন'],
  ['arabic', 'আরবি'],
  ['bangla', 'বাংলা'],
  ['english', 'ইংরেজি'],
  ['math', 'গণিত'],
].map(([key, name]) => ({ key, name }));

const SHORT_LABELS: Record<string, string> = {"attendance": "নিয়মিত উপস্থিতি", "attention": "মনোযোগ", "peer-conduct": "মারামারি/বাজে কথা", "follows-instructions": "নির্দেশ পালন", "guardian-coordination": "অভিভাবকের কোর্ডিনেশন", "guardian-off-hours": "নির্ধারিত সময়ের বাইরে যোগাযোগ", "assessment-80": "এসেসমেন্টে ৮০%"};

const AB = [{ key: 'a', name: 'A' }, { key: 'b', name: 'B' }];
const BOYS_GIRLS = [{ key: 'male', name: 'বালক' }, { key: 'female', name: 'বালিকা' }];

export function t1FixtureSnapshot(takenAt = new Date()): RoundSnapshot {
  return {
    takenAt: takenAt.toISOString(),
    template: {
      id: 'survey-template-t1-v1',
      version: 1,
      kind: 'T1',
      title: 'স্টুডেন্ট সম্পর্কে শিক্ষকের রিভিউ',
      intro: 'যে ক্লাস ও বিষয়ে পড়ান, সেই ক্লাসের প্রত্যেক শিক্ষার্থীকে প্রতিটি প্রশ্নে মার্ক দিন।',
      scale: [10, 8, 6, 4],
      questions: [
        ['attendance', 'ক্লাসে নিয়মিত উপস্থিত হয় কি না?', 'attendance'],
        ['attention', 'ক্লাসে মনোযোগী কি না?', 'focus-habits'],
        ['peer-conduct', 'অন্য বাচ্চাদের সাথে মারামারি বা বাজে কথা বলে কি না?', 'peer-conduct', '১০ = সমস্যা নেই, ৪ = প্রায়ই করে'],
        ['follows-instructions', 'শিক্ষকের নির্দেশ পালন করে কি না?', 'obedience'],
        ['guardian-coordination', 'অভিভাবক শিক্ষকের সাথে সঠিক কোর্ডিনেশন করে কি না?', 'guardian-cooperation'],
        ['guardian-off-hours', 'অভিভাবক নির্ধারিত সময়ের বাইরে শিক্ষকের সাথে যোগাযোগ করে কি না?', 'guardian-cooperation', '১০ = কখনো করেন না, ৪ = প্রায়ই করেন'],
        ['assessment-80', 'কুইজ বা অন্যান্য এসেসমেন্ট এ শতকরা আশিভাগ মার্ক পায় কি না?', 'results'],
      ].map(([key, text, areaKey, hint]) => ({
        key,
        text,
        shortLabel: SHORT_LABELS[key],
        ...(hint ? { hint } : {}),
        type: 'marks' as const,
        options: [],
        areaKey,
        required: true,
        allowNA: false,
      })),
    },
    areas: [
      ['attendance', 'উপস্থিতি'],
      ['focus-habits', 'মনোযোগ ও পড়ার অভ্যাস'],
      ['peer-conduct', 'সহপাঠীদের সাথে আচরণ'],
      ['obedience', 'আনুগত্য'],
      ['guardian-cooperation', 'অভিভাবকের সহযোগিতা'],
      ['results', 'পড়াশোনার ফলাফল'],
    ].map(([key, name]) => ({ key, name, group: 'student' as const })),
    classes: [
      ['play', 'প্লে', []],
      ['nursery', 'নার্সারি', AB],
      ['kg', 'কেজি', AB],
      ['one', 'প্রথম', []],
      ['two', 'দ্বিতীয়', BOYS_GIRLS],
      ['three', 'তৃতীয়', BOYS_GIRLS],
      ['four', 'চতুর্থ', []],
      ['five', 'পঞ্চম', []],
      ['six', 'ষষ্ঠ', []],
    ].map(([key, name, sections]) => ({
      key: key as string,
      name: name as string,
      sections: sections as { key: string; name: string }[],
      subjects: SUBJECTS,
    })),
    // Keys are ERP IDs, as in the Studio.
    teachers: [
      ['90001', 'উস্তাদ আব্দুল্লাহ'],
      ['90002', 'উস্তাদ হামযা'],
      ['90003', 'উস্তাযা মারইয়াম'],
      ['90004', 'উস্তাযা সুমাইয়া'],
      ['90005', 'উস্তাদ ইউসুফ'],
    ].map(([key, name]) => ({ key, name })),
  };
}
