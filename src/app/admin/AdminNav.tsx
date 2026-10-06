'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Report pages join this list as they are built (M6–M7).
const SECTIONS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'রিপোর্ট',
    links: [
      { label: 'ওভারভিউ', href: '/admin/reports/overview' },
      { label: 'শিক্ষার মান', href: '/admin/reports/teaching' },
      { label: 'প্রশ্নভিত্তিক ফলাফল', href: '/admin/reports/questions' },
      { label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports' },
      { label: 'শিক্ষকদের রেটিং প্যাটার্ন', href: '/admin/reports/raters' },
      { label: 'রেসপন্স ট্র্যাকার', href: '/admin/tracker' },
    ],
  },
  {
    heading: 'অ্যাডমিন',
    links: [
      { label: 'রাউন্ড', href: '/admin/rounds' },
      { label: 'ERP ইমপোর্ট', href: '/admin/import' },
    ],
  },
];

const ALL_HREFS = SECTIONS.flatMap((s) => s.links.map((l) => l.href));

/** The longest nav link that the path is under (so /admin/reports/raters is not also "reports"). */
function isCurrent(pathname: string, href: string) {
  const matches = ALL_HREFS.filter((h) => pathname === h || pathname.startsWith(`${h}/`));
  return matches.sort((a, b) => b.length - a.length)[0] === href;
}

export function AdminNav() {
  const pathname = usePathname();
  // Phones: the links fold behind a menu button that names the current page.
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const current = SECTIONS.flatMap((s) => s.links).find((l) => isCurrent(pathname, l.href));
  return (
    <nav aria-label="রিপোর্ট মেনু" className="sv-admin-nav flex flex-col gap-1 max-w-full" style={{ flex: '1 1 220px' }}>
      <div className="sv-admin-nav-brand flex items-center gap-2.5">
        <div
          aria-hidden="true"
          className="sv-head flex items-center justify-center"
          style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--sv-bronze)', color: '#fff', fontSize: 18 }}
        >
          ম
        </div>
        <div className="flex flex-col">
          <span style={{ fontWeight: 600, fontSize: 15 }}>রিভিউ রিপোর্ট</span>
          <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>মাদরাসাতুল কুরআন, ঢাকা</span>
        </div>
        <button type="button" className="sv-sbtn sv-admin-nav-toggle" aria-expanded={open} aria-controls="admin-nav-links" onClick={() => setOpen((o) => !o)}>
          মেনু{current ? ` · ${current.label}` : ''}
        </button>
      </div>
      <div id="admin-nav-links" className="sv-admin-nav-links flex flex-col gap-1" data-open={open}>
      {SECTIONS.map((section) => (
        <div key={section.heading} className="flex flex-col gap-1">
          <div style={{ padding: '16px 12px 6px', fontSize: 13, fontWeight: 600, color: 'var(--sv-text-muted)' }}>{section.heading}</div>
          {section.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="sv-nav-link"
              aria-current={isCurrent(pathname, link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ))}
      </div>
    </nav>
  );
}
