import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { initialFeeSettings, prepareContactDraft } from '../src/lib/fee-setup';
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
async function main() {
  const existing = await client.fetch(
    '*[_id in ["feeSettings", "drafts.feeSettings"]]{_id}'
  );
  if (existing.length)
    console.log('Fees: existing draft or published content preserved.');
  else {
    await client.createIfNotExists(initialFeeSettings);
    console.log('Fees: created a reviewable draft.');
  }
  const documents = await client.fetch(
    '*[_id in ["siteSettings", "drafts.siteSettings"]]'
  );
  const draft = documents.find((d: any) => d._id === 'drafts.siteSettings');
  const published = documents.find((d: any) => d._id === 'siteSettings');
  const prepared = prepareContactDraft(draft, published);
  if (prepared && draft) {
    const fields: Record<string, string> = {};
    for (const key of ['admissionsPhone', 'whatsappNumber'])
      if (!draft.contactInfo?.[key] && prepared.contactInfo[key])
        fields[`contactInfo.${key}`] = prepared.contactInfo[key];
    await client
      .patch(draft._id)
      .ifRevisionId(draft._rev)
      .setIfMissing({ contactInfo: {} })
      .set(fields)
      .commit();
    console.log(
      'Contact settings: added missing destinations to the existing draft.'
    );
  } else if (prepared) {
    await client.createIfNotExists(prepared);
    console.log('Contact settings: prepared a reviewable draft.');
  } else
    console.log(
      'Contact settings: existing values preserved, or no Site Settings document exists.'
    );
  console.log(
    'Review and publish in Studio. Nothing was published automatically.'
  );
}
main().catch(() => {
  console.error(
    'Setup failed. Check credentials, permissions, and concurrent editorial changes, then rerun.'
  );
  process.exitCode = 1;
});
