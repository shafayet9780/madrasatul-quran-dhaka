import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { FormConfigError, buildSnapshot } from '../src/lib/admissions/snapshot';
import { applyFeeUpdates, applyFormUpdates } from '../src/lib/admissions/updates-2027';

// The pre-admission 2027 updates (docs/pre-admission-2027-updates.md) saved as Studio DRAFTS of the
// form and of Fees & Discounts. Nothing is published. Dry run unless --write is passed. Each step
// runs once: a rerun skips what is already done and keeps edits made in the Studio.
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

/** The draft if there is one, else the published document; and the draft ID to write to. */
async function load(filter: string) {
  const documents: any[] = await client.fetch(`*[${filter}] | order(_updatedAt desc)`);
  const published = documents.find((d) => !d._id.startsWith('drafts.'));
  const draftId = published ? `drafts.${published._id}` : documents[0]?._id;
  const draft = documents.find((d) => d._id === draftId);
  return { published, draft, base: draft ?? published, draftId };
}

/** Writes `fields` to the draft, creating it from the published document when needed. */
async function saveDraft({ published, draft, draftId }: Awaited<ReturnType<typeof load>>, fields: Record<string, unknown>) {
  if (draft) await client.patch(draft._id).ifRevisionId(draft._rev).set(fields).commit();
  else {
    const { _rev, _createdAt, _updatedAt, _system, ...rest } = published;
    await client.create({ ...rest, ...fields, _id: draftId });
  }
}

async function main() {
  const form = await load('_type == "preAdmissionForm"');
  const fees = await load('_id in ["feeSettings", "drafts.feeSettings"]');
  if (!form.base || !fees.base) {
    console.log(`The pre-admission form or Fees & Discounts is missing in ${projectId}/${dataset}. Nothing to do.`);
    return;
  }
  const formUpdate = applyFormUpdates(form.base);
  const feeUpdate = applyFeeUpdates(fees.base);

  console.log(`Form (${form.draft ? 'draft' : 'published'} ${form.base._id}):`);
  for (const line of formUpdate.changed) console.log(`  - ${line}`);
  if (!formUpdate.changed.length) console.log('  nothing to change.');
  console.log(`Fees & Discounts (${fees.draft ? 'draft' : 'published'}):`);
  for (const line of feeUpdate.changed) console.log(`  - ${line}`);
  if (!feeUpdate.changed.length) console.log('  nothing to change.');

  // The result must be a form the website can open; otherwise nothing is saved.
  const { changed: _f, ...formFields } = formUpdate;
  const { changed: _t, ...feeFields } = feeUpdate;
  try {
    const snapshot = buildSnapshot({ ...form.base, ...formFields, fees: { ...fees.base, ...feeFields } });
    const stops = snapshot.transport?.routes.reduce((n, r) => n + r.stops.length, 0) ?? 0;
    console.log(`\nChecked: the updated form is valid (${snapshot.transport?.routes.length ?? 0} routes, ${stops} stops).`);
  } catch (e) {
    if (!(e instanceof FormConfigError)) throw e;
    console.log('\nThe updated form would not be valid, so nothing is saved:');
    for (const p of e.problems) console.log(`  - ${p}`);
    process.exitCode = 1;
    return;
  }

  if (!formUpdate.changed.length && !feeUpdate.changed.length) return;
  if (!write) {
    console.log('\nDry run. Rerun with --write to save these as drafts.');
    return;
  }
  if (formUpdate.changed.length) await saveDraft(form, formFields);
  if (feeUpdate.changed.length) await saveDraft(fees, feeFields);
  console.log('\nSaved as drafts. Review and publish both documents in Studio. Nothing was published automatically.');
}
main().catch((e) => {
  console.error(`Setup failed (${e instanceof Error ? e.message : e}). Check credentials, permissions, and concurrent editorial changes, then rerun.`);
  process.exitCode = 1;
});
