import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkFormConfig, type RawSection } from '../src/lib/admissions/form-config';

// Arranges the 2027 form's chapters as agreed (2026-10-08): groups, question order, side-by-side
// pairs, gender as buttons, class age ranges, and the skill questions hidden for Play. Wording,
// options and keys are kept exactly as they are. Works on the Studio DRAFT only; nothing is
// published. Dry run unless --write is passed. `--file draft.json` arranges an exported draft
// (Studio → Inspect → Raw JSON) without Sanity, to preview the result.

type Bi = { bengali: string; english: string };
type Field = { _key: string; key: string; group?: string; width?: string; type: string; options?: any[]; showWhen?: unknown; [k: string]: unknown };
type Group = { _key: string; _type: 'admissionGroup'; key: string; title: Bi; description?: Bi };
type Section = { _key: string; key: string; title: Bi; groups?: Group[]; fields: Field[]; [k: string]: unknown };

type Layout = { groups: { key: string; title?: Bi }[]; fields: [group: string | null, key: string, width?: 'half'][] };

const NOT_PLAY = ['nursery', 'kg', 'class_1', 'class_2', 'class_3', 'class_4', 'class_5', 'class_6'];

const LAYOUT: Record<string, Layout> = {
  student: {
    groups: [
      { key: 'photo_names', title: { bengali: 'পরিচয়', english: 'Identity' } },
      { key: 'birth_class' },
      { key: 'previous' },
      { key: 'current_level', title: { bengali: 'পড়াশোনার বর্তমান অবস্থা', english: 'Current level of learning' } },
      { key: 'character_goals', title: { bengali: 'আচরণ ও শিক্ষার লক্ষ্য', english: 'Character and goals' } },
      { key: 'documents' },
    ],
    fields: [
      ['photo_names', 'student_photo'],
      ['photo_names', 'student_name_bengali', 'half'],
      ['photo_names', 'student_name_english', 'half'],
      ['photo_names', 'student_gender'],
      ['birth_class', 'date_of_birth'],
      ['birth_class', 'desired_class'],
      ['previous', 'last_class_attended'],
      ['previous', 'previous_school'],
      ['current_level', 'quran_level'],
      ['current_level', 'arabic_level'],
      ['current_level', 'general_subjects_level'],
      ['character_goals', 'obeying_parents'],
      ['character_goals', 'purpose_of_study'],
      ['documents', 'student_birth_registration'],
    ],
  },
  father: {
    groups: [{ key: 'basic' }, { key: 'occupation' }, { key: 'faith' }, { key: 'family', title: { bengali: 'পরিবার ও জীবনযাপন', english: 'Family and lifestyle' } }, { key: 'other' }],
    fields: [
      ['basic', 'father_name', 'half'],
      ['basic', 'father_name_english', 'half'],
      ['basic', 'father_photo'],
      ['occupation', 'father_occupation'],
      ['occupation', 'father_organization', 'half'],
      ['occupation', 'father_designation', 'half'],
      ['occupation', 'father_monthly_income'],
      ['faith', 'father_prayer_times'],
      ['faith', 'father_prayer_location'],
      ['faith', 'father_daily_quran'],
      ['faith', 'father_islamic_clothing'],
      ['faith', 'father_mahram'],
      ['family', 'father_time_with_children'],
      ['family', 'father_tv_at_home'],
      ['family', 'father_screen_time'],
      ['family', 'father_smoking'],
      ['other', 'father_favorite_scholar'],
      ['other', 'father_facebook_id'],
    ],
  },
  mother: {
    groups: [{ key: 'basic' }, { key: 'occupation' }, { key: 'faith' }, { key: 'media' }, { key: 'other' }],
    fields: [
      ['basic', 'mother_name', 'half'],
      ['basic', 'mother_name_english', 'half'],
      ['occupation', 'mother_occupation'],
      ['occupation', 'mother_organization', 'half'],
      ['occupation', 'mother_designation', 'half'],
      ['faith', 'mother_prayer_times'],
      ['faith', 'mother_daily_quran'],
      ['faith', 'mother_islamic_clothing'],
      ['faith', 'mother_mahram'],
      ['media', 'mother_screen_time'],
      ['other', 'mother_favorite_scholar'],
      ['other', 'mother_facebook_id'],
    ],
  },
  contact: {
    groups: [],
    fields: [
      [null, 'present_address'],
      [null, 'father_phone', 'half'],
      [null, 'mother_phone', 'half'],
      [null, 'email'],
    ],
  },
};

/** Age at session start, from (included) and up to (not included); Nursery is 5. */
const CLASS_AGES: Record<string, [number, number]> = {
  play: [4, 5],
  nursery: [5, 6],
  kg: [6, 7],
  class_1: [7, 8],
  class_2: [8, 9],
  class_3: [9, 10],
  class_4: [10, 11],
  class_5: [11, 12],
  class_6: [12, 14],
};

const SKIPPED_FOR_PLAY = ['quran_level', 'arabic_level', 'general_subjects_level'];

export function arrange(sections: Section[]): { sections: Section[]; notes: string[] } {
  const notes: string[] = [];
  const out = sections.map((section) => {
    const layout = LAYOUT[section.key];
    if (!layout) return section;
    const byKey = new Map(section.fields.map((f) => [f.key, f]));
    const oldGroups = new Map((section.groups ?? []).map((g) => [g.key, g]));
    const groups: Group[] = layout.groups.map(({ key, title }) => {
      const old = oldGroups.get(key);
      if (!old && !title) throw new Error(`${section.key}: group ${key} needs a title`);
      return { ...(old ?? { _key: key, _type: 'admissionGroup' as const, key }), ...(title && { title }) } as Group;
    });
    const fields: Field[] = [];
    for (const [group, key, width] of layout.fields) {
      const field = byKey.get(key);
      if (!field) {
        notes.push(`${section.key}: “${key}” is not in the form; skipped.`);
        continue;
      }
      byKey.delete(key);
      const next: Field = { ...field };
      if (group) next.group = group;
      else delete next.group;
      if (width) next.width = width;
      else delete next.width;
      if (key === 'student_gender' && next.type === 'select') next.type = 'radio';
      if (key === 'desired_class') {
        next.options = (next.options ?? []).map((o) => {
          const ages = CLASS_AGES[o.value];
          return ages ? { ...o, ageMin: ages[0], ageMax: ages[1] } : o;
        });
      }
      if (SKIPPED_FOR_PLAY.includes(key)) {
        const classes = (byKey.get('desired_class') ?? fields.find((f) => f.key === 'desired_class'))?.options?.map((o: { value: string }) => o.value) ?? [];
        next.showWhen = { field: 'desired_class', values: NOT_PLAY.filter((v) => classes.includes(v)) };
      }
      fields.push(next);
    }
    // Anything added in the Studio that this layout does not know stays, after the rest, in its group.
    for (const field of byKey.values()) {
      notes.push(`${section.key}: “${field.key}” is not in the agreed layout; kept at the end${field.group ? ` (group ${field.group})` : ''}.`);
      fields.push(field);
    }
    return { ...section, groups, fields };
  });
  return { sections: out, notes };
}

function describe(sections: Section[]) {
  for (const s of sections) {
    console.log(`\n${s.title.bengali}`);
    const groups = s.groups ?? [];
    const keys = [...groups.map((g) => g.key), undefined];
    for (const gk of keys) {
      const fs = s.fields.filter((f) => (gk ? f.group === gk : !f.group || !groups.some((g) => g.key === f.group)));
      if (!fs.length) continue;
      if (gk) console.log(`  ${groups.find((g) => g.key === gk)!.title.bengali}`);
      for (const f of fs) {
        const extra = [f.width === 'half' ? 'side by side' : '', (f.showWhen as { field?: string } | undefined)?.field === 'desired_class' ? 'not for Play' : f.showWhen ? 'conditional' : '', f.key === 'student_gender' ? f.type : ''].filter(Boolean).join(', ');
        console.log(`    - ${(f as any).label?.bengali ?? f.key}${extra ? ` (${extra})` : ''}`);
      }
    }
  }
}

async function main() {
  const write = process.argv.includes('--write');
  const fileArg = process.argv.indexOf('--file');
  let doc: any;
  let client: ReturnType<typeof createClient> | null = null;
  if (fileArg > 0) {
    doc = JSON.parse(readFileSync(process.argv[fileArg + 1], 'utf8'));
  } else {
    config({ path: resolve(process.cwd(), '.env.local') });
    const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset, SANITY_API_TOKEN: token } = process.env;
    if (!projectId || !dataset || !token) throw new Error('Sanity project, dataset, and write token are required.');
    client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false, perspective: 'raw' });
    const documents: any[] = await client.fetch('*[_type == "preAdmissionForm"] | order(_updatedAt desc)');
    const published = documents.find((d) => !d._id.startsWith('drafts.'));
    doc = documents.find((d) => d._id === `drafts.${published?._id}`);
    if (!doc) {
      console.log('No draft of the pre-admission form exists. Run pnpm setup:admissions --write first.');
      return;
    }
  }
  if (!doc.sections?.length) {
    console.log('The draft has no 2027 chapters yet. Run pnpm setup:admissions --write first.');
    return;
  }
  const { sections, notes } = arrange(doc.sections);
  describe(sections);
  for (const n of notes) console.log(`\nNote: ${n}`);
  const problems = checkFormConfig(sections as unknown as RawSection[]);
  if (problems.length) {
    console.log('\nProblems (nothing saved):');
    for (const p of problems) console.log(`  - ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log('\nNo problems found.');
  if (!write || !client) {
    console.log(client ? 'Dry run. Rerun with --write to save this to the draft.' : 'Preview from a file only; nothing saved.');
    return;
  }
  await client.patch(doc._id).ifRevisionId(doc._rev).set({ sections }).commit();
  console.log('Saved to the draft. Review it in the Studio; nothing was published.');
}

if (process.argv[1]?.includes('arrange-admissions-form')) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    console.error('Arranging failed. If someone edited the form meanwhile, run it again.');
    process.exitCode = 1;
  });
}

/** For checks: arrange an exported draft and write it next to the input as *.arranged.json. */
export function arrangeFile(path: string, out: string) {
  const doc = JSON.parse(readFileSync(path, 'utf8'));
  writeFileSync(out, JSON.stringify({ ...doc, sections: arrange(doc.sections).sections }, null, 2));
}
