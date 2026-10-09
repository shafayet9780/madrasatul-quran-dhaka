import Link from 'next/link';
import { STATUS_LABEL, statusTone, type ApplicationStatus } from '@/lib/admissions/admin-labels';
import { cn } from '@/lib/utils';
import { LAT, TONE_TEXT } from '../ui';

// Admissions-only pieces; the shared page pieces are in ../ui.tsx.

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={cn('inline-flex h-[22px] items-center whitespace-nowrap rounded-md border px-2 text-xs font-medium', TONE_TEXT[statusTone(status)])}>{STATUS_LABEL[status]}</span>
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
