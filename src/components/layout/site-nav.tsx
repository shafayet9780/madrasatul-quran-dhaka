'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

export type NavEntry = { key: string; label: string; href: string; external?: boolean };
export type NavPerson = { key: string; label: string; href?: string; photo?: string };
/** A column of the wide Our people menu: featured people (photo and name) or links, then "All …". */
export type NavColumn = { key: string; title: string; people?: NavPerson[]; links?: NavEntry[]; all: NavEntry };
/** `items` is the menu on phones; `columns`, when given, is the wide menu on desktop. */
export type NavGroup = { key: string; label: string; items: NavEntry[]; columns?: NavColumn[] };

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/**
 * The main menu. On wide screens a row of links where About us and Our people open on hover or click (Escape or a
 * click elsewhere closes them). On narrower screens a Menu button opens the same links, grouped, under the header.
 * The language switch sits beside the button, and moves to the top of the open menu on small phones (below 480px).
 */
export function SiteNav({
  items,
  label,
  menuLabel,
  language,
}: {
  items: (NavEntry | NavGroup)[];
  label: string;
  menuLabel: string;
  language: ReactNode;
}) {
  const pathname = usePathname();
  // Which menu is open, on which page (so it is closed again after any navigation), and whether a click pinned it.
  const [open, setOpen] = useState<{ key: string; path: string; pinned: boolean } | null>(null);
  const openKey = open?.path === pathname ? open.key : null;
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(null);
      root.current?.querySelector<HTMLElement>(`[data-menu="${openKey}"]`)?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [openKey]);

  // A click opens and pins a menu; a second click closes it. Hovering opens one until the pointer leaves.
  const click = (key: string) => setOpen(openKey === key && open?.pinned ? null : { key, path: pathname, pinned: true });
  const hover = (key: string | null) =>
    setOpen((o) => {
      const shown = o?.path === pathname ? o : null;
      if (key) return shown?.key === key ? shown : { key, path: pathname, pinned: false };
      return shown?.pinned ? shown : null;
    });
  const close = () => setOpen(null);
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const mobileOpen = openKey === 'mobile';

  const link = (entry: NavEntry, className: string) =>
    entry.external ? (
      <a href={entry.href} target="_blank" rel="noopener noreferrer" className={cn(className, 'gap-1.5')}>
        {entry.label}
        <Icon name="arrow-up-right" size={14} className="text-ink-faint" />
      </a>
    ) : (
      <Link href={entry.href} aria-current={current(entry.href) ? 'page' : undefined} onClick={close} className={className}>
        {entry.label}
      </Link>
    );

  // A featured person: photo (or a placeholder) and name, linking to their profile when they have one.
  const personRow = (person: NavPerson) => {
    const body = (
      <>
        {person.photo ? (
          <Image src={person.photo} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full bg-sand-pale object-cover" />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand-pale text-ink-faint">
            <Icon name="user" size={18} />
          </span>
        )}
        <span className="min-w-0">{person.label}</span>
      </>
    );
    const row = 'flex min-h-11 items-center gap-3 rounded-chip px-2 py-1 text-15 text-ink';
    return person.href ? (
      <Link href={person.href} aria-current={current(person.href) ? 'page' : undefined} onClick={close} className={cn(row, 'no-underline hover:bg-cream hover:text-rust', focusRing)}>
        {body}
      </Link>
    ) : (
      <div className={row}>{body}</div>
    );
  };

  return (
    <div ref={root} className="contents">
      <nav aria-label={label} className="hidden min-w-0 flex-1 min-[1180px]:block">
        <ul className="m-0 flex list-none items-center gap-x-6 p-0 text-16">
          {items.map((item) =>
            'items' in item ? (
              <li
                key={item.key}
                className="relative"
                onPointerEnter={(e) => e.pointerType === 'mouse' && hover(item.key)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && hover(null)}
              >
                <button
                  type="button"
                  data-menu={item.key}
                  aria-expanded={openKey === item.key}
                  aria-controls={`${id}-${item.key}`}
                  onClick={() => click(item.key)}
                  className={cn('inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-ink hover:text-rust', focusRing)}
                >
                  {item.label}
                  <Icon name="caret-down" size={14} className={cn('motion-safe:transition-transform', openKey === item.key && 'rotate-180')} />
                </button>
                {item.columns ? (
                  <div id={`${id}-${item.key}`} hidden={openKey !== item.key} className="absolute left-1/2 top-full z-30 -translate-x-1/2 pt-1">
                    <div className="flex gap-6 rounded-card border border-line bg-surface p-5 shadow-photo">
                      {item.columns.map((column) => (
                        <div key={column.key} className="flex w-60 flex-col">
                          <p className="m-0 pb-2 text-13 font-strong text-ink-muted">{column.title}</p>
                          <ul className="m-0 mb-2 list-none p-0">
                            {column.people?.map((person) => (
                              <li key={person.key}>{personRow(person)}</li>
                            ))}
                            {column.links?.map((entry) => (
                              <li key={entry.key}>
                                {link(entry, cn('flex min-h-10 items-center rounded-chip px-2 text-15 text-ink no-underline hover:bg-cream hover:text-rust', focusRing))}
                              </li>
                            ))}
                          </ul>
                          <Link
                            href={column.all.href}
                            onClick={close}
                            className={cn('mt-auto inline-flex min-h-11 items-center gap-1.5 self-start text-15 font-strong text-rust no-underline hover:text-rust-deep', focusRing)}
                          >
                            {column.all.label}
                            <Icon name="arrow-right" size={16} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div id={`${id}-${item.key}`} hidden={openKey !== item.key} className="absolute left-0 top-full z-30 pt-1">
                    <ul className="m-0 min-w-56 list-none rounded-card border border-line bg-surface p-2 shadow-photo">
                      {item.items.map((entry) => (
                        <li key={entry.key}>
                          {link(entry, cn('flex min-h-11 items-center whitespace-nowrap rounded-chip px-3 text-ink no-underline hover:bg-cream hover:text-rust', focusRing))}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ) : (
              <li key={item.key}>{link(item, cn('inline-flex min-h-11 items-center whitespace-nowrap text-ink no-underline hover:text-rust', focusRing))}</li>
            ),
          )}
        </ul>
      </nav>

      <span className="hidden min-[480px]:ml-auto min-[480px]:block">{language}</span>

      <button
        type="button"
        data-menu="mobile"
        aria-expanded={mobileOpen}
        aria-controls={`${id}-mobile`}
        onClick={() => click('mobile')}
        className={cn('ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line-strong px-4 text-15 font-semibold text-ink hover:bg-cream min-[480px]:ml-0 min-[1180px]:hidden', focusRing)}
      >
        <Icon name={mobileOpen ? 'x' : 'list'} size={18} />
        {menuLabel}
      </button>
      <div id={`${id}-mobile`} hidden={!mobileOpen} className="absolute inset-x-0 top-full z-30 max-h-[calc(100dvh-72px)] overflow-y-auto border-b border-line bg-paper shadow-photo min-[1180px]:hidden">
        <nav aria-label={label} className="page-wrap pb-4 pt-2">
          <div className="pb-2 pt-1 min-[480px]:hidden">{language}</div>
          <ul className="m-0 list-none p-0">
            {items.map((item) => (
              <li key={item.key} className="border-b border-line py-1 last:border-b-0">
                {'items' in item ? (
                  <>
                    <p className="m-0 pt-2 text-13 font-strong text-ink-muted">{item.label}</p>
                    <ul className="m-0 list-none p-0">
                      {item.items.map((entry) => (
                        <li key={entry.key}>{link(entry, cn('flex min-h-11 items-center text-17 text-ink no-underline', focusRing))}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  link(item, cn('flex min-h-12 items-center text-17 text-ink no-underline', focusRing))
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
