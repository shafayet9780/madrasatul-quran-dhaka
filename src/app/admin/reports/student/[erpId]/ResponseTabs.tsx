'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

type Tab = { key: string; label: string; sub: string; content: ReactNode };

/** The three answer sets on the student page; every panel stays rendered so the internal print shows all of them. */
export function ResponseTabs({ tabs, label = 'কোন রিভিউ' }: { tabs: Tab[]; label?: string }) {
  const [current, setCurrent] = useState(tabs[0].key);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern, automatic activation).
  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setCurrent(tabs[next].key);
    buttons.current[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label={label} className="sv-rtabs">
        {tabs.map((t, i) => {
          const active = t.key === current;
          return (
            <button
              key={t.key}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${t.key}`}
              aria-controls={`${id}-panel-${t.key}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              data-state={active ? 'active' : 'inactive'}
              className="sv-rtab"
              onClick={() => setCurrent(t.key)}
              onKeyDown={(event) => onKeyDown(event, i)}
            >
              {t.label}
              <small>{t.sub}</small>
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`${id}-panel-${t.key}`}
          aria-labelledby={`${id}-tab-${t.key}`}
          tabIndex={0}
          data-state={t.key === current ? 'active' : 'inactive'}
          className="flex flex-col gap-3 outline-none"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
