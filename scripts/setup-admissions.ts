import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { checkFormConfig, type RawSection } from '../src/lib/admissions/form-config';
import { DECLARATION_ENGLISH } from '../src/lib/admissions/legacy-english';
import { DEFAULT_CYCLE, convertLegacyForm, englishPatches } from '../src/lib/admissions/legacy-form';

// Builds the 2027 form ("Form 2027" and "Cycle 2027" tabs) from the current form's questions and
// saves it as a Studio DRAFT for review. Nothing is published. Dry run unless --write is passed.
// A form that already has 2027 chapters is never rebuilt; only missing English text is added.
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
  // The Studio list creates the form with a random ID, so it is found by type. Its draft (if any)
  // is drafts.<ID>; the live site reads the first published one, which is the one converted.
  const documents: any[] = await client.fetch('*[_type == "preAdmissionForm"] | order(_updatedAt desc)');
  const publishedDocs = documents.filter((d) => !d._id.startsWith('drafts.'));
  if (publishedDocs.length > 1)
    console.log(`Note: ${publishedDocs.length} published pre-admission forms exist (${publishedDocs.map((d) => d._id).join(', ')}); using ${publishedDocs[0]._id}.`);
  const published = publishedDocs[0];
  const draftId = published ? `drafts.${published._id}` : documents.find((d) => d._id.startsWith('drafts.'))?._id;
  const draft = documents.find((d) => d._id === draftId);
  const base = draft ?? published;
  if (!base || !draftId) {
    console.log(`No pre-admission form document exists in ${projectId}/${dataset}. Nothing to convert.`);
    return;
  }
  console.log(`Form document: ${published?._id ?? '(draft only)'}${draft ? ' (with an unpublished draft, which is used)' : ''}.`);
  if (base.sections?.length) {
    const patches = englishPatches(base.sections, base.declarationText);
    const count = Object.keys(patches).length;
    console.log(
      `The ${draft ? 'draft' : 'published'} form already has 2027 chapters; they are kept. Missing English texts: ${count}.`
    );
    if (!count) return;
    if (!write) {
      console.log('Dry run. Rerun with --write to add the English texts to the draft.');
      return;
    }
    if (!draft) {
      const { _rev, _createdAt, _updatedAt, ...rest } = published;
      await client.createIfNotExists({ ...rest, _id: draftId });
    }
    const current = await client.getDocument(draftId);
    await client.patch(draftId).ifRevisionId(current!._rev).setIfMissing(patches).commit();
    console.log('Added the English texts to the draft. Review and publish in Studio.');
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
      .setIfMissing(draft.declarationText?.bengali ? { 'declarationText.english': DECLARATION_ENGLISH } : {})
      .commit();
  } else {
    const { _rev, _createdAt, _updatedAt, ...rest } = published;
    await client.create({
      ...rest,
      _id: draftId,
      sections,
      cycle: published.cycle ?? DEFAULT_CYCLE,
      ...(published.declarationText?.bengali &&
        !published.declarationText.english && {
          declarationText: { ...published.declarationText, english: DECLARATION_ENGLISH },
        }),
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
