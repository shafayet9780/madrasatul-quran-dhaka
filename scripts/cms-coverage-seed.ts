// The CMS coverage seed of October 2026 (docs/cms-coverage.md): fills the new Studio fields with the content the site
// showed from its code, in one transaction. Only what is empty is filled (the address is replaced only while it is still
// the old one), so it is safe to run again and never overwrites an editor's change. Run it after studio-cleanup.ts.
//
//   pnpm exec tsx scripts/cms-coverage-seed.ts --dataset production --dry-run   # lists every change, writes nothing
//   pnpm exec tsx scripts/cms-coverage-seed.ts --dataset production
//
// Until the release the live site reads `development`: writing there needs --yes-development. What it adds there is
// new (Curriculum, Policies, the hero text, the new School details fields), except the tidy address and the Mirpur DOHS
// landmark, which the live site shows at once.
import { createClient, type Transaction } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import seed from './data/cms-coverage-seed.json';
import { homeSeed, siteSeed } from '../src/lib/cms-coverage';

config({ path: resolve(process.cwd(), '.env.local') });
const args = process.argv.slice(2);
const dataset = args[args.indexOf('--dataset') + 1];
const dryRun = args.includes('--dry-run');
const stop = (message: string): never => {
  console.error(message);
  process.exit(1);
};
if (!args.includes('--dataset') || !dataset || dataset.startsWith('--')) stop('Name the dataset: --dataset production');
if (dataset === 'development' && !dryRun && !args.includes('--yes-development')) {
  stop('`development` is the live site’s dataset until the release; add --yes-development to write there.');
}
const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, SANITY_API_TOKEN: token } = process.env;
if (!projectId || !token) stop('NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN are required (.env.local).');

const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false, perspective: 'raw' });

type Doc = Record<string, any>;
const changes: string[] = [];
const ops: ((tx: Transaction) => void)[] = [];
const plan = (line: string, op: (tx: Transaction) => void) => {
  changes.push(line);
  ops.push(op);
};

async function main() {
  console.log(`Project ${projectId}, dataset ${dataset}${dryRun ? ' (dry run: nothing is written)' : ''}\n`);
  const data = await client.fetch<Record<string, Doc[]>>(`{
    "site": *[_id in ["siteSettings", "drafts.siteSettings"]],
    "home": *[_id in ["homePage", "drafts.homePage"]],
    "single": *[_id in ["policies", "drafts.policies", "curriculum", "drafts.curriculum"]]{ _id }
  }`);
  const has = (id: string) => data.single.some((d) => d._id === id || d._id === `drafts.${id}`);

  // 1-2. The two new documents.
  if (!has('policies')) plan('policies: create (privacy and cookie text, last updated ' + seed.policies.updatedAt + ')', (tx) => tx.createIfNotExists({ _id: 'policies', _type: 'policies', ...seed.policies }));
  if (!has('curriculum')) {
    const { stages, classes, goals, glance } = seed.curriculum;
    plan(`curriculum: create (${stages.length} stages, ${classes.length} classes, ${goals.length} goals, ${glance.length} at a glance)`, (tx) =>
      tx.createIfNotExists({ _id: 'curriculum', _type: 'curriculum', ...seed.curriculum }),
    );
  }

  // 3. The homepage's hero text (the document is made if the clean-up has not made it).
  const homes = data.home.length ? data.home : [{ _id: 'homePage' }];
  for (const home of homes) {
    const patch = homeSeed(home, seed.homePage);
    if (!Object.keys(patch).length) continue;
    plan(`${home._id}: set the hero text`, (tx) => {
      if (!data.home.length) tx.createIfNotExists({ _id: 'homePage', _type: 'homePage' });
      tx.patch(home._id, (p) => p.setIfMissing(patch));
    });
  }

  // 4. School details: how to get here, the walk from the metro, the outside links, the address, Mirpur DOHS.
  if (!data.site.length) stop('No School details (siteSettings) in this dataset.');
  for (const site of data.site) {
    const { setIfMissing, set, landmark } = siteSeed(site, seed.siteSettings);
    const parts = [...Object.keys(setIfMissing), ...Object.keys(set).map((k) => `${k} (tidied)`), ...(landmark ? ['landmark Mirpur DOHS'] : [])];
    if (!parts.length) continue;
    plan(`${site._id}: ${parts.join(', ')}`, (tx) =>
      tx.patch(site._id, (p) => {
        let q = p.setIfMissing(setIfMissing).set(set);
        if (landmark) q = q.setIfMissing({ 'locationInfo.landmarks': [] }).append('locationInfo.landmarks', [landmark]);
        return q;
      }),
    );
  }

  if (!changes.length) return console.log('Nothing to do: this dataset is already seeded.');
  changes.forEach((c, i) => console.log(`${i + 1}. ${c}`));
  if (dryRun) return console.log('\nDry run: nothing was written.');
  const tx = client.transaction();
  ops.forEach((op) => op(tx));
  const result = await tx.commit();
  console.log(`\nDone: transaction ${result.transactionId}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
