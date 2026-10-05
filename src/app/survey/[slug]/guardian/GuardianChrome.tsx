'use client';

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import type { GuardianConfig } from './types';

const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' });

/** Desktop header for the question screens (G1-Rate-Desktop / G2-Question-Desktop). */
export function GuardianDeskHeader({ config, child, submitter, verified }: { config: GuardianConfig; child: string; submitter: string; verified: boolean | null }) {
  return (
    <header className="sv-desk-header">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="sv-logo" aria-hidden="true">
            ম
          </div>
          <div className="flex flex-col" style={{ lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{config.snapshot.template.title}</span>
            <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
              {config.label} · শেষ {dayMonth.format(new Date(config.closesAt))}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4" style={{ marginLeft: 'auto', fontSize: 14 }}>
          <span style={{ fontWeight: 600 }}>{child}</span>
          <span style={{ color: 'var(--sv-text-muted)' }}>{submitter}</span>
          {verified && <span className="sv-chip is-ok">যাচাইকৃত</span>}
          <span style={{ fontSize: 13, color: 'var(--sv-ok)', fontWeight: 600 }}>এই ডিভাইসে সংরক্ষিত</span>
        </div>
      </div>
    </header>
  );
}

/** Segmented progress (one segment per question or subject): answered bronze, current light. */
export function Segments({ total, done, current }: { total: number; done: (i: number) => boolean; current: number }) {
  return (
    <div className="sv-segments" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={done(i) ? 'is-done' : i === current ? 'is-current' : undefined} />
      ))}
    </div>
  );
}

export type Choice = { value: string; label: string; caption?: string; na?: boolean };

/** Descriptive options as one radio group (arrow keys move and select); N/A sits apart after "অথবা". */
export function ChoiceGroup({ choices, value, onChange, labelledBy }: { choices: Choice[]; value: string | undefined; onChange: (value: string) => void; labelledBy: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = choices.findIndex((c) => c.value === value);
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + choices.length) % choices.length;
    onChange(choices[next].value);
    refs.current[next]?.focus();
  }
  const button = (choice: Choice, i: number): ReactNode => (
    <button
      key={choice.value}
      ref={(el) => {
        refs.current[i] = el;
      }}
      type="button"
      role="radio"
      aria-checked={choice.value === value}
      tabIndex={selected === -1 ? (i === 0 ? 0 : -1) : i === selected ? 0 : -1}
      className={`sv-choice${choice.na ? ' is-na' : ''}`}
      onClick={() => onChange(choice.value)}
      onKeyDown={(e) => onKeyDown(e, i)}
    >
      <span className="sv-radio-dot" aria-hidden="true" />
      <span className="flex flex-col gap-0.5">
        <span>{choice.label}</span>
        {choice.caption && <span style={{ fontSize: 13, color: 'var(--sv-text-muted)', fontWeight: 400 }}>{choice.caption}</span>}
      </span>
    </button>
  );
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-col gap-2.5">
      {choices.map((choice, i) =>
        choice.na ? (
          <div key={choice.value} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5" style={{ margin: '4px 4px 0', fontSize: 13, color: 'var(--sv-text-muted)' }} aria-hidden="true">
              <span style={{ flex: 1, height: 1, background: 'var(--sv-track)' }} />
              অথবা
              <span style={{ flex: 1, height: 1, background: 'var(--sv-track)' }} />
            </div>
            {button(choice, i)}
          </div>
        ) : (
          button(choice, i)
        )
      )}
    </div>
  );
}

/** Focus moves to the screen's heading when the question or subject changes (not on first show). */
export function useFocusOnChange(index: number) {
  const ref = useRef<HTMLHeadingElement>(null);
  const shown = useRef(index);
  useEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    ref.current?.focus();
  }, [index]);
  return ref;
}
