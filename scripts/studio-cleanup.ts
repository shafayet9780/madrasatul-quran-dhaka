// The Studio clean-up of October 2026 (docs/studio-cleanup.md): moves data to its new place, then removes what the site
// no longer reads, in one transaction. Safe to run again: what is already done is left alone.
//
//   pnpm exec tsx scripts/studio-cleanup.ts --dataset production --dry-run   # lists every change, writes nothing
//   pnpm exec tsx scripts/studio-cleanup.ts --dataset production
//
// Until the release the live site reads `development`: writing there needs --yes-development (the old site would
// lose data it still reads). A dry run reads only, anywhere.
import { createClient, type Transaction } from '@sanity/client';
import { config } from 'dotenv';
import { createReadStream, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITE_DESCRIPTION } from '../src/lib/page-metadata';
import {
  DELETED_TYPES,
  LEGACY_FORM_FIELDS,
  ORDERED_TYPES,
  droppedFields,
  feeUnsets,
  homeFromSite,
  orderRanks,
  pagesOnOffFrom,
  preAdmissionFormDoc,
  schoolDetails,
  seoSeed,
} from '../src/lib/studio-cleanup';

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
  stop('`development` is the live site’s dataset until the release; add --yes-development if this is after the release.');
}
const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, SANITY_API_TOKEN: token } = process.env;
if (!projectId || !token) stop('NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN are required (.env.local).');

const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false, perspective: 'raw' });
const FORM_ID = 'preAdmissionForm';
const isDraft = (id: string) => id.startsWith('drafts.');
const json = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

type Doc = Record<string, any>;
const changes: string[] = [];
const ops: ((tx: Transaction) => void)[] = [];
const plan = (line: string, op: (tx: Transaction) => void) => {
  changes.push(line);
  ops.push(op);
};

async function main() {
  console.log(`Project ${projectId}, dataset ${dataset}${dryRun ? ' (dry run: nothing is written)' : ''}\n`);
  const data = await client.fetch<Record<string, any>>(
    `{
      "site": *[_id in ["siteSettings", "drafts.siteSettings"]],
      "footer": *[_type == "footer" && isActive == true && !(_id in path("drafts.**"))][0],
      "home": *[_id in ["homePage", "drafts.homePage"]],
      "pagesOnOff": *[_id == "pagesOnOff"][0]._id,
      "seo": *[_id == "seoSettings"][0]._id,
      "forms": *[_type == "preAdmissionForm"],
      "fees": *[_id in ["feeSettings", "drafts.feeSettings"]],
      "categories": *[_type == "downloadCategory" && defined(description)]._id,
      "deleted": *[_type in $deleted]{ _id, _type }
    }`,
    { deleted: DELETED_TYPES },
  );

  // 1. School details (and its draft): the new shape; the footer's words become the tagline and the mission.
  const site: Doc | undefined = data.site.find((d: Doc) => !isDraft(d._id));
  if (!site) throw new Error('No published siteSettings in this dataset.');
  for (const doc of data.site as Doc[]) {
    const next = schoolDetails(doc, data.footer ?? undefined);
    const dropped = droppedFields(doc);
    const uses = next.contactInfo.phone.map((p: Doc) => `${p.number} → ${p.usedFor}`).join(', ');
    if (dropped.length || doc.contactInfo?.phone?.some((p: Doc) => !p.usedFor) || (!doc.tagline && next.tagline)) {
      plan(`${doc._id}: keep the new fields only; drop ${dropped.join(', ') || 'nothing'}; phones ${uses}; tagline/mission from the footer`, (tx) =>
        tx.createOrReplace(next as Doc & { _id: string; _type: string }),
      );
    }
  }

  // 2. Homepage: the hero photos and the numbers, from the published School details.
  for (const id of ['homePage', ...data.home.filter((d: Doc) => isDraft(d._id)).map((d: Doc) => d._id)]) {
    const home = data.home.find((d: Doc) => d._id === id);
    const set = homeFromSite(site, home);
    if (Object.keys(set).length) {
      plan(`${id}: set ${Object.keys(set).join(', ')} (${set.heroImages?.length ?? 0} hero photos)`, (tx) => {
        if (!home) tx.createIfNotExists({ _id: id, _type: 'homePage' });
        tx.patch(id, (p) => p.set(set));
      });
    }
  }

  // 3. Pages on/off, from the old switches.
  if (!data.pagesOnOff) {
    const doc = pagesOnOffFrom(site.navigationVisibility);
    plan(`pagesOnOff: create (${Object.entries(doc).filter(([k, v]) => k.startsWith('show') && !v).map(([k]) => k).join(', ') || 'all on'} off)`, (tx) =>
      tx.createIfNotExists(doc as Doc & { _id: string; _type: string }),
    );
  }

  // 4. Search & sharing, from the site's own wording; the share picture is the school building.
  let uploadShare = false;
  let shareImage: Doc | undefined;
  if (!data.seo) {
    uploadShare = true;
    const messages = { bengali: json('messages/bengali.json'), english: json('messages/english.json') };
    plan(`seoSettings: create with the site's own titles and descriptions for 9 pages and the share picture (uploaded)`, (tx) =>
      tx.createIfNotExists(seoSeed(messages, SITE_DESCRIPTION, shareImage) as Doc & { _id: string; _type: string }),
    );
  }

  // 5. The pre-admission form: under the fixed id, without the old form. Its draft moves with it.
  const forms = data.forms as Doc[];
  const oldPublished = forms.filter((f) => !isDraft(f._id) && f._id !== FORM_ID);
  if (oldPublished.length > 1) throw new Error(`Several pre-admission forms: ${oldPublished.map((f) => f._id).join(', ')}. Keep one first.`);
  const legacy = (f: Doc) => LEGACY_FORM_FIELDS.some((k) => f[k] !== undefined) || Object.keys(f.formSettings ?? {}).some((k) => k !== 'isEnabled');
  for (const [from, to] of [
    [oldPublished[0]?._id ?? FORM_ID, FORM_ID],
    [`drafts.${oldPublished[0]?._id ?? FORM_ID}`, `drafts.${FORM_ID}`],
  ]) {
    const doc = forms.find((f) => f._id === from);
    if (!doc || (from === to && !legacy(doc))) continue;
    if (from !== to && forms.some((f) => f._id === to)) throw new Error(`Both ${from} and ${to} exist. Keep one first.`);
    plan(`${from}${from === to ? '' : ` → ${to}`}: drop the old form's fields`, (tx) => {
      tx.createOrReplace(preAdmissionFormDoc(doc, to) as Doc & { _id: string; _type: string });
      if (from !== to) tx.delete(from);
    });
  }

  // 6. Fees: the FAQ pair and the vehicles' notes.
  for (const doc of data.fees as Doc[]) {
    const unset = feeUnsets(doc);
    if (unset.length) plan(`${doc._id}: unset ${unset.join(', ')}`, (tx) => tx.patch(doc._id, (p) => p.unset(unset)));
  }

  // 7. Drag order: ranks in the order the site shows today, the old order fields gone.
  for (const { type, oldOrder, unset } of ORDERED_TYPES) {
    // Published documents in today's order, then drafts never published; a draft shares its document's rank. On a
    // later run only documents without a rank get one, after the rest, so the editors' order stays.
    const docs = await client.fetch<Doc[]>(`*[_type == $type] | order(${oldOrder}) { _id, orderRank }`, { type });
    const base = (id: string) => id.replace(/^drafts\./, '');
    const ranked = new Map(docs.filter((d) => d.orderRank).map((d) => [base(d._id), d.orderRank as string]));
    const order = [...docs.filter((d) => !isDraft(d._id)), ...docs.filter((d) => isDraft(d._id))].map((d) => base(d._id)).filter((id, i, all) => all.indexOf(id) === i && !ranked.has(id));
    const unranked = docs.filter((d) => !d.orderRank);
    if (!unranked.length) continue;
    const last = [...ranked.values()].sort().at(-1);
    const fresh = orderRanks(order.length, last);
    const ranks = new Map(order.map((id, i) => [id, fresh[i]]));
    const rankOf = (id: string) => ranked.get(base(id)) ?? ranks.get(base(id))!;
    plan(`${type}: rank ${unranked.length} (${last ? 'drafts take their document’s rank, new ones go after the others' : 'as the site shows them today'}); unset ${unset.join(', ')}`, (tx) => {
      for (const d of unranked) tx.patch(d._id, (p) => p.set({ orderRank: rankOf(d._id) }).unset(unset));
    });
  }

  // 8. Download categories: the unused description.
  for (const id of data.categories as string[]) plan(`${id}: unset description`, (tx) => tx.patch(id, (p) => p.unset(['description'])));

  // 9. The types the site no longer reads, once nothing else references them.
  const deleted = data.deleted as Doc[];
  if (deleted.length) {
    const ids = deleted.map((d) => d._id);
    const referrers = await client.fetch<Doc[]>(`*[references($ids) && !(_id in $ids)]{ _id, _type }`, { ids });
    if (referrers.length) throw new Error(`Still referenced by ${referrers.map((r) => `${r._type} ${r._id}`).join(', ')}.`);
    const byType = DELETED_TYPES.map((t) => [t, deleted.filter((d) => d._type === t).length] as const).filter(([, n]) => n);
    plan(`delete ${byType.map(([t, n]) => `${n} ${t}`).join(', ')}`, (tx) => ids.forEach((id) => tx.delete(id)));
  }

  if (!changes.length) return console.log('Nothing to do: this dataset is already cleaned up.');
  changes.forEach((c, i) => console.log(`${i + 1}. ${c}`));
  if (dryRun) return console.log('\nDry run: nothing was written.');
  // Uploaded only now, after every check, so a run that stops leaves no stray picture.
  if (uploadShare) {
    const asset = await client.assets.upload('image', createReadStream(resolve(process.cwd(), 'public/images/social/school.jpg')), { filename: 'school.jpg' });
    shareImage = { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt: { bengali: 'মাদরাসাতুল কুরআনের ভবন', english: 'Madrasatul Quran school building' } };
  }
  const tx = client.transaction();
  ops.forEach((op) => op(tx));
  const result = await tx.commit();
  console.log(`\nDone: transaction ${result.transactionId}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
