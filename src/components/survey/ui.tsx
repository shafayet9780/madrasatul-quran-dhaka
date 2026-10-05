'use client';

import { useEffect, useId, useRef, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';

type IconProps = { size?: number; stroke?: string; width?: number };
const svg = (path: ReactNode, { size = 22, stroke = 'currentColor', width = 2 }: IconProps = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

export const Icon = {
  back: (p?: IconProps) => svg(<path d="m15 6-6 6 6 6" />, p),
  next: (p?: IconProps) => svg(<path d="M5 12h14M13 6l6 6-6 6" />, { size: 18, width: 2.2, ...p }),
  check: (p?: IconProps) => svg(<path d="m5 12 5 5 9-10" />, { size: 15, width: 2.4, ...p }),
  checkCircle: (p?: IconProps) => svg(<><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /></>, { size: 22, stroke: 'var(--sv-bronze)', width: 2.4, ...p }),
  search: (p?: IconProps) => svg(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>, { size: 18, stroke: 'var(--sv-text-muted)', ...p }),
  clock: (p?: IconProps) => svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, p),
  cloud: (p?: IconProps) => svg(<><path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z" /><path d="m9.5 13.5 2 2 3.5-4" /></>, { size: 17, stroke: 'var(--sv-ok)', ...p }),
  warn: (p?: IconProps) => svg(<><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v4M12 17h.01" /></>, { size: 20, ...p }),
  offline: (p?: IconProps) => svg(<path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 9.5-2.6M3 3l18 18M8.5 16a5 5 0 0 1 4.2-1.3M12 20h.01" />, { size: 15, width: 2.2, ...p }),
  spinner: (p?: IconProps) => (
    <span className="sv-spinner" style={{ display: 'inline-flex' }}>
      {svg(<path d="M12 3a9 9 0 1 0 9 9" />, { size: 15, width: 2.4, ...p })}
    </span>
  ),
  down: (p?: IconProps) => svg(<path d="M12 5v14M6 13l6 6 6-6" />, { size: 13, width: 2.6, ...p }),
  reverse: (p?: IconProps) => svg(<path d="M7 17 17 7M7 7h10v10" />, { size: 15, width: 2.2, ...p }),
  note: (p?: IconProps) => svg(<path d="M4 4h16v12H8l-4 4z" />, { size: 16, ...p }),
  noteFilled: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--sv-info-bg)" stroke="var(--sv-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16v12H8l-4 4z" />
      <path d="M8 9h8M8 12h5" />
    </svg>
  ),
  noteAdd: () => svg(<><path d="M4 4h16v12H8l-4 4z" /><path d="M12 7v6M9 10h6" /></>, { size: 20, stroke: 'var(--sv-icon-muted)' }),
  download: (p?: IconProps) => svg(<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />, { size: 20, width: 2.2, ...p }),
};

/** 3px progress line: `done` segments bronze, the `current` one light bronze. */
export function Progress({ total, done, current }: { total: number; done: (i: number) => boolean; current?: number }) {
  return (
    <div className="sv-progress" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={done(i) ? 'is-done' : i === current ? 'is-current' : undefined} />
      ))}
    </div>
  );
}

export function Topbar({ label, onBack, backLabel = 'পিছনে', children }: { label: ReactNode; onBack?: () => void; backLabel?: string; children?: ReactNode }) {
  return (
    <div className="sv-topbar">
      {onBack ? (
        <button type="button" className="sv-icon-btn" aria-label={backLabel} onClick={onBack}>
          {Icon.back()}
        </button>
      ) : (
        <div className="sv-icon-spacer" />
      )}
      <div className="sv-topbar-label">{label}</div>
      {children ?? <div className="sv-icon-spacer" />}
    </div>
  );
}

/**
 * Marks as a radio group in one track. Arrow keys move and select (roving tabindex),
 * so each row is one Tab stop.
 */
export function MarkTrack({
  marks,
  value,
  onChange,
  labelledBy,
  label,
  large,
  autoFocusSelected,
}: {
  autoFocusSelected?: boolean;
  marks: number[];
  value: number | undefined;
  onChange: (mark: number) => void;
  labelledBy?: string;
  label?: string;
  large?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = marks.indexOf(value as number);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + marks.length) % marks.length;
    onChange(marks[next]);
    refs.current[next]?.focus();
  }

  return (
    <div
      className={`sv-track${large ? ' is-large' : ''}`}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={label}
      style={{ ['--sv-marks' as string]: marks.length }}
    >
      {marks.map((mark, i) => (
        <button
          key={mark}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          className="sv-mark"
          aria-checked={value === mark}
          aria-label={`${bn(mark)} মার্ক`}
          tabIndex={selected === -1 ? (i === 0 ? 0 : -1) : i === selected ? 0 : -1}
          data-autofocus={autoFocusSelected && (selected === -1 ? i === 0 : i === selected) ? true : undefined}
          onClick={() => onChange(mark)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {bn(mark)}
        </button>
      ))}
    </div>
  );
}

/** Radio group of chips (class, section, subject) with arrow-key navigation. */
export function ChipRadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  columns,
}: {
  label: string;
  options: { value: T; label: string; note?: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
  columns: number;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = options.findIndex((o) => o.value === value);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="sv-group-label" id={id}>
        {label}
      </div>
      <div role="radiogroup" aria-labelledby={id} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((option, i) => (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            className="sv-chip-radio"
            aria-checked={value === option.value}
            tabIndex={selected === -1 ? (i === 0 ? 0 : -1) : i === selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <span>{option.label}</span>
            {option.note && <small>{option.note}</small>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Modal bottom sheet (centred on desktop): focus moves in, Tab stays inside, Escape closes, focus returns. */
export function Sheet({ labelledBy, onClose, children }: { labelledBy: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current!;
    const focusables = () =>
      [...node.querySelectorAll<HTMLElement>('button, [href], textarea, input, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute('disabled'));
    (node.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0])?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      } else if (event.key === 'Tab') {
        const items = focusables();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="sv-sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="sv-sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <div className="sv-sheet-grip" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

export function SaveChip({ state }: { state: SaveState }) {
  if (state === 'saving') return <span style={{ fontSize: 12.5, color: 'var(--sv-info)', fontWeight: 600 }}>সংরক্ষণ হচ্ছে…</span>;
  if (state === 'offline') return <span style={{ fontSize: 12.5, color: 'var(--sv-warn)', fontWeight: 600 }}>অফলাইন · এই ফোনে রাখা আছে</span>;
  if (state === 'error') return <span style={{ fontSize: 12.5, color: 'var(--sv-error)', fontWeight: 600 }}>সংরক্ষণ হয়নি · আবার চেষ্টা হচ্ছে</span>;
  if (state === 'saved') return <span style={{ fontSize: 12.5, color: 'var(--sv-ok)', fontWeight: 600 }}>● সংরক্ষিত</span>;
  return null;
}

const DESKTOP_QUERY = '(min-width: 960px)';

/** True on desktop widths, so screens render one layout instead of hiding the other with CSS. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(DESKTOP_QUERY);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  );
}
