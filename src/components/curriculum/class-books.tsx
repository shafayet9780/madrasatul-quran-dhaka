'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

type Book = { code: string; book: string; focus: string };

export type ClassPanel = {
  key: string;
  tab: string;
  title: string;
  age: string;
  stage: string;
  quran?: string;
  arabic?: Book;
  islam?: Book;
  general?: { subjects: string; note: string };
  /** Dakhil and Mutawassita: a board syllabus instead of the four lanes. */
  board?: { title: string; text: string };
};

type Lanes = { quran: string; arabic: string; islam: string; general: string };

const lane = 'flex flex-col gap-1.5 rounded-photo border-t-4 bg-paper p-[18px]';
const tab =
  'min-h-11 rounded-full border px-4 text-16 font-strong leading-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/**
 * Books and topics by class: a tab per class, one panel each. Every panel is in the server HTML (the unselected ones
 * hidden), so search engines and readers without JavaScript get all of them. Arrow keys, Home and End move between tabs.
 */
export function ClassBooks({ label, panels, lanes }: { label: string; panels: ClassPanel[]; lanes: Lanes }) {
  const id = useId();
  const [picked, setPicked] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: -picked, End: panels.length - 1 - picked }[e.key];
    if (move === undefined) return;
    e.preventDefault();
    const next = (picked + move + panels.length) % panels.length;
    setPicked(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div role="tablist" aria-label={label} onKeyDown={onKey} className="flex flex-wrap gap-2">
        {panels.map((p, k) => (
          <button
            key={p.key}
            ref={(el) => {
              tabs.current[k] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${k}`}
            aria-selected={k === picked}
            aria-controls={`${id}-panel-${k}`}
            tabIndex={k === picked ? 0 : -1}
            onClick={() => setPicked(k)}
            className={cn(tab, k === picked ? 'border-dark bg-dark text-on-dark' : 'border-line-strong bg-surface text-ink hover:bg-paper')}
          >
            {p.tab}
          </button>
        ))}
      </div>
      {panels.map((p, k) => (
        <div
          key={p.key}
          role="tabpanel"
          id={`${id}-panel-${k}`}
          aria-labelledby={`${id}-tab-${k}`}
          hidden={k !== picked}
          tabIndex={0}
          className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-[clamp(20px,3vw,32px)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <div className="flex flex-wrap items-baseline gap-x-[18px] gap-y-2">
            <h4 className="m-0 text-h3">{p.title}</h4>
            <span className="text-18 font-strong text-ink-muted">{p.age}</span>
            <span className="rounded-chip border border-line-bronze px-2 py-px text-14 font-strong text-ink-muted">{p.stage}</span>
          </div>
          {p.board ? (
            <div className="flex max-w-[46em] flex-col gap-2 rounded-photo bg-paper p-[22px]">
              <strong className="text-19 font-bold">{p.board.title}</strong>
              <p className="m-0 text-16 leading-[1.6] text-ink-body">{p.board.text}</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-3">
              {p.quran && (
                <div className={cn(lane, 'border-rust-deep')}>
                  <span className="text-13 font-strong text-ink-muted">{lanes.quran}</span>
                  <strong className="text-19 font-bold">{p.quran}</strong>
                </div>
              )}
              {p.arabic && (
                <div className={cn(lane, 'border-clay')}>
                  <span className="text-13 font-strong text-ink-muted">
                    {lanes.arabic} · {p.arabic.code}
                  </span>
                  <strong className="text-19 font-bold">{p.arabic.book}</strong>
                  <span className="text-15 leading-normal text-ink-body">{p.arabic.focus}</span>
                </div>
              )}
              {p.islam && (
                <div className={cn(lane, 'border-sand-deep')}>
                  <span className="text-13 font-strong text-ink-muted">
                    {lanes.islam} · {p.islam.code}
                  </span>
                  <strong className="text-19 font-bold">{p.islam.book}</strong>
                  <span className="text-15 leading-normal text-ink-body">{p.islam.focus}</span>
                </div>
              )}
              {p.general && (
                <div className={cn(lane, 'border-line-bronze')}>
                  <span className="text-13 font-strong text-ink-muted">{lanes.general}</span>
                  <strong className="text-19 font-bold">{p.general.subjects}</strong>
                  <span className="text-15 leading-normal text-ink-muted">{p.general.note}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
