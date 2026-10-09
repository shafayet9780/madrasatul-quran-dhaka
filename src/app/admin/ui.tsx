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

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}
