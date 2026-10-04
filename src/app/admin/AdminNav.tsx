'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Report pages join this list as they are built (M6–M7).
const SECTIONS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'অ্যাডমিন',
    links: [
      { label: 'রাউন্ড', href: '/admin/rounds' },
      { label: 'ERP ইমপোর্ট', href: '/admin/import' },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="রিপোর্ট মেনু" className="flex flex-col gap-1 max-w-full" style={{ flex: '1 1 220px', padding: '22px 14px' }}>
      <div className="flex items-center gap-2.5" style={{ padding: '0 8px 18px' }}>
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
      </div>
      {SECTIONS.map((section) => (
        <div key={section.heading} className="flex flex-col gap-1">
          <div style={{ padding: '16px 12px 6px', fontSize: 13, fontWeight: 600, color: 'var(--sv-text-muted)' }}>{section.heading}</div>
          {section.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="sv-nav-link"
              aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
