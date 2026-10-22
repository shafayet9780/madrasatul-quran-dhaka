import type { PortableTextBlock, PortableTextSpan } from '@portabletext/types';

type Block = PortableTextBlock & { _key?: string; style?: string; listItem?: string; children: PortableTextSpan[] };

// Leading emoji (with their joiners and variation selectors) and the spaces after them.
const LEADING_EMOJI = /^(?:[\p{Extended_Pictographic}\u200D\uFE0F]|\s)+/u;
const startsWithEmoji = (text: string) => /^\s*\p{Extended_Pictographic}/u.test(text);
const plain = (b: Block) => (b.children ?? []).map((c) => c.text ?? '').join('');
// A heading is one short line; anything longer is a paragraph that happens to start with an emoji.
const HEADING_MAX = 60;
// A short line ending in a colon ("পরিচয়:", "প্রাতিষ্ঠানিক ভূমিকা:") is a heading too, written the other common way.
const COLON_HEADING = /^[^:\n]{1,40}:\s*$/;

const heading = (b: Block, text: string, key = b._key): Block => ({
  ...b,
  _key: key,
  style: 'h3',
  listItem: undefined,
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}-t`, text, marks: [] }],
});

/**
 * A biography as editors typed it, made readable: blank lines dropped, a line like "👤পরিচিতি" or "পরিচয়:"
 * turned into a heading without its emoji or colon, and a heading typed on the first line of a paragraph
 * ("📚বিশেষজ্ঞতা ও অবদান⏎আরবি ভাষা…") split into the heading and the paragraph. Headings already marked as
 * headings only lose the emoji.
 */
export function tidyBio(blocks: PortableTextBlock[] | undefined): PortableTextBlock[] {
  const out: Block[] = [];
  for (const block of (blocks ?? []) as Block[]) {
    if (block._type !== 'block') {
      out.push(block);
      continue;
    }
    const text = plain(block);
    if (!block.listItem && !text.trim()) continue;
    if (!startsWithEmoji(text)) {
      const lone = (!block.style || block.style === 'normal') && !block.listItem && COLON_HEADING.test(text);
      out.push(lone ? heading(block, text.trim().replace(/:$/, '').trim()) : block);
      continue;
    }
    const [first, ...rest] = text.split('\n');
    const title = first.replace(LEADING_EMOJI, '').trim();
    if (block.style && block.style !== 'normal' && rest.length === 0) {
      out.push(heading(block, title));
    } else if (!block.listItem && title && first.length <= HEADING_MAX && rest.length === 0) {
      out.push(heading(block, title));
    } else if (!block.listItem && title && first.length <= HEADING_MAX) {
      out.push(heading(block, title, `${block._key}-h`), { ...block, children: afterFirstLine(block.children) });
    } else {
      out.push(block);
    }
  }
  return out;
}

/** The spans after the first line break, keeping their marks. */
function afterFirstLine(spans: PortableTextSpan[]): PortableTextSpan[] {
  const out: PortableTextSpan[] = [];
  let found = false;
  for (const span of spans) {
    if (found) {
      out.push(span);
      continue;
    }
    const at = (span.text ?? '').indexOf('\n');
    if (at === -1) continue;
    found = true;
    const tail = span.text.slice(at + 1);
    if (tail) out.push({ ...span, text: tail });
  }
  return out;
}

/**
 * The biography without its opening name line ("এস. এম. নাহিদ হাসান", "Md. Ashrafuddoula, S.Eng."): the profile shows
 * the name as its H1. The first block counts when it is one short line that is a heading or holds the last word of the
 * person's name (spellings vary: "Ashrafuddowla" in Studio, "Ashrafuddoula" in the bio). Used once, by the bio
 * cleanup script.
 */
export function withoutNameLine(blocks: PortableTextBlock[], name: string): PortableTextBlock[] {
  const [first] = blocks as Block[];
  if (!first || first._type !== 'block' || first.listItem) return blocks;
  const text = plain(first).trim();
  const surname = name.trim().split(/\s+/).pop() ?? '';
  const isName = (first.style === 'h1' || first.style === 'h2') || (surname.length > 1 && text.includes(surname));
  return isName && text.length <= HEADING_MAX && !text.includes('\n') ? blocks.slice(1) : blocks;
}

/** Titles of the contact block some biographies end with (the school's own phones and links, shown on Contact). */
const CONTACT_TITLES = ['প্রতিষ্ঠানের তথ্য', 'Institution Information'];

/** The biography without that block: everything from its title on. Used once, by the bio cleanup script. */
export function withoutContactBlock(blocks: PortableTextBlock[]): PortableTextBlock[] {
  const at = (blocks as Block[]).findIndex((b) => b._type === 'block' && CONTACT_TITLES.includes(plain(b).trim()));
  return at === -1 ? blocks : blocks.slice(0, at);
}
