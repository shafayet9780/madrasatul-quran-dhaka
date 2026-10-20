'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { tileGeometry } from '@/lib/home/plan';
import { toBengaliDigits } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';

type Stage = { name: string; classes: string; hours: string; split: number[]; arabicIslam: boolean };
type Subjects = { quran: string; arabic: string; arabicIslam: string; general: string };

const GAP = 6; // px between tiles
const ROLL_MS = 700;
// Slots: Quran, Arabic (or Arabic and Islamic), general. Tile colours match the curriculum map.
const SLOTS = [
  { tile: 'bg-bronze text-dark', swatch: 'bg-bronze' },
  { tile: 'bg-clay text-surface', swatch: 'bg-clay' },
  { tile: 'bg-cream text-dark', swatch: 'bg-cream' },
];
// A tile's figure is set at the largest size and scaled down, so a size change can glide too.
const scaleFor = (p: number) => (p >= 40 ? 1 : p >= 25 ? 0.62 : 0.34);
const tab = 'min-h-11 rounded-full px-2.5 py-1 text-15 font-semibold leading-[1.2]';
const padFor = (p: number) => (p >= 25 ? [16, 14] : [8, 10]); // [left, bottom] px

/**
 * The balance card: tabs for the first three stages, and tiles that glide to the stage's subject split while
 * their percentages roll (700ms, ease-out-expo). Only clip-path and transform move. The legend below the tiles
 * is the text version; the tiles are hidden from screen readers.
 */
export function StageSplit({ stages, subjects, title, hoursLabel, note, bengali }: { stages: Stage[]; subjects: Subjects; title: string; hoursLabel: string; note: string; bengali: boolean }) {
  const id = useId();
  const [stage, setStage] = useState(0);
  const [shown, setShown] = useState<number[]>(stages[0].split);
  const shownRef = useRef(shown);
  const frame = useRef(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const { split, arabicIslam } = stages[stage];
  const geometry = tileGeometry(split, GAP);
  const names = [subjects.quran, arabicIslam ? subjects.arabicIslam : subjects.arabic, subjects.general];
  const num = (n: number) => `${bengali ? toBengaliDigits(n) : n}%`;

  const pick = (next: number) => {
    if (next === stage) return;
    setStage(next);
    cancelAnimationFrame(frame.current);
    const from = shownRef.current;
    const to = stages[next].split;
    const show = (v: number[]) => {
      shownRef.current = v;
      setShown(v);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return show(to);
    let start: number | undefined;
    const step = (now: number) => {
      start ??= now;
      const p = Math.min(1, (now - start) / ROLL_MS);
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      show(from.map((f, i) => Math.round(f + (to[i] - f) * e)));
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  const onKey = (e: KeyboardEvent) => {
    const move = { ArrowRight: 1, ArrowLeft: -1, Home: -stage, End: stages.length - 1 - stage }[e.key];
    if (move === undefined) return;
    e.preventDefault();
    const next = (stage + move + stages.length) % stages.length;
    pick(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 rounded-panel bg-dark p-[clamp(18px,2.4vw,28px)] text-on-dark shadow-photo">
      <div className="flex flex-col gap-3">
        <span id={`${id}-title`} className="text-15 text-on-dark-muted">
          {title}
        </span>
        <div role="tablist" aria-labelledby={`${id}-title`} onKeyDown={onKey} className="relative grid grid-cols-3 gap-2">
          {stages.map((s, k) => (
            <button
              key={s.name}
              ref={(el) => {
                tabs.current[k] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${k}`}
              aria-selected={k === stage}
              aria-controls={`${id}-panel`}
              tabIndex={k === stage ? 0 : -1}
              onClick={() => pick(k)}
              className={cn(tab, 'text-on-dark shadow-[inset_0_0_0_1px_var(--color-line-dark-strong)] hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-light')}
            >
              {s.name}
            </button>
          ))}
          {/* The selected pill: a dark-on-cream copy of the tabs, clipped to the selected one. It glides with clip-path,
              so each label turns dark exactly where the pill covers it. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid grid-cols-3 gap-2 bg-cream text-dark transition-[clip-path] duration-700 ease-out-expo"
            style={{ clipPath: `inset(0 calc(${stages.length - 1 - stage} * (100% + 0.5rem) / 3) 0 calc(${stage} * (100% + 0.5rem) / 3) round 9999px)` }}
          >
            {stages.map((s) => (
              <span key={s.name} className={cn(tab, 'flex items-center justify-center text-center')}>
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${stage}`} className="flex flex-col gap-5">
        <p className="m-0 flex flex-wrap justify-between gap-x-4 gap-y-0.5 text-15 text-on-dark-muted">
          <strong className="font-strong text-on-dark">{stages[stage].classes}</strong>
          <span>
            {hoursLabel}: <strong className="font-strong text-on-dark">{stages[stage].hours}</strong>
          </span>
        </p>
        <div aria-hidden="true" className="relative h-[clamp(150px,15vw,196px)]">
          {geometry.map((g, i) => {
            const row = `(100% - ${g.gaps}px)`;
            const left = `calc(${g.start} * ${row} + ${g.offset}px)`;
            const right = `calc(${1 - g.start - g.size} * ${row} + ${g.gaps - g.offset}px)`;
            const p = split[i];
            return (
              <div
                key={i}
                className={cn('absolute inset-0 overflow-hidden transition-[clip-path] duration-700 ease-out-expo', SLOTS[i].tile)}
                style={{ clipPath: `inset(0 ${right} 0 ${left} round var(--radius-cell))` }}
              >
                <div className="absolute inset-0 transition-transform duration-700 ease-out-expo" style={{ transform: `translateX(calc(${left} + ${padFor(p)[0]}px))` }}>
                  <span
                    className={cn('absolute bottom-0 left-0 origin-bottom-left whitespace-nowrap text-figure-xl transition-[transform,opacity] duration-700 ease-out-expo', p === 0 && 'opacity-0')}
                    style={{ transform: `translateY(-${padFor(p)[1]}px) scale(${scaleFor(p)})` }}
                  >
                    {num(shown[i])}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <ul className="m-0 -mt-2 flex list-none flex-wrap gap-x-[18px] gap-y-1.5 p-0 text-14">
          {split.map((p, i) =>
            p > 0 ? (
              <li key={i} className="inline-flex items-center gap-2">
                <span aria-hidden="true" className={cn('size-3 rounded-[3px]', SLOTS[i].swatch)} />
                {names[i]} {num(p)}
              </li>
            ) : null,
          )}
        </ul>
      </div>
      <p className="m-0 border-t border-line-dark pt-3.5 text-13 leading-[1.55] text-on-dark-faint">{note}</p>
    </div>
  );
}
