import { describe, expect, it } from 'vitest';
import { dhakaToday, fileSize, noticeMonths, noticeNeighbours, parseNoticeSlug, toNotice, type Notice, type NoticeIn } from './notices';

const today = '2026-10-18';
const bi = (bengali: string, english?: string) => ({ bengali, english });

function notice(over: Partial<NoticeIn> = {}): NoticeIn {
  return {
    _id: 'n17',
    number: { year: 2026, serial: 17 },
    title: bi('অর্ধবার্ষিক পরীক্ষার রুটিন', 'Half-yearly exam routine'),
    date: '2026-10-12',
    type: 'exam',
    body: bi('প্রথম অনুচ্ছেদ।\n\nদ্বিতীয় অনুচ্ছেদ।', 'First paragraph.\n\nSecond paragraph.'),
    ...over,
  };
}

const shown = (n: NoticeIn, locale: 'bengali' | 'english' = 'bengali') => toNotice(n, locale, today) as Notice;

describe('toNotice', () => {
  it('shows a notice in the page’s language, with its number, date and paragraphs', () => {
    expect(shown(notice())).toMatchObject({
      slug: '2026-17',
      number: '২০২৬/১৭',
      dateText: '১২ অক্টোবর ২০২৬',
      day: '১২',
      weekday: 'সোমবার',
      month: '2026-10',
      title: 'অর্ধবার্ষিক পরীক্ষার রুটিন',
      body: ['প্রথম অনুচ্ছেদ।', 'দ্বিতীয় অনুচ্ছেদ।'],
      excerpt: 'প্রথম অনুচ্ছেদ।',
      lang: 'bengali',
    });
    expect(shown(notice(), 'english')).toMatchObject({ number: '2026/17', dateText: '12 October 2026', weekday: 'Monday', title: 'Half-yearly exam routine', lang: 'english' });
  });

  it('shows a notice with no English in Bengali on the English page', () => {
    const n = shown(notice({ title: bi('ছুটি'), body: bi('স্কুল বন্ধ থাকবে।') }), 'english');
    expect(n).toMatchObject({ title: 'ছুটি', body: ['স্কুল বন্ধ থাকবে।'], lang: 'bengali', number: '2026/17' });
    // Half in English (a title, no text) stays whole in Bengali.
    expect(shown(notice({ title: bi('ছুটি', 'Holiday'), body: bi('স্কুল বন্ধ থাকবে।') }), 'english')).toMatchObject({ title: 'ছুটি', lang: 'bengali' });
    // A notice that is only attachments needs only an English title.
    const files = [{ _type: 'file' as const, url: 'https://cdn.sanity.io/files/a.pdf' }];
    expect(shown(notice({ title: bi('রুটিন', 'Routine'), body: undefined, attachments: files }), 'english')).toMatchObject({ title: 'Routine', lang: 'english' });
  });

  it('is new for seven days and pinned until its pin date, in Dhaka’s days', () => {
    expect(shown(notice({ date: '2026-10-12' })).isNew).toBe(true);
    expect(shown(notice({ date: '2026-10-11' })).isNew).toBe(false);
    expect(shown(notice({ date: '2026-10-19' })).isNew).toBe(false);
    expect(shown(notice({ pinnedUntil: '2026-10-18' })).pinned).toBe(true);
    expect(shown(notice({ pinnedUntil: '2026-10-17' })).pinned).toBe(false);
    expect(shown(notice()).pinned).toBe(false);
    expect(dhakaToday(new Date('2026-10-17T19:00:00Z'))).toBe('2026-10-18');
  });

  it('lists PDFs with their size and pictures with their description', () => {
    const n = shown(
      notice({
        body: undefined,
        attachments: [
          { _type: 'file', _key: 'f', url: 'https://cdn.sanity.io/files/routine.pdf', size: 245_760, name: bi('রুটিন') },
          { _type: 'file', _key: 'g', url: 'https://cdn.sanity.io/files/x.pdf', size: 1_258_291 },
          { _type: 'file', _key: 'empty' },
          { _type: 'image', _key: 'p', asset: { _ref: 'image-abc-800x1131-jpg' }, alt: bi('সই করা নোটিশ'), ratio: 0.707 },
          { _type: 'image', _key: 'none' },
        ],
      }),
    );
    expect(n.files).toEqual([
      { key: 'f', name: 'রুটিন', url: 'https://cdn.sanity.io/files/routine.pdf', size: '২৪০ KB' },
      { key: 'g', name: 'অর্ধবার্ষিক পরীক্ষার রুটিন', url: 'https://cdn.sanity.io/files/x.pdf', size: '১.২ MB' },
    ]);
    expect(n.pictures.map((p) => [p.key, p.alt, p.ratio])).toEqual([['p', 'সই করা নোটিশ', 0.707]]);
    expect(n.body).toEqual([]);
  });

  it('leaves out a notice it cannot show', () => {
    for (const over of [{ number: undefined }, { title: undefined }, { date: '12/10/2026' }, { type: 'news' }, { body: undefined }]) {
      expect(toNotice(notice(over), 'bengali', today)).toBeNull();
    }
  });
});

describe('the board', () => {
  const list = [
    notice({ _id: 'a', number: { year: 2026, serial: 13 }, date: '2026-09-28' }),
    notice({ _id: 'b', number: { year: 2026, serial: 19 }, date: '2026-10-18' }),
    notice({ _id: 'c', number: { year: 2026, serial: 17 }, date: '2026-10-12' }),
    notice({ _id: 'd', number: { year: 2026, serial: 18 }, date: '2026-10-12' }),
  ].map((n) => shown(n));

  it('groups the notices by month, newest first, the later number first on the same day', () => {
    const months = noticeMonths(list, 'bengali');
    expect(months.map((m) => [m.key, m.label, m.notices.map((n) => n.slug)])).toEqual([
      ['2026-10', 'অক্টোবর ২০২৬', ['2026-19', '2026-18', '2026-17']],
      ['2026-09', 'সেপ্টেম্বর ২০২৬', ['2026-13']],
    ]);
  });

  it('links each notice to the older and newer one', () => {
    expect(noticeNeighbours(list, '2026-17')).toMatchObject({ older: { slug: '2026-13' }, newer: { slug: '2026-18' } });
    expect(noticeNeighbours(list, '2026-19').newer).toBeNull();
    expect(noticeNeighbours(list, '2026-99')).toEqual({ older: null, newer: null });
  });

  it('reads a notice’s link', () => {
    expect(parseNoticeSlug('2026-17')).toEqual({ year: 2026, serial: 17 });
    expect(parseNoticeSlug('2026-17-x')).toBeNull();
    expect(parseNoticeSlug('17')).toBeNull();
  });

  it('writes file sizes in the page’s numerals', () => {
    expect(fileSize(500, 'english')).toBe('1 KB');
    expect(fileSize(2_621_440, 'english')).toBe('2.5 MB');
    expect(fileSize(undefined, 'bengali')).toBe('');
  });
});
