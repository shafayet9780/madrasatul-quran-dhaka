import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { checkFormConfig, type RawSection } from '../src/lib/admissions/form-config';
import { DEFAULT_CYCLE, convertLegacyForm } from '../src/lib/admissions/legacy-form';

// Builds the 2027 form ("Form 2027" and "Cycle 2027" tabs) from the current form's questions and
// saves it as a Studio DRAFT for review. Nothing is published. Dry run unless --write is passed.
// Never overwrites a form that already has 2027 chapters.
config({ path: resolve(process.cwd(), '.env.local') });
const {
  NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
  NEXT_PUBLIC_SANITY_DATASET: dataset,
  SANITY_API_TOKEN: token,
} = process.env;
if (!projectId || !dataset || !token)
  throw new Error('Sanity project, dataset, and write token are required.');
const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
  perspective: 'raw',
});
const write = process.argv.includes('--write');

async function main() {
  const documents = await client.fetch(
    '*[_id in ["preAdmissionForm", "drafts.preAdmissionForm"]]'
  );
  const draft = documents.find((d: any) => d._id === 'drafts.preAdmissionForm');
  const published = documents.find((d: any) => d._id === 'preAdmissionForm');
  const base = draft ?? published;
  if (!base) {
    console.log('No pre-admission form document exists. Nothing to convert.');
    return;
  }
  if (base.sections?.length) {
    console.log(
      `The ${draft ? 'draft' : 'published'} form already has 2027 chapters. Nothing was changed.`
    );
    return;
  }

  const { sections, report } = convertLegacyForm(base);
  console.log(
    `Converted the ${draft ? 'draft' : 'published'} form: ${report.chapters} chapters, ${report.fields} fields.`
  );
  for (const s of sections as any[])
    console.log(
      `  ${s.title.bengali}: ${s.fields.map((f: any) => f.key + (f.role ? ` [${f.role}]` : '')).join(', ')}`
    );
  const problems = checkFormConfig(sections as unknown as RawSection[]);
  if (problems.length) {
    console.log('\nProblems to fix in Studio before publishing:');
    for (const p of problems) console.log(`  - ${p}`);
  }
  console.log(`\n${base.cycle ? 'Existing cycle settings kept.' : 'Cycle 2027 gets placeholder settings (session 2027, fees ৳500 + ৳500).'}`);
  console.log('Still to do in Studio:');
  for (const t of report.todo) console.log(`  - ${t}`);

  if (!write) {
    console.log('\nDry run. Rerun with --write to save this as a draft.');
    return;
  }
  if (draft) {
    await client
      .patch(draft._id)
      .ifRevisionId(draft._rev)
      .setIfMissing({ sections, cycle: DEFAULT_CYCLE })
      .commit();
  } else {
    const { _rev, _createdAt, _updatedAt, ...rest } = published;
    await client.create({
      ...rest,
      _id: 'drafts.preAdmissionForm',
      sections,
      cycle: published.cycle ?? DEFAULT_CYCLE,
    });
  }
  console.log(
    '\nSaved as a draft. Review and publish in Studio. Nothing was published automatically.'
  );
}
main().catch(() => {
  console.error(
    'Setup failed. Check credentials, permissions, and concurrent editorial changes, then rerun.'
  );
  process.exitCode = 1;
});
