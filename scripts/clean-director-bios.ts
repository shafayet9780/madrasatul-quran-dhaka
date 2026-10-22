// One-time tidy of the directors' biographies for the redesigned profile pages (owner approved, 15 October 2026).
// Turns emoji lines ("👤পরিচিতি") into headings without the emoji, splits a heading typed on a paragraph's first
// line, drops blank lines, removes the opening name line (the profile shows the name as its H1; owner asked
// 2026-10-15) and the closing contact block ("প্রতিষ্ঠানের তথ্য" / "Institution Information":
// the school's phones and links, which the Contact page shows).
//
//   pnpm exec tsx scripts/clean-director-bios.ts          dry run: prints every change, writes nothing
//   pnpm exec tsx scripts/clean-director-bios.ts --write  writes the changed biographies to the live dataset
//
// Sanity keeps each document's history, so a write can be undone from the document's History in Studio.
import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import type { PortableTextBlock } from '@portabletext/types';
import { tidyBio, withoutContactBlock, withoutNameLine } from '../src/lib/about/bio';

config({ path: resolve(process.cwd(), '.env.local') });
const write = process.argv.includes('--write');
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

type Director = { _id: string; _rev: string; name: Partial<Record<'bengali' | 'english', string>>; fullBio?: Partial<Record<'bengali' | 'english', PortableTextBlock[]>> };
const LOCALES = ['bengali', 'english'] as const;
const line = (b: PortableTextBlock) => `${b.style ?? 'normal'}${(b as { listItem?: string }).listItem ? ':' + (b as { listItem?: string }).listItem : ''}  ${((b.children ?? []) as { text?: string }[]).map((c) => c.text ?? '').join('').replace(/\n/g, ' ⏎ ').slice(0, 90)}`;

async function main() {
  const directors = await client.fetch<Director[]>(`*[_type == "director" && defined(fullBio) && !(_id in path("drafts.**"))]{ _id, _rev, name, fullBio }`);
  const drafts = await client.fetch<string[]>(`*[_type == "director" && _id in path("drafts.**")]._id`);
  if (drafts.length) console.log(`Note: unpublished drafts exist (${drafts.join(', ')}); they are left alone.\n`);
  let changed = 0;
  for (const d of directors) {
    const set: Record<string, PortableTextBlock[]> = {};
    for (const locale of LOCALES) {
      const before = d.fullBio?.[locale];
      if (!before?.length) continue;
      const after = withoutContactBlock(withoutNameLine(tidyBio(before), d.name[locale] ?? ''));
      const a = before.map(line);
      const b = after.map(line);
      if (JSON.stringify(a) === JSON.stringify(b)) continue;
      set[`fullBio.${locale}`] = after;
      console.log(`== ${d.name.english} (${d._id}), ${locale}: ${before.length} blocks → ${after.length}`);
      console.log('-- before');
      a.forEach((l, i) => console.log(`   ${String(i).padStart(2)} ${l}`));
      console.log('-- after');
      b.forEach((l, i) => console.log(`   ${String(i).padStart(2)} ${l}`));
      console.log();
    }
    if (!Object.keys(set).length) {
      console.log(`== ${d.name.english}: no change\n`);
      continue;
    }
    changed++;
    // ifRevisionId: the write fails rather than overwrite an edit made in Studio since this run read the document.
    if (write) await client.patch(d._id).ifRevisionId(d._rev).set(set).commit();
  }
  console.log(write ? `Wrote ${changed} biographies.` : `Dry run: ${changed} biographies would change. Nothing was written.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
