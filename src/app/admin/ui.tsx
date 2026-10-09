import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Tone } from '@/lib/admissions/admin-labels';
import { cn } from '@/lib/utils';

// Page pieces shared by every admin page, both modules (docs/admin-redesign-plan.md): the shadcn
// design built for admissions (docs/pre-admission-mockups/Admin*.dc.html).

/** Page body: `.adm` scopes the shadcn base styles (shadcn.css) inside the shared admin shell. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('adm flex flex-col gap-4 bg-transparent pt-1 text-[14px] md:gap-5', className)}>{children}</div>;
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="m-0 text-2xl font-semibold tracking-[-0.01em]">{children}</h1>
      {sub && <p className="m-0 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Latin digits and IDs, tabular. */
export const LAT = '[font-family:var(--font-english)] tabular-nums';

/** A name or ID that opens its page: underlined so it reads as a link, in text colour. */
export const LINK = 'text-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-foreground';

export const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-success',
  warn: 'text-warning',
  bad: 'text-destructive',
  info: 'text-[#1d4ed8]',
  muted: 'text-muted-foreground',
  default: 'text-foreground',
};

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

/** A headline number: label, value (with a unit), one short line, an optional extra line; a link when it has a page. */
export function StatTile({ label, value, unit, sub, note, href, muted }: { label: string; value: ReactNode; unit?: string; sub?: ReactNode; note?: ReactNode; href?: string | null; muted?: boolean }) {
  const body = (
    <>
      <span className="text-[13.5px] text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={cn('text-[24px] font-semibold leading-tight tabular-nums md:text-[28px]', muted && 'text-muted-foreground')}>{value}</span>
        {unit && <span className="text-[13px] text-muted-foreground">{unit}</span>}
      </span>
      {sub && <span className="text-[12.5px] text-muted-foreground">{sub}</span>}
      {note && <span className="text-[12.5px] font-medium">{note}</span>}
    </>
  );
  const box = 'flex min-w-0 flex-col gap-1.5 rounded-xl border bg-card p-4 md:p-5';
  return href ? (
    <Link href={href} className={cn(box, 'text-foreground no-underline hover:border-input hover:bg-muted/40')}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}

/** Tiles in one row on wide screens, two columns on phones. */
export function StatTiles({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] md:gap-4">{children}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}
