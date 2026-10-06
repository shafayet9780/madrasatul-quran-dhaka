'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ShellData } from '@/lib/survey/admin-shell';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { Icon, type IconName } from './icons';

// The admin app frame (dashboard frames D1–D4): sidebar on desktop, top bar + bottom tabs + menu
// sheet on phones. The teacher round chosen here applies to every report page (cookie sv-round).

const GUIDE = 'https://github.com/shafayet9780/madrasatul-quran-dhaka/blob/main/docs/survey-admin-guide.md';

type NavLink = { label: string; href: string; icon: IconName; badge?: boolean };
const SECTIONS: { heading: string; links: NavLink[] }[] = [
  {
    heading: 'রিপোর্ট',
    links: [
      { label: 'ওভারভিউ', href: '/admin/reports/overview', icon: 'overview' },
      { label: 'শিক্ষার মান', href: '/admin/reports/teaching', icon: 'teaching' },
      { label: 'প্রশ্নভিত্তিক ফলাফল', href: '/admin/reports/questions', icon: 'questions' },
      { label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports', icon: 'classes' },
      { label: 'শিক্ষকদের রেটিং প্যাটার্ন', href: '/admin/reports/raters', icon: 'raters' },
    ],
  },
  { heading: 'সংগ্রহ', links: [{ label: 'রেসপন্স ট্র্যাকার', href: '/admin/tracker', icon: 'tracker', badge: true }] },
  {
    heading: 'অ্যাডমিন',
    links: [
      { label: 'রাউন্ড', href: '/admin/rounds', icon: 'rounds' },
      { label: 'ERP ইমপোর্ট', href: '/admin/import', icon: 'upload' },
    ],
  },
];
const ALL_HREFS = SECTIONS.flatMap((s) => s.links.map((l) => l.href));

/** The longest nav link that the path is under (so /admin/reports/raters is not also "reports"). */
function isCurrent(pathname: string, href: string) {
  const matches = ALL_HREFS.filter((h) => pathname === h || pathname.startsWith(`${h}/`));
  return matches.sort((a, b) => b.length - a.length)[0] === href;
}

const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short' });

function roundStatus(round: { opensAt: string; closesAt: string }) {
  const now = Date.now();
  if (now < Date.parse(round.opensAt)) return { open: false, text: `${dayMonth.format(new Date(round.opensAt))} খুলবে` };
  if (now <= Date.parse(round.closesAt)) return { open: true, text: `চলমান · ${dayMonth.format(new Date(round.closesAt))} বন্ধ` };
  return { open: false, text: `বন্ধ · ${dayMonth.format(new Date(round.closesAt))}` };
}

type Shell = { data: ShellData; roundId: string | null; chooseRound: (id: string) => void; openMenu: () => void };
const ShellContext = createContext<Shell | null>(null);

export function useShell(): Shell {
  const shell = useContext(ShellContext);
  if (!shell) throw new Error('useShell outside AdminShell');
  return shell;
}

/** The teacher round for every report page: a native select styled as a card. */
export function RoundSelect({ compact = false }: { compact?: boolean }) {
  const { data, roundId, chooseRound } = useShell();
  const round = data.rounds.find((r) => r.id === roundId);
  if (!round) return null;
  const status = roundStatus(round);
  return (
    <label className={`sv-round-select${compact ? ' is-compact' : ''}`}>
      {!compact && <span className="sv-round-select-label">রাউন্ড</span>}
      <span className="sv-round-select-value">
        <span aria-hidden="true" className="sv-dot" data-open={status.open} />
        <span className="sv-round-select-name">{round.label}</span>
        {compact && <span className="sv-round-select-status"> · {status.text}</span>}
        <Icon name="updown" size={16} />
      </span>
      {!compact && <span className="sv-round-select-status">{status.text}</span>}
      <select aria-label="রাউন্ড বাছাই (সব রিপোর্টের জন্য)" value={round.id} onChange={(e) => chooseRound(e.target.value)}>
        {data.rounds.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NavLinks({ pathname, pending, compact }: { pathname: string; pending: number | null; compact: boolean }) {
  return (
    <>
      {SECTIONS.map((section) => (
        <div key={section.heading} className="flex flex-col" style={{ gap: 2 }}>
          <div className="sv-side-group">{section.heading}</div>
          {section.links.map((link) => (
            <Link key={link.href} href={link.href} className="sv-side-link" aria-current={isCurrent(pathname, link.href) ? 'page' : undefined} title={compact ? link.label : undefined}>
              <Icon name={link.icon} />
              <span className="sv-side-text">{link.label}</span>
              {link.badge && pending ? (
                <span className="sv-side-badge" aria-label={`${bn(pending)} জন অভিভাবক বাকি`}>
                  {bn(pending)} বাকি
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}

function FooterLinks({ compact }: { compact: boolean }) {
  return (
    <div className="sv-side-footer">
      <a className="sv-side-link" href={GUIDE} target="_blank" rel="noreferrer" title={compact ? 'অ্যাডমিন গাইড' : undefined}>
        <Icon name="help" />
        <span className="sv-side-text">অ্যাডমিন গাইড</span>
      </a>
      <a className="sv-side-link" href="/studio" target="_blank" rel="noreferrer" title={compact ? 'স্টুডিও' : undefined}>
        <Icon name="external" />
        <span className="sv-side-text">স্টুডিও</span>
      </a>
    </div>
  );
}

function Brand({ children }: { children?: ReactNode }) {
  return (
    <div className="sv-side-brand">
      <div aria-hidden="true" className="sv-side-logo sv-head">
        ম
      </div>
      <div className="sv-side-text flex flex-col" style={{ minWidth: 0, flex: 1 }}>
        <span style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.3 }}>মাদরাসাতুল কুরআন</span>
        <span style={{ fontSize: 12.5, color: 'var(--sv-text-muted)' }}>রিভিউ ড্যাশবোর্ড</span>
      </div>
      {children}
    </div>
  );
}

export function AdminShell({ data, children }: { data: ShellData; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  // A page opened with ?round= of a teacher round shows that one; otherwise the chosen one.
  const requested = params.get('round');
  const roundId = requested && data.rounds.some((r) => r.id === requested) ? requested : data.chosenId;

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('sv-side-collapsed') === '1');
    } catch {}
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem('sv-side-collapsed', c ? '0' : '1');
      } catch {}
      return !c;
    });

  // Phone menu sheet: opens from the top bar or the "আরও" tab, closes on Escape or navigation.
  const [menuOpen, setMenuOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const openMenu = () => {
    opener.current = document.activeElement as HTMLElement | null;
    setMenuOpen(true);
  };
  const closeMenu = () => {
    setMenuOpen(false);
    opener.current?.focus();
  };
  useEffect(() => {
    if (menuOpen) closeButton.current?.focus();
  }, [menuOpen]);
  useEffect(() => setMenuOpen(false), [pathname]);

  // ⌘K / Ctrl+K: find a student.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        router.push('/admin/reports?find=1');
      }
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  const chooseRound = (id: string) => {
    document.cookie = `sv-round=${id}; path=/admin; max-age=31536000; samesite=lax`;
    const next = new URLSearchParams(params);
    next.delete('round');
    router.push(`${pathname}${next.size ? `?${next}` : ''}`);
    router.refresh();
  };

  return (
    <ShellContext.Provider value={{ data, roundId, chooseRound, openMenu }}>
      <div className="sv-shell" data-collapsed={collapsed}>
        <aside className="sv-side sv-no-print" aria-label="অ্যাপ মেনু">
          <Brand>
            <button type="button" className="sv-icon-btn" aria-label={collapsed ? 'মেনু বড় করুন' : 'মেনু ছোট করুন'} aria-pressed={collapsed} onClick={toggleCollapsed}>
              <Icon name="panel" />
            </button>
          </Brand>
          <div className="sv-side-text flex flex-col" style={{ gap: 8 }}>
            <RoundSelect />
            <Link href="/admin/reports?find=1" className="sv-side-search">
              <Icon name="search" size={16} />
              শিক্ষার্থী খুঁজুন
              <kbd>⌘K</kbd>
            </Link>
          </div>
          <nav aria-label="রিপোর্ট মেনু" className="flex flex-col" style={{ gap: 4 }}>
            <NavLinks pathname={pathname} pending={data.pending} compact={collapsed} />
          </nav>
          <FooterLinks compact={collapsed} />
        </aside>

        <div className="sv-shell-main">{children}</div>

        <nav className="sv-tabs sv-no-print" aria-label="প্রধান মেনু">
          {(
            [
              ['ওভারভিউ', '/admin/reports/overview', 'overview'],
              ['ক্লাস', '/admin/reports', 'classes'],
              ['ট্র্যাকার', '/admin/tracker', 'tracker'],
            ] as const
          ).map(([label, href, icon]) => (
            <Link key={href} href={href} className="sv-tab" aria-current={isCurrent(pathname, href) ? 'page' : undefined}>
              <Icon name={icon} size={22} />
              {label}
            </Link>
          ))}
          <button type="button" className="sv-tab" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={openMenu}>
            <Icon name="more" size={22} />
            আরও
          </button>
        </nav>

        {menuOpen && (
          <div className="sv-sheet-wrap sv-no-print">
            <div className="sv-sheet-scrim" aria-hidden="true" onClick={closeMenu} />
            <div className="sv-sheet" role="dialog" aria-modal="true" aria-label="মেনু">
              <Brand>
                <button ref={closeButton} type="button" className="sv-icon-btn" aria-label="মেনু বন্ধ করুন" onClick={closeMenu}>
                  <Icon name="close" size={20} />
                </button>
              </Brand>
              <RoundSelect />
              <nav aria-label="রিপোর্ট মেনু (ফোন)" className="flex flex-col" style={{ gap: 4, overflowY: 'auto' }}>
                <NavLinks pathname={pathname} pending={data.pending} compact={false} />
              </nav>
              <FooterLinks compact={false} />
            </div>
          </div>
        )}
      </div>
    </ShellContext.Provider>
  );
}

/** Each page's sticky top bar: menu button (phone), breadcrumbs, page actions; the round on phones. */
export function PageTop({ crumbs, actions }: { crumbs: { label: string; href?: string }[]; actions?: ReactNode }) {
  const { openMenu } = useShell();
  return (
    <header className="sv-pagetop sv-no-print">
      <div className="sv-pagetop-bar">
        <button type="button" className="sv-icon-btn sv-phone-only" aria-label="মেনু খুলুন" onClick={openMenu}>
          <Icon name="menu" size={22} />
        </button>
        <nav aria-label="অবস্থান" className="sv-crumbs">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span key={i} className="sv-crumb" data-last={last}>
                {c.href && !last ? (
                  <Link href={c.href}>{c.label}</Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined}>{c.label}</span>
                )}
                {!last && <Icon name="chevron" size={14} />}
              </span>
            );
          })}
        </nav>
        <Link href="/admin/reports?find=1" className="sv-icon-btn sv-phone-only" aria-label="শিক্ষার্থী খুঁজুন">
          <Icon name="search" size={20} />
        </Link>
        {actions && <div className="sv-pagetop-actions">{actions}</div>}
      </div>
      <div className="sv-phone-only sv-pagetop-round">
        <RoundSelect compact />
      </div>
    </header>
  );
}
