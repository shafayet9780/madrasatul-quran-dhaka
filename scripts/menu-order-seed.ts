// Fills Menu and pages → Menu order with the menu's usual order (October 2026), so the Studio opens on a list to drag
// rather than an empty one. Only an empty list is filled, in the published document and its draft, so it is safe to run
// again and never overwrites an editor's order (a document changed since it was read is left alone). The site's menu
// does not change: MENU_ITEMS is the order siteNav uses without a Menu order (src/lib/site/nav.test.ts checks it).
//
//   pnpm exec tsx scripts/menu-order-seed.ts --dataset production --dry-run   # lists every change, writes nothing
//   pnpm exec tsx scripts/menu-order-seed.ts --dataset production
import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { MENU_ITEMS } from '../src/lib/nav-visibility';

config({ path: resolve(process.cwd(), '.env.local') });
const args = process.argv.slice(2);
const dataset = args[args.indexOf('--dataset') + 1];
const dryRun = args.includes('--dry-run');
const stop = (message: string): never => {
  console.error(message);
  process.exit(1);
};
if (!args.includes('--dataset') || !dataset || dataset.startsWith('--')) stop('Name the dataset: --dataset production');
const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, SANITY_API_TOKEN: token } = process.env;
if (!projectId || !token) stop('NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN are required (.env.local).');

const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false, perspective: 'raw' });

async function main() {
  console.log(`Project ${projectId}, dataset ${dataset}${dryRun ? ' (dry run: nothing is written)' : ''}\n`);
  const docs = await client.fetch<{ _id: string; _rev: string; count: number | null }[]>(`*[_id in ["pagesOnOff", "drafts.pagesOnOff"]]{ _id, _rev, "count": count(menuOrder) }`);
  const empty = docs.filter((d) => !d.count);
  if (!docs.length) return console.log('No Menu and pages document: nothing to fill.');
  if (!empty.length) return console.log('Menu order is already filled: nothing to do.');
  const menuOrder = MENU_ITEMS.map((i) => ({ _key: randomUUID().slice(0, 12), _type: 'menuItem', page: i.value }));
  empty.forEach((d) => console.log(`${d._id}: Menu order ← ${MENU_ITEMS.map((i) => i.title).join(', ')}`));
  if (dryRun) return;
  const tx = client.transaction();
  empty.forEach((d) => tx.patch(d._id, (p) => p.ifRevisionId(d._rev).set({ menuOrder })));
  await tx.commit();
  console.log('\nDone.');
}

main().catch((error) => stop(String(error)));
