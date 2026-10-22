import { describe, expect, it } from 'vitest';
import { campusStops, dayBeats, firstBeat, floorName, liftRows, type CampusStopIn } from './day';
import { LAUNCH_DAY, launchDay } from './launch-day';

const bi = (bengali: string, english = bengali) => ({ bengali, english });
const noUrl = () => undefined;
const names = { roof: 'ছাদ', ground: 'নিচতলা' };
const stop = (over: Partial<CampusStopIn>): CampusStopIn => ({
  kind: 'floor',
  label: bi('সকাল ৮:০০', '8:00 am'),
  title: bi('শিরোনাম', 'Title'),
  text: bi('লেখা', 'Text'),
  clock: [{ time: bi('৮:০০', '8:00'), part: bi('সকাল', 'Morning'), sky: 'morning', groups: ['hifz'] }],
  photos: [{ src: '/a.jpg', alt: bi('ছবি', 'Photo') }],
  ...over,
});

describe('campusStops', () => {
  it('normalises a stop in the page’s language, with its photo framed on the hotspot', () => {
    const [s] = campusStops([stop({ _key: 'k', place: bi('৩য় তলা', '3rd floor'), floor: 3, photos: [{ src: '/a.jpg', alt: bi('ছবি', 'Photo'), name: bi('কক্ষ', 'Room'), hotspot: { x: 0.25, y: 0.6 } }] })], 'english', noUrl);
    expect(s).toEqual({
      key: 'k',
      kind: 'floor',
      label: '8:00 am',
      place: '3rd floor',
      title: 'Title',
      text: 'Text',
      lift: 3,
      beats: [{ time: '8:00', part: 'Morning', sky: 'morning', groups: ['hifz'] }],
      moments: [],
      photos: [{ src: '/a.jpg', alt: 'Photo', name: 'Room', position: '25% 60%' }],
    });
  });

  it('leaves out stops switched off, without text in this language, without a clock, or of an unknown kind', () => {
    const stops = [
      stop({ show: false }),
      stop({ title: { bengali: 'শুধু বাংলা' } }),
      stop({ clock: [] }),
      stop({ clock: [{ time: bi('৮:০০'), part: bi('সকাল') }] }), // no sky
      stop({ kind: 'lab' as never }),
      stop({ _key: 'ok' }),
    ];
    expect(campusStops(stops, 'english', noUrl).map((s) => s.key)).toEqual(['ok']);
  });

  it('hides a stop that shows a photo until it has one; drawn stops need none', () => {
    const kinds = ['entrance', 'floor', 'rooms', 'roof', 'field', 'exit', 'other', 'approach', 'arrive', 'leave', 'moments'] as const;
    const shown = campusStops(kinds.map((kind) => stop({ _key: kind, kind, photos: [], moments: [{ icon: 'salat', label: bi('সালাত') }] })), 'bengali', noUrl).map((s) => s.key);
    expect(shown).toEqual(['approach', 'arrive', 'leave', 'moments']);
  });

  it('turns Studio photos into addresses, leaving out photos without one', () => {
    const photos = [{ asset: { _ref: 'image-a' }, alt: bi('ক') }, { asset: { _ref: '' }, alt: bi('খ') }];
    const [s] = campusStops([stop({ photos })], 'bengali', (p) => (p.asset?._ref ? `https://cdn/${p.asset._ref}` : undefined));
    expect(s.photos.map((p) => p.src)).toEqual(['https://cdn/image-a']);
  });

  it('plays one moment per clock row, per moment tile and per room photo; the last clock row holds', () => {
    const clock = [{ time: bi('১২:৩০'), part: bi('দুপুর'), sky: 'day' as const, groups: ['hifz' as const] }];
    const moments = campusStops(
      [stop({ kind: 'moments', clock, photos: [], moments: [{ icon: 'salat', label: bi('সালাত') }, { icon: 'meal', label: bi('খাবার') }, { icon: 'sleep' }] })],
      'bengali',
      noUrl,
    )[0];
    expect(moments.moments.map((m) => m.icon)).toEqual(['salat', 'meal']); // the tile without a label is left out
    expect(moments.beats).toHaveLength(2);
    expect(moments.beats[1]).toEqual(moments.beats[0]);
    const rooms = campusStops([stop({ kind: 'rooms', clock, photos: [{ src: '/1.jpg' }, { src: '/2.jpg' }, { src: '/3.jpg' }] })], 'bengali', noUrl)[0];
    expect(rooms.beats).toHaveLength(3);
    // A moments stop without a moment has nothing to show.
    expect(campusStops([stop({ kind: 'moments', photos: [], moments: [{ icon: 'salat' }] })], 'bengali', noUrl)).toEqual([]);
    // Moments only belong to the moments kind.
    expect(campusStops([stop({ moments: [{ icon: 'salat', label: bi('সালাত') }] })], 'bengali', noUrl)[0].moments).toEqual([]);
  });

  it('keeps the groups in the chips’ order and drops unknown ones', () => {
    const [s] = campusStops([stop({ clock: [{ time: bi('৯'), part: bi('সকাল'), sky: 'day', groups: ['afterHifz', 'x' as never, 'preHifz', 'hifz'] }] })], 'bengali', noUrl);
    expect(s.beats[0].groups).toEqual(['preHifz', 'hifz', 'afterHifz']);
  });
});

describe('the lift', () => {
  const stops = campusStops(
    [
      stop({ _key: 'out', kind: 'arrive', photos: [] }),
      stop({ _key: 'g', kind: 'entrance', floor: 0 }),
      stop({ _key: '2', floor: 2 }),
      stop({ _key: '1', floor: 1 }),
      stop({ _key: 'roof', kind: 'roof' }),
      stop({ _key: 'g2', kind: 'exit', floor: 0 }),
    ],
    'bengali',
    noUrl,
  );

  it('lists the roof and the floors the stops use, top first', () => {
    expect(liftRows(stops)).toEqual(['roof', 2, 1, 0]);
  });

  it('puts each moment on its row, and nowhere outside the building', () => {
    expect(dayBeats(stops).map((b) => b.lift)).toEqual([null, 3, 1, 2, 0, 3]);
  });

  it('stays away while it would have a single floor', () => {
    const one = campusStops([stop({ kind: 'entrance', floor: 0 }), stop({ kind: 'exit', floor: 0 })], 'bengali', noUrl);
    expect(dayBeats(one).every((b) => b.lift === null)).toBe(true);
  });

  it('names its rows in both languages', () => {
    expect(['roof', 4, 2, 1, 0].map((r) => floorName(r as never, 'bengali', names))).toEqual(['ছাদ', '৪র্থ', '২য়', '১ম', 'নিচতলা']);
    expect([1, 2, 3, 4, 11, 12, 13, 21].map((r) => floorName(r, 'english', { roof: 'Roof', ground: 'Ground' }))).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st']);
  });
});

describe('dayBeats', () => {
  it('moves the sun from the first moment to the last, a share of a stop per moment', () => {
    const clock = (n: number) => Array.from({ length: n }, () => ({ time: bi('১'), part: bi('ক'), sky: 'day' as const }));
    const stops = campusStops([stop({ clock: clock(1) }), stop({ clock: clock(2) }), stop({ clock: clock(1) })], 'bengali', noUrl);
    expect(dayBeats(stops).map((b) => b.sun)).toEqual([0, 0.5, 0.75, 1]);
    expect(dayBeats(stops).map((b) => b.stop)).toEqual([0, 1, 1, 2]);
    expect(firstBeat(stops, 2)).toBe(3);
    expect(dayBeats(campusStops([stop({})], 'bengali', noUrl))[0].sun).toBe(0.5);
  });
});

describe('the launch day', () => {
  for (const locale of ['bengali', 'english'] as const) {
    it(`keeps the routine’s order and shows only the stops it has photos for (${locale})`, () => {
      const stops = campusStops(LAUNCH_DAY, locale, noUrl);
      expect(stops.map((s) => s.key)).toEqual(['approach', 'arrive', 'entrance', 'rooms', 'leave', 'midday', 'revision', 'evening', 'exit']);
      // Dawn to night, never back.
      const order = ['dawn', 'morning', 'day', 'afternoon', 'late', 'dusk', 'night'];
      const skies = dayBeats(stops).map((b) => order.indexOf(b.sky));
      expect(skies).toEqual([...skies].sort((a, b) => a - b));
      // Home time: the last chip fades.
      expect(dayBeats(stops).at(-1)!.groups).toEqual([]);
      // Every photo is a real one in /public, with its description.
      for (const p of stops.flatMap((s) => s.photos)) {
        expect(p.src).toMatch(/^\/images\/(home|campus)\/[a-z-]+\.jpg$/);
        expect(p.alt).not.toBe('');
      }
    });
  }

  it('takes the homepage’s roof and field photos once Studio has them', () => {
    const photo = { asset: { _ref: 'image-roof' }, alt: bi('ছাদবাগান') };
    const stops = campusStops(launchDay({ roof: photo, field: {} }), 'bengali', (p) => p.asset?._ref && `https://cdn/${p.asset._ref}`);
    expect(stops.map((s) => s.key)).toContain('roof');
    expect(stops.map((s) => s.key)).not.toContain('field');
  });
});
