import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from '@/components/site/icon';
import { GROUPS, SKIES, type DayBeat, type Group, type MomentIcon, type Photo, type Stop } from '@/lib/campus/day';

const MOMENT_ICON: Record<MomentIcon, IconName> = {
  salat: 'mosque',
  bath: 'shower',
  meal: 'fork-knife',
  sleep: 'bed',
  read: 'book-open-text',
  revise: 'arrows-clockwise',
  play: 'soccer-ball',
  home: 'house-line',
};

const SIZES = '(min-width: 1024px) 60vw, 100vw';

/** Spread evenly over 0 to 1 (golden ratio), so stars don't line up. */
const spread = (k: number) => ((k + 1) * 0.618034) % 1;
/** A fixed shuffle over 0 to 1, so windows light up in a scattered order. */
const scatter = (k: number) => {
  const x = Math.sin(k * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
};

/** The stage's state at the first moment, as the server sends it (the driver takes over on scroll). */
const pos = (list: number[]) => (list.includes(0) ? 'now' : 'next');
const beatsAttr = (list: number[]) => ({ 'data-beats': list.join(' '), 'data-pos': pos(list) });

export type StageCopy = {
  groups: Record<Group, string>;
  walk: { distance: string; station: string; school: string; note: string };
};

type Props = {
  stops: Stop[];
  beats: DayBeat[];
  /** Each stop's moments, as indices into `beats`. */
  stopBeats: number[][];
  lift: string[];
  copy: StageCopy;
};

/**
 * The pinned stage: the sky, the clock with the part of the day, the sun (a moon after dark) crossing the day, who is
 * in school, one picture layer per stop and the lift. It only repeats what the steps say, so it is hidden from
 * assistive technology. Everything is server HTML; the driver moves it.
 */
export function TourStage({ stops, beats, stopBeats, lift, copy }: Props) {
  const start = beats[0];
  // The clock: one reading per run of moments that say the same.
  const readings = beats.reduce<{ time: string; part: string; list: number[] }[]>((runs, b, g) => {
    const last = runs.at(-1);
    if (last && last.time === b.time && last.part === b.part) last.list.push(g);
    else runs.push({ time: b.time, part: b.part, list: [g] });
    return runs;
  }, []);

  return (
    <div
      data-stage
      aria-hidden="true"
      className="cd-stage"
      data-sky={start.sky}
      data-groups={start.groups.join(' ')}
      data-lift={start.lift === null ? 'off' : 'on'}
      style={{ '--sun': start.sun, '--lift': start.lift ?? 0 } as CSSProperties}
    >
      <div className="cd-screen">
        {SKIES.map((sky) => (
          <span key={sky} className="cd-sky" data-sky={sky}>
            {sky === 'night' &&
              Array.from({ length: 18 }, (_, k) => <i key={k} className="cd-star" style={{ left: `${spread(k) * 100}%`, top: `${spread(k * 3 + 1) * 38}%` }} />)}
          </span>
        ))}

        <div className="cd-hud">
          <div className="cd-clock">
            {readings.map((r) => (
              <span key={r.list[0]} className="cd-reading" {...beatsAttr(r.list)}>
                <span>{r.part}</span>
                <strong>{r.time}</strong>
              </span>
            ))}
          </div>
          <div className="cd-track">
            <i />
            <span className="cd-sun">
              <Icon name="sun" size={19} className="cd-sun-icon" />
              <Icon name="moon-stars" size={17} className="cd-moon" />
            </span>
          </div>
          <div className="cd-chips">
            {GROUPS.map((g) => (
              <span key={g} className="cd-chip" data-group={g}>
                {copy.groups[g]}
              </span>
            ))}
          </div>
        </div>

        <div className="cd-view">
          {stops.map((s, i) => (
            <div
              key={s.key}
              className="cd-layer"
              data-layer={i}
              data-kind={s.kind}
              data-near={i <= 1 ? '' : undefined}
              {...beatsAttr(stopBeats[i])}
              style={{ '--tl': `--t${i}` } as CSSProperties}
            >
              <Scene stop={s} list={stopBeats[i]} copy={copy} />
            </div>
          ))}

          {lift.length > 0 && (
            <div className="cd-lift">
              <div>
                <span className="cd-lift-mark" />
                {lift.map((name, row) => (
                  <span key={name} className="cd-lift-row" {...beatsAttr(beats.flatMap((b, g) => (b.lift === row ? [g] : [])))}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** A stop's picture. The kind decides what is drawn and how it moves. */
function Scene({ stop, list, copy }: { stop: Stop; list: number[]; copy: StageCopy }) {
  const photo = stop.photos[0];
  switch (stop.kind) {
    case 'approach':
      return <Walk copy={copy.walk} />;
    case 'arrive':
    case 'leave':
      return <Road away={stop.kind === 'leave'} photo={stop.kind === 'arrive' ? photo : undefined} />;
    case 'entrance':
      return <Entrance photo={photo} />;
    case 'rooms':
      return (
        <div className="cd-photo cd-rooms">
          {stop.photos.map((p, j) => (
            <div key={j} className="cd-room" {...beatsAttr(list.filter((_, b) => Math.min(b, stop.photos.length - 1) === j))}>
              <Img photo={p} />
              {p.name && <span className="cd-name">{p.name}</span>}
            </div>
          ))}
        </div>
      );
    case 'moments':
      return <Moments stop={stop} list={list} />;
    default:
      return (
        <div className="cd-photo">
          <Img photo={photo} />
          {photo.name && <span className="cd-name">{photo.name}</span>}
        </div>
      );
  }
}

function Img({ photo }: { photo: Photo }) {
  return <Image src={photo.src} alt="" fill sizes={SIZES} className="cd-fill" style={{ objectPosition: photo.position }} />;
}

/** The drawn school building: windows in a grid (lit as it gets dark), and the red sign on its roof. */
function Building({ cols, rows, children }: { cols: number; rows: number; children?: ReactNode }) {
  return (
    <div className="cd-building" style={{ '--cols': cols, '--rows': rows } as CSSProperties}>
      <span className="cd-sign">MQD</span>
      {Array.from({ length: cols * rows }, (_, k) => (
        <span key={k} className="cd-win" style={{ '--r': scatter(k).toFixed(3) } as CSSProperties}>
          <i />
        </span>
      ))}
      {children}
    </div>
  );
}

/** From the metro: the distance, and the walk drawing itself from the station to the school. */
function Walk({ copy }: { copy: StageCopy['walk'] }) {
  return (
    <div className="cd-walk">
      {copy.distance && <strong className="cd-walk-figure">{copy.distance}</strong>}
      <div className="cd-walk-row">
        <span className="cd-walk-end">
          <span className="cd-walk-station">
            <Icon name="train" size={20} />
          </span>
          {copy.station}
        </span>
        <span className="cd-walk-path">
          <i />
          <b className="cd-walker" />
        </span>
        <span className="cd-walk-end">
          <span className="cd-walk-school">
            {Array.from({ length: 8 }, (_, k) => (
              <i key={k} />
            ))}
          </span>
          {copy.school}
        </span>
      </div>
      {copy.note && <span className="cd-walk-note">{copy.note}</span>}
    </div>
  );
}

/** The road: the van drives to the door (morning) or away from it (noon); in the morning its photo is pinned up. */
function Road({ away, photo }: { away: boolean; photo?: Photo }) {
  return (
    <div className="cd-road absolute inset-0">
      <Building cols={3} rows={7} />
      <span className="cd-ground" />
      <span className="cd-lane" />
      <div className="cd-track-road">
        <div className="cd-van" data-away={away ? '' : undefined}>
          <Van />
        </div>
      </div>
      {photo && (
        <figure className="cd-print">
          <div>
            <Image src={photo.src} alt="" fill sizes="190px" className="cd-fill" style={{ objectPosition: photo.position }} />
          </div>
          {photo.name && <figcaption>{photo.name}</figcaption>}
        </figure>
      )}
    </div>
  );
}

/** The school's van, drawn: a microbus with the rust stripe, its headlight beam showing in the half-light. */
function Van() {
  return (
    <svg viewBox="0 0 140 66" aria-hidden="true">
      <path className="cd-beam" d="M134 44 L200 30 L200 62 Z" />
      <path className="cd-van-body" d="M6 52V20a10 10 0 0 1 10-10h76c6 0 10 2 14 7l20 22c4 2 8 5 8 10v3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" />
      <rect x="6" y="38" width="128" height="4" fill="var(--accent)" />
      <rect className="cd-van-glass" x="16" y="16" width="24" height="14" rx="2" />
      <rect className="cd-van-glass" x="46" y="16" width="24" height="14" rx="2" />
      <path className="cd-van-glass" d="M76 16h17c3 0 6 1 8 4l10 10H76Z" />
      <circle cx="131" cy="45" r="2.5" fill="var(--color-bronze-light)" />
      {[32, 106].map((cx) => (
        <g key={cx} className="cd-wheel">
          <circle cx={cx} cy="55" r="10" fill="var(--color-ink)" />
          <circle cx={cx} cy="55" r="4.5" fill="var(--van)" />
          <rect x={cx - 1} y="46.5" width="2" height="5" fill="var(--van)" />
        </g>
      ))}
    </svg>
  );
}

/** The entrance: the building's door opens, and the reader walks through it into the photo. */
function Entrance({ photo }: { photo: Photo }) {
  return (
    <div className="cd-entrance absolute inset-0">
      <Building cols={4} rows={8} />
      <span className="cd-ground" />
      <div className="cd-through">
        <Img photo={photo} />
      </div>
      <span className="cd-door">
        <i />
        <i />
      </span>
    </div>
  );
}

/** Moments that light up in turn, joined by a line that fills as the stop goes on; over the stop's photo if it has one. */
function Moments({ stop, list }: { stop: Stop; list: number[] }) {
  const n = stop.moments.length;
  const tileBeats = (j: number) => list.filter((_, b) => Math.min(b, n - 1) === j);
  const photo = stop.photos[0];
  return (
    <div className="cd-moments" data-photo={photo ? '' : undefined}>
      {photo && (
        <div className="cd-photo">
          <Img photo={photo} />
        </div>
      )}
      <ol className="cd-tiles">
        {stop.moments.flatMap((m, j) => [
          ...(j > 0 ? [<li key={`link-${j}`} className="cd-link" {...beatsAttr(tileBeats(j))} />] : []),
          <li key={j} className="cd-tile" {...beatsAttr(tileBeats(j))}>
            <span className="cd-tile-icon">
              <Icon name={MOMENT_ICON[m.icon]} size={44} />
            </span>
            <span>{m.label}</span>
          </li>,
        ])}
      </ol>
    </div>
  );
}

