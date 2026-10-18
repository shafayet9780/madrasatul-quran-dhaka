import { describe, expect, it } from 'vitest';
import { albumJsonLd, dayInWords, filterChoices, filterRows, monthInWords, monthRows, neighbours, toAlbum, youtubeId, type Album, type AlbumIn } from './albums';

const bi = (bengali: string, english = bengali) => ({ bengali, english });
const url = (p: { asset?: { _ref?: string } }) => (p.asset?._ref ? `https://cdn.sanity.io/${p.asset._ref}` : undefined);
const photo = (ref: string, over = {}) => ({ _key: ref, asset: { _ref: ref }, alt: bi('ছবি', 'Photo'), ratio: 1.5, ...over });
const raw = (over: Partial<AlbumIn>): AlbumIn => ({ _id: 'id', slug: 'parents-day', title: bi('অভিভাবক সমাবেশ', 'Parents’ day'), date: '2026-10-11', topic: 'events', photos: [photo('a')], ...over });
const album = (over: Partial<AlbumIn>, locale: 'bengali' | 'english' = 'english') => toAlbum(raw(over), locale, url)!;

describe('youtubeId', () => {
  it('reads the id from every kind of YouTube link', () => {
    for (const link of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ?t=4', 'https://youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'])
      expect(youtubeId(link)).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://vimeo.com/12345')).toBeNull();
    expect(youtubeId(undefined)).toBeNull();
  });
});

describe('dates', () => {
  it('writes the day and the month without commas, in the page’s numerals', () => {
    expect(dayInWords('2026-10-11', 'bengali')).toBe('১১ অক্টোবর ২০২৬');
    expect(dayInWords('2026-10-11', 'bengali', false)).toBe('১১ অক্টোবর');
    expect(dayInWords('2026-09-03', 'english')).toBe('3 September 2026');
    expect(monthInWords('2026-10', 'bengali')).toBe('অক্টোবর ২০২৬');
    expect(monthInWords('2026-10', 'english')).toBe('October 2026');
  });
});

describe('toAlbum', () => {
  it('normalises an album in the page’s language', () => {
    const a = album({
      photoCount: 18,
      photos: [photo('a', { caption: bi('শিক্ষকদের কথা', 'The teachers speak'), hotspot: { x: 0.25, y: 0.6 } }), photo('b', { ratio: undefined })],
      videos: [{ _key: 'v', url: 'https://youtu.be/dQw4w9WgXcQ', title: bi('পুরো ভিডিও', 'The whole video'), length: '8:20' }],
      story: bi('প্রথম।\n\nদ্বিতীয়।', 'First.\n\n  \nSecond.'),
      quote: { text: bi('কথা', 'Words'), by: bi('উস্তাদ', 'Ustadh') },
    });
    expect(a).toMatchObject({ slug: 'parents-day', title: 'Parents’ day', topic: 'events', date: '2026-10-11', dateText: '11 October 2026', dayText: '11 October', photoCount: 18 });
    expect(a.photos).toEqual([
      { key: 'a', src: 'https://cdn.sanity.io/a', alt: 'Photo', caption: 'The teachers speak', ratio: 1.5, position: '25% 60%' },
      { key: 'b', src: 'https://cdn.sanity.io/b', alt: 'Photo', caption: '', ratio: 1.333, position: '50% 50%' },
    ]);
    expect(a.videos).toEqual([{ key: 'v', id: 'dQw4w9WgXcQ', title: 'The whole video', upright: false, length: '8:20', date: '2026-10-11', dateText: '11 October 2026', dayText: '11 October', album: 'parents-day' }]);
    expect(a.story).toEqual(['First.', 'Second.']);
    expect(a.quote).toEqual({ text: 'Words', by: 'Ustadh' });
  });

  it('writes a video’s length in Bengali numerals and treats /shorts/ links as upright', () => {
    const a = album({ videos: [{ url: 'https://youtube.com/shorts/dQw4w9WgXcQ', title: bi('ভ্যান'), length: '0:38' }] }, 'bengali');
    expect(a.videos[0]).toMatchObject({ upright: true, length: '০:৩৮', dateText: '১১ অক্টোবর ২০২৬' });
  });

  it('leaves out photos and videos it cannot show, and albums with nothing in them', () => {
    const a = album({ photos: [photo('a'), photo('b', { alt: undefined }), { _key: 'c' }], videos: [{ url: 'https://vimeo.com/1', title: bi('x') }, { url: 'https://youtu.be/dQw4w9WgXcQ' }] });
    expect(a.photos.map((p) => p.key)).toEqual(['a']);
    expect(a.videos).toEqual([]);
    expect(toAlbum(raw({ photos: [], videos: [] }), 'english', url)).toBeNull();
  });

  it('needs a name, a link, a known topic and a date unless it is all-time', () => {
    expect(toAlbum(raw({ title: bi('শুধু বাংলা', '') }), 'english', url)).toBeNull();
    expect(toAlbum(raw({ slug: undefined }), 'english', url)).toBeNull();
    expect(toAlbum(raw({ topic: 'music' as never }), 'english', url)).toBeNull();
    expect(toAlbum(raw({ date: undefined }), 'english', url)).toBeNull();
    expect(album({ date: undefined, evergreen: true })).toMatchObject({ date: null, dateText: '', dayText: '' });
    // An all-time album keeps no date, even one left from before it was marked all-time.
    expect(album({ evergreen: true }).date).toBeNull();
  });
});

describe('month rows and the filter bar', () => {
  const albums: Album[] = [
    album({ slug: 'oct', date: '2026-10-11', topic: 'events', videos: [{ _key: 'w', url: 'https://youtu.be/aaaaaaaaaaa', title: bi('Whole') }, { _key: 's', url: 'https://youtu.be/bbbbbbbbbbb', title: bi('Short'), upright: true }] }),
    album({ slug: 'sep-a', date: '2026-09-24', topic: 'classes' }),
    album({ slug: 'sep-v', date: '2026-09-09', topic: 'classes', photos: [], videos: [{ _key: 'n', url: 'https://youtu.be/ccccccccccc', title: bi('Nursery') }] }),
    album({ slug: 'old', date: '2025-12-01', topic: 'quran' }),
    album({ slug: 'campus', evergreen: true, topic: 'campus' }),
  ];
  const rows = monthRows(albums, 'english');

  it('groups dated albums and their wide videos by month, newest first, album before its video', () => {
    expect(rows.map((r) => [r.label, r.entries.map((e) => e.key)])).toEqual([
      ['October 2026', ['a-oct', 'v-oct-w']],
      ['September 2026', ['a-sep-a', 'v-sep-v-n']],
      ['December 2025', ['a-old']],
    ]);
  });

  it('offers the years and only the topics that have albums, videos last', () => {
    expect(filterChoices(rows)).toEqual({ years: ['2026', '2025'], topics: ['quran', 'classes', 'events', 'video'] });
  });

  it('filters by year and by topic or videos, dropping empty months', () => {
    expect(filterRows(rows, { year: '2026', topic: null }).map((r) => r.key)).toEqual(['2026-10', '2026-09']);
    expect(filterRows(rows, { year: null, topic: 'classes' }).flatMap((r) => r.entries.map((e) => e.key))).toEqual(['a-sep-a', 'v-sep-v-n']);
    expect(filterRows(rows, { year: '2026', topic: 'video' }).flatMap((r) => r.entries.map((e) => e.key))).toEqual(['v-oct-w', 'v-sep-v-n']);
    expect(filterRows(rows, { year: '2025', topic: 'events' })).toEqual([]);
  });

  it('links an album to the older and the newer one, keeping all-time albums apart', () => {
    expect(neighbours(albums, 'sep-a')).toMatchObject({ older: { slug: 'sep-v' }, newer: { slug: 'oct' } });
    expect(neighbours(albums, 'old')).toMatchObject({ older: null, newer: { slug: 'sep-v' } });
    expect(neighbours(albums, 'campus')).toEqual({ older: null, newer: null });
    expect(neighbours(albums, 'missing')).toEqual({ older: null, newer: null });
  });
});

describe('albumJsonLd', () => {
  it('describes the album as an image gallery with its photos and videos', () => {
    const a = album({ summary: bi('সারকথা', 'Summary'), photos: [photo('a', { caption: bi('মঞ্চ', 'The stage') }), photo('b')], videos: [{ _key: 'v', url: 'https://youtu.be/dQw4w9WgXcQ', title: bi('ভিডিও', 'Video') }] });
    expect(albumJsonLd(a, 'https://school.example/english/gallery/parents-day', 'english')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ImageGallery',
      name: 'Parents’ day',
      description: 'Summary',
      url: 'https://school.example/english/gallery/parents-day',
      inLanguage: 'en',
      datePublished: '2026-10-11',
      associatedMedia: [
        { '@type': 'ImageObject', contentUrl: 'https://cdn.sanity.io/a', caption: 'The stage' },
        { '@type': 'ImageObject', contentUrl: 'https://cdn.sanity.io/b', caption: 'Photo' },
        {
          '@type': 'VideoObject',
          name: 'Video',
          description: 'Video',
          thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          uploadDate: '2026-10-11',
        },
      ],
    });
  });
});
