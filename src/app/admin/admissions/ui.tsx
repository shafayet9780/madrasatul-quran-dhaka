import Link from 'next/link';
import type { ReactNode } from 'react';
import { STATUS_LABEL, statusTone, type ApplicationStatus, type Tone } from '@/lib/admissions/admin-labels';
import { cn } from '@/lib/utils';

// Shared pieces of the admissions admin pages (docs/pre-admission-mockups/Admin*.dc.html).

/** Page body: the neutral admissions theme (.adm) inside the shared admin shell. */
export function AdmBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('adm flex flex-col gap-4 bg-transparent pt-1 text-[14px] md:gap-5', className)}>{children}</div>;
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="m-0 text-2xl font-bold tracking-[-0.01em]">{children}</h1>
      {sub && <p className="m-0 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Latin digits and IDs, tabular. */
export const LAT = '[font-family:var(--font-english)] tabular-nums';

export const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-success',
  warn: 'text-warning',
  bad: 'text-destructive',
  info: 'text-[#1d4ed8]',
  muted: 'text-muted-foreground',
  default: 'text-foreground',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={cn('inline-flex h-[22px] items-center whitespace-nowrap rounded-md border px-2 text-xs font-medium', TONE_TEXT[statusTone(status)])}>{STATUS_LABEL[status]}</span>
  );
}

export function Card({ title, children, className, action }: { title?: ReactNode; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn('rounded-xl border bg-card p-5', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          {title && <h2 className="m-0 text-[15px] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Two-tab switch between the paid and fee-pending lists (links, so each tab has its own URL). */
export function ListTabs({ current, paid, unpaid }: { current: 'paid' | 'unpaid'; paid: number; unpaid: number }) {
  const tab = (key: 'paid' | 'unpaid', href: string, label: string, count: number) => (
    <Link
      href={href}
      role="tab"
      aria-selected={current === key}
      className={cn(
        'inline-flex h-[30px] items-center gap-1.5 rounded-md px-3 text-sm font-medium no-underline',
        current === key ? 'bg-white text-foreground shadow-[0_1px_2px_rgba(23,23,23,0.08)]' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label} <span className={LAT}>{count}</span>
    </Link>
  );
  return (
    <div role="tablist" aria-label="আবেদনের তালিকা" className="inline-flex gap-0.5 self-start rounded-lg bg-muted p-[3px]">
      {tab('paid', '/admin/admissions/applications', 'পরিশোধিত', paid)}
      {tab('unpaid', '/admin/admissions/unpaid', 'ফি বাকি', unpaid)}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}
