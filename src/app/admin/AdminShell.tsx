'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/shadcn/dropdown-menu';
import type { AdmissionsNav } from '@/lib/admissions/admin';
import type { ShellData } from '@/lib/survey/admin-shell';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { Icon, type IconName } from './icons';

// The admin app frame (dashboard frames D1–D4): sidebar on desktop, top bar + bottom tabs + menu
// sheet on phones. Two modules share it, chosen with the switcher at the top: ভর্তি (admissions,
// /admin/admissions) and জরিপ (the teacher and guardian survey, everything else). The teacher round
// chosen here applies to every survey report page (cookie sv-round).

const GUIDE: Record<Module, string> = {
  survey: 'https://github.com/shafayet9780/madrasatul-quran-dhaka/blob/main/docs/survey-admin-guide.md',
  admissions: 'https://github.com/shafayet9780/madrasatul-quran-dhaka/blob/main/docs/pre-admission-admin-guide.md',
};

type NavLink = { label: string; href: string; icon: IconName; badge?: boolean; count?: number; external?: boolean };
type Module = 'admissions' | 'survey';
const SURVEY_SECTIONS: { heading: string; links: NavLink[] }[] = [
  {
    heading: 'রিপোর্ট',
    links: [
      { label: 'ওভারভিউ', href: '/admin/reports/overview', icon: 'overview' },
      { label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports', icon: 'classes' },
      { label: 'শিক্ষার মান', href: '/admin/reports/teaching', icon: 'teaching' },
      { label: 'প্রশ্নভিত্তিক ফলাফল', href: '/admin/reports/questions', icon: 'questions' },
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

function admissionsSections(nav: AdmissionsNav): { heading: string; links: NavLink[] }[] {
  return [
    {
      heading: `প্রি-অ্যাডমিশন ${bn(nav?.session ?? '২০২৭')}`,
      links: [
        { label: 'ওভারভিউ', href: '/admin/admissions', icon: 'overview' },
        { label: 'আবেদন', href: '/admin/admissions/applications', icon: 'people', count: nav?.paid },
        { label: 'ফি বাকি', href: '/admin/admissions/unpaid', icon: 'clock', count: nav?.unpaid },
        { label: 'মূল্যায়নের দিন', href: '/admin/admissions/evaluation-day', icon: 'scan' },
      ],
    },
    { heading: 'সেটআপ', links: [{ label: 'ফর্ম ও ফি (স্টুডিও)', href: '/studio/structure/preAdmissionForm', icon: 'sliders', external: true }] },
  ];
}

type Tab = readonly [label: string, href: string, icon: IconName];
const ADMISSIONS_TABS: Tab[] = [
  ['ওভারভিউ', '/admin/admissions', 'overview'],
  ['আবেদন', '/admin/admissions/applications', 'people'],
  ['মূল্যায়ন', '/admin/admissions/evaluation-day', 'scan'],
];
const SURVEY_TABS: Tab[] = [
  ['ওভারভিউ', '/admin/reports/overview', 'overview'],
  ['ক্লাস', '/admin/reports', 'classes'],
  ['ট্র্যাকার', '/admin/tracker', 'tracker'],
];

const moduleOf = (pathname: string): Module => (pathname === '/admin/admissions' || pathname.startsWith('/admin/admissions/') ? 'admissions' : 'survey');

/** The longest nav link that the path is under (so /admin/reports/raters is not also "reports"). */
function isCurrent(pathname: string, href: string, hrefs: string[]) {
  // The admissions overview is the module's root, so only its own page lights it.
  const matches = hrefs.filter((h) => pathname === h || (h !== '/admin/admissions' && pathname.startsWith(`${h}/`)));
  return matches.sort((a, b) => b.length - a.length)[0] === href;
}

type Shell = { data: ShellData; roundId: string | null; chooseRound: (id: string) => void; openMenu: () => void; mod: Module };
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
  const { status } = round;
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

function NavLinks({ pathname, pending, compact, sections }: { pathname: string; pending: number | null; compact: boolean; sections: { heading: string; links: NavLink[] }[] }) {
  const hrefs = sections.flatMap((s) => s.links.map((l) => l.href));
  return (
    <>
      {sections.map((section) => (
        <div key={section.heading} className="flex flex-col" style={{ gap: 2 }}>
          <div className="sv-side-group">{section.heading}</div>
          {section.links.map((link) =>
            link.external ? (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="sv-side-link" title={compact ? link.label : undefined}>
                <Icon name={link.icon} />
                <span className="sv-side-text">{link.label}</span>
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="sv-side-link" aria-current={isCurrent(pathname, link.href, hrefs) ? 'page' : undefined} title={compact ? link.label : undefined}>
                <Icon name={link.icon} />
                <span className="sv-side-text">{link.label}</span>
                {link.badge && pending ? <span className="sv-side-badge">{bn(pending)} বাকি</span> : null}
                {link.count != null ? <span className="sv-side-count">{link.count}</span> : null}
              </Link>
            ),
          )}
        </div>
      ))}
    </>
  );
}

const MODULES: Record<Module, { title: string; menu: string; href: string; icon: IconName }> = {
  admissions: { title: 'ভর্তি', menu: 'ভর্তি', href: '/admin/admissions', icon: 'admissions' },
  survey: { title: 'জরিপ', menu: 'শিক্ষক ও অভিভাবক জরিপ', href: '/admin/reports/overview', icon: 'survey' },
};

/** The module switcher (ভর্তি | জরিপ) at the top of the sidebar and the phone menu. */
function ModuleSwitch({ mod, session, compact }: { mod: Module; session: string; compact?: boolean }) {
  const current = MODULES[mod];
  const sub = mod === 'admissions' ? `প্রি-অ্যাডমিশন ${bn(session)}` : 'শিক্ষক ও অভিভাবক জরিপ';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="sv-module" aria-label={`মডিউল: ${current.title} (বদলান)`} title={compact ? current.title : undefined}>
        <span aria-hidden="true" className="sv-side-logo">
          <Icon name={current.icon} size={18} />
        </span>
        <span className="sv-side-text flex flex-col" style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
          <span style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.3 }}>{current.title}</span>
          <span style={{ fontSize: 12.5, color: 'var(--sv-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
        </span>
        <span className="sv-side-text" style={{ color: 'var(--sv-text-muted)' }}>
          <Icon name="updown" size={16} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="sv-module-menu adm w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">মডিউল</DropdownMenuLabel>
        {(Object.keys(MODULES) as Module[]).map((key) => (
          <DropdownMenuItem key={key} asChild>
            <Link href={MODULES[key].href} className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-md border">
                <Icon name={MODULES[key].icon} size={16} />
              </span>
              <span className="flex-1">{MODULES[key].menu}</span>
              {key === mod && <Icon name="check" size={16} />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FooterLinks({ compact, mod }: { compact: boolean; mod: Module }) {
  return (
    <div className="sv-side-footer">
      <a className="sv-side-link" href={GUIDE[mod]} target="_blank" rel="noreferrer" title={compact ? 'অ্যাডমিন গাইড' : undefined}>
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

function Brand({ mod, session, children }: { mod: Module; session: string; children?: ReactNode }) {
  return (
    <div className="sv-side-brand">
      <ModuleSwitch mod={mod} session={session} />
      {children}
    </div>
  );
}

export function AdminShell({ data, admissions, children }: { data: ShellData; admissions: AdmissionsNav; children: ReactNode }) {
  const pathname = usePathname();
  const mod = moduleOf(pathname);
  const sections = mod === 'admissions' ? admissionsSections(admissions) : SURVEY_SECTIONS;
  const router = useRouter();
  const params = useSearchParams();
  // A page opened with ?round= of a teacher round shows that one; otherwise the chosen one.
  const requested = params.get('round');
  // The chosen round is also kept here: a soft navigation does not re-render the layout's data.
  const [chosenId, setChosenId] = useState(data.chosenId);
  useEffect(() => setChosenId(data.chosenId), [data.chosenId]);
  const roundId = requested && data.rounds.some((r) => r.id === requested) ? requested : chosenId;

  // Folded sidebar: kept in a cookie so the server renders it folded (no jump on load).
  const [collapsed, setCollapsed] = useState(data.collapsed);
  const setFolded = (folded: boolean) => {
    document.cookie = `sv-side=${folded ? '1' : '0'}; path=/admin; max-age=31536000; samesite=lax`;
    setCollapsed(folded);
  };

  // Phone menu sheet: opens from the top bar or the "আরও" tab, closes on Escape or navigation.
  const [menuOpen, setMenuOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const openMenu = () => {
    opener.current = document.activeElement as HTMLElement | null;
    setMenuOpen(true);
  };
  const sheet = useRef<HTMLDivElement>(null);
  const closeMenu = () => {
    setMenuOpen(false);
    opener.current?.focus();
  };
  // While open: focus starts on the close button, Tab stays inside, the page behind does not scroll.
  useEffect(() => {
    if (!menuOpen) return;
    closeButton.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);
  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !sheet.current) return;
    const focusable = sheet.current.querySelectorAll<HTMLElement>('a[href], button, select');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  useEffect(() => setMenuOpen(false), [pathname]);

  // ⌘K / Ctrl+K: find a student (focus the search box when it is already on the page).
  const menuOpenRef = useRef(menuOpen);
  menuOpenRef.current = menuOpen;
  const closeRef = useRef(closeMenu);
  closeRef.current = closeMenu;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const search = document.getElementById('student-search');
        if (search) search.focus();
        else router.push('/admin/reports?find=1');
      }
      if (e.key === 'Escape' && menuOpenRef.current) closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  const chooseRound = (id: string) => {
    document.cookie = `sv-round=${id}; path=/admin; max-age=31536000; samesite=lax`;
    setChosenId(id);
    if (menuOpenRef.current) closeMenu();
    const next = new URLSearchParams(params);
    next.delete('round');
    const url = `${pathname}${next.size ? `?${next}` : ''}`;
    // The cookie is read on the server: a new URL re-renders; the same URL needs a refresh.
    if (url !== `${pathname}${params.size ? `?${params}` : ''}`) router.push(url);
    else router.refresh();
  };

  return (
    <ShellContext.Provider value={{ data, roundId, chooseRound, openMenu, mod }}>
      <div className="sv-shell" data-collapsed={collapsed} data-module={mod}>
        <aside className="sv-side sv-no-print" aria-label="অ্যাপ মেনু">
          <Brand mod={mod} session={admissions?.session ?? '2027'}>
            <button type="button" className="sv-icon-btn" aria-label={collapsed ? 'সাইডবার বড় করুন' : 'সাইডবার ছোট করুন'} onClick={() => setFolded(!collapsed)}>
              <Icon name="panel" />
            </button>
          </Brand>
          {mod === 'admissions' ? null : collapsed ? (
            <div className="flex flex-col items-center" style={{ gap: 4 }}>
              <button
                type="button"
                className="sv-icon-btn"
                aria-label="রাউন্ড বদলান (সাইডবার বড় করে)"
                title="রাউন্ড"
                onClick={() => {
                  setFolded(false);
                  // The round picker replaces this button: keep the keyboard there.
                  requestAnimationFrame(() => document.querySelector<HTMLSelectElement>('.sv-side .sv-round-select select')?.focus());
                }}
              >
                <Icon name="rounds" />
              </button>
              <Link href="/admin/reports?find=1" className="sv-icon-btn" aria-label="শিক্ষার্থী খুঁজুন" title="শিক্ষার্থী খুঁজুন">
                <Icon name="search" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 8 }}>
              <RoundSelect />
              <Link href="/admin/reports?find=1" className="sv-side-search">
                <Icon name="search" size={16} />
                শিক্ষার্থী খুঁজুন
                <kbd>⌘K</kbd>
              </Link>
            </div>
          )}
          <nav aria-label={mod === 'admissions' ? 'ভর্তি মেনু' : 'রিপোর্ট মেনু'} className="flex flex-col" style={{ gap: 4 }}>
            <NavLinks pathname={pathname} pending={data.pending} compact={collapsed} sections={sections} />
          </nav>
          <FooterLinks compact={collapsed} mod={mod} />
        </aside>

        <main className="sv-shell-main">{children}</main>

        <nav className="sv-tabs sv-no-print" aria-label="প্রধান মেনু">
          {(mod === 'admissions' ? ADMISSIONS_TABS : SURVEY_TABS).map(([label, href, icon]) => (
            <Link key={href} href={href} className="sv-tab" aria-current={isCurrent(pathname, href, sections.flatMap((x) => x.links.map((l) => l.href))) ? 'page' : undefined}>
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
            <div ref={sheet} className="sv-sheet" role="dialog" aria-modal="true" aria-label="মেনু" onKeyDown={trapTab}>
              <Brand mod={mod} session={admissions?.session ?? '2027'}>
                <button ref={closeButton} type="button" className="sv-icon-btn" aria-label="মেনু বন্ধ করুন" onClick={closeMenu}>
                  <Icon name="close" size={20} />
                </button>
              </Brand>
              {mod === 'survey' && <RoundSelect />}
              <nav aria-label={mod === 'admissions' ? 'ভর্তি মেনু (ফোন)' : 'রিপোর্ট মেনু (ফোন)'} className="flex flex-col" style={{ gap: 4, overflowY: 'auto' }}>
                <NavLinks pathname={pathname} pending={data.pending} compact={false} sections={sections} />
              </nav>
              <FooterLinks compact={false} mod={mod} />
            </div>
          </div>
        )}
      </div>
    </ShellContext.Provider>
  );
}

/** Each page's sticky top bar: menu button (phone), breadcrumbs, page actions; the round on phones. */
export function PageTop({ crumbs, actions, round = true }: { crumbs: { label: string; href?: string }[]; actions?: ReactNode; round?: boolean }) {
  const { openMenu, mod } = useShell();
  const survey = mod === 'survey';
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
                  <span className="sv-crumb-text" aria-current={last ? 'page' : undefined}>
                    {c.label}
                  </span>
                )}
                {!last && <Icon name="chevron" size={14} />}
              </span>
            );
          })}
        </nav>
        {survey && (
          <Link href="/admin/reports?find=1" className="sv-icon-btn sv-phone-only" aria-label="শিক্ষার্থী খুঁজুন">
            <Icon name="search" size={20} />
          </Link>
        )}
        {actions && <div className="sv-pagetop-actions">{actions}</div>}
      </div>
      {round && survey && (
        <div className="sv-phone-only sv-pagetop-round">
          <RoundSelect compact />
        </div>
      )}
    </header>
  );
}
