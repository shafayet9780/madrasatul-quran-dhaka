import { describe, expect, it } from 'vitest';
import type { PortableTextBlock } from '@portabletext/types';
import { tidyBio, withoutContactBlock, withoutNameLine } from './bio';

const block = (key: string, texts: (string | [string, string[]])[], extra: Record<string, unknown> = {}) =>
  ({
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: texts.map((t, i) => (typeof t === 'string' ? { _type: 'span', _key: `${key}${i}`, text: t, marks: [] } : { _type: 'span', _key: `${key}${i}`, text: t[0], marks: t[1] })),
    ...extra,
  }) as PortableTextBlock;
const text = (b: PortableTextBlock) => (b.children as { text: string }[]).map((c) => c.text).join('');
const shape = (blocks: PortableTextBlock[]) => blocks.map((b) => `${b.style}${(b as { listItem?: string }).listItem ? ':' + (b as { listItem?: string }).listItem : ''} ${text(b)}`);

describe('tidyBio', () => {
  it('turns an emoji line into a heading and drops blank lines', () => {
    const out = tidyBio([block('a', [['👤পরিচিতি', ['strong']]]), block('b', ['']), block('c', ['এস এম নাহিদ হাসান জন্ম নেন ১৯৮৪ সালে।'])]);
    expect(shape(out)).toEqual(['h3 পরিচিতি', 'normal এস এম নাহিদ হাসান জন্ম নেন ১৯৮৪ সালে।']);
  });

  it('splits a heading typed on the first line of a paragraph, keeping the paragraph marks', () => {
    const out = tidyBio([block('a', [['📚বিশেষজ্ঞতা ও অবদান', ['strong']], '\nআরবি ভাষা, ', ['কুরআন', ['strong']], ' ও ইতিহাস।'])]);
    expect(shape(out)).toEqual(['h3 বিশেষজ্ঞতা ও অবদান', 'normal আরবি ভাষা, কুরআন ও ইতিহাস।']);
    expect((out[1].children as { marks: string[] }[]).map((c) => c.marks)).toEqual([[], ['strong'], []]);
    expect(out[0]._key).not.toBe(out[1]._key);
  });

  it('only strips the emoji from headings already marked as headings', () => {
    const out = tidyBio([block('a', ['🏫 Educational Institutions Founded'], { style: 'h3' }), block('b', ['Profile'], { style: 'h3' })]);
    expect(shape(out)).toEqual(['h3 Educational Institutions Founded', 'h3 Profile']);
  });

  it('leaves long paragraphs, list items and plain text alone', () => {
    const long = '🌟 ' + 'অনেক লম্বা একটি অনুচ্ছেদ যা কোনো শিরোনাম নয় বরং পুরো একটি বাক্য। '.repeat(2);
    const blocks = [block('a', [long]), block('b', ['🎯 লক্ষ্য'], { listItem: 'bullet' }), block('c', ['   ১. আল-কুরআনের ভাষা'])];
    expect(shape(tidyBio(blocks))).toEqual([`normal ${long}`, 'normal:bullet 🎯 লক্ষ্য', 'normal    ১. আল-কুরআনের ভাষা']);
  });

  it('turns a short line ending in a colon into a heading', () => {
    const out = tidyBio([block('a', ['পরিচয়:']), block('b', ['আল্লাহর রাসূল ﷺ বলেছেন—']), block('c', ['ব্যবস্থাপনা পরিচালক: মাদরাসাতুল কুরআন ঢাকা।'])]);
    expect(shape(out)).toEqual(['h3 পরিচয়', 'normal আল্লাহর রাসূল ﷺ বলেছেন—', 'normal ব্যবস্থাপনা পরিচালক: মাদরাসাতুল কুরআন ঢাকা।']);
  });

  it('handles a missing biography', () => {
    expect(tidyBio(undefined)).toEqual([]);
  });
});

describe('withoutNameLine', () => {
  it('drops an opening line holding the name, or an opening heading', () => {
    const rest = block('b', ['দায়ী ইলা-আল্লাহ, শিক্ষাবিদ, লেখক ও প্রকৌশলী']);
    expect(shape(withoutNameLine([block('a', ['এস. এম. নাহিদ হাসান']), rest], 'এস এম নাহিদ হাসান'))).toEqual(['normal দায়ী ইলা-আল্লাহ, শিক্ষাবিদ, লেখক ও প্রকৌশলী']);
    expect(shape(withoutNameLine([block('a', ['Md. Ashrafuddoula, S.Eng.'], { style: 'h2' }), rest], 'Muhammad Ashrafuddowla'))).toHaveLength(1);
  });

  it('keeps a biography that opens with anything else', () => {
    const blocks = [block('a', ['পরিচিতি']), block('b', ['হাসান সাহেব ১৯৮৪ সালে জন্ম নেন এবং বরিশালে বড় হন, তারপর ঢাকায় আসেন পড়াশোনার জন্য।'])];
    expect(withoutNameLine(blocks, 'এস এম নাহিদ হাসান')).toBe(blocks);
    expect(withoutNameLine([blocks[1]], 'এস এম নাহিদ হাসান')).toHaveLength(1);
    expect(withoutNameLine([], 'x')).toEqual([]);
  });
});

describe('withoutContactBlock', () => {
  it('cuts the contact block and everything after it', () => {
    const blocks = [block('a', ['লক্ষ্য ও দর্শন']), block('b', ['প্রতিষ্ঠানের তথ্য']), block('c', ['হোয়াটসঅ্যাপ:\n01304-223350'], { listItem: 'bullet' })];
    expect(shape(withoutContactBlock(blocks))).toEqual(['normal লক্ষ্য ও দর্শন']);
    expect(shape(withoutContactBlock([block('a', ['Mission']), block('b', ['Institution Information'], { style: 'h2' })]))).toEqual(['normal Mission']);
  });

  it('keeps a biography without one', () => {
    const blocks = [block('a', ['Profile'])];
    expect(withoutContactBlock(blocks)).toBe(blocks);
  });
});
