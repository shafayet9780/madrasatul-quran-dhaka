import Link from 'next/link';
import type { ReactNode } from 'react';
import { STATUS_LABEL, type Load, type LoadStatus } from '@/lib/routine/load';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { EmptyState, TONE_TEXT } from '../ui';

// Routine-only pieces; the shared page pieces are in ../ui.tsx.

const STATUS_TONE: Record<LoadStatus, keyof typeof TONE_TEXT> = { under: 'warn', ok: 'ok', over: 'bad', none: 'muted' };

export function LoadBadge({ status }: { status: LoadStatus }) {
  return <span className={cn('inline-flex h-[22px] items-center whitespace-nowrap rounded-md border bg-white px-2 text-xs font-medium', TONE_TEXT[STATUS_TONE[status]])}>{STATUS_LABEL[status]}</span>;
}

const BAR: Record<LoadStatus, string> = { under: '#1d4ed8', ok: '#15803d', over: '#b45309', none: '#78716c' };

/**
 * A teacher's week in one line: a thin bar towards the target and "main(+TA) / target" ("১২+৩ / ২৪"),
 * "টিএ ১২" with only TA classes, or "N টা ক্লাস" with no target; `word` adds the status when over or under.
 */
export function LoadLine({ load, word }: { load: Load; word?: boolean }) {
  const count = !load.main && load.ta ? `টিএ ${bn(load.ta)}` : `${bn(load.main)}${load.ta ? `+${bn(load.ta)}` : ''}`;
  const off = word && (load.status === 'over' || load.status === 'under');
  return (
    <span className="flex items-center gap-2 text-[11.5px] font-normal text-muted-foreground">
      {load.target ? (
        <span className="h-1 min-w-6 flex-1 overflow-hidden rounded-full bg-[#e7e5e4]">
          <span className="block h-full rounded-full" style={{ width: `${Math.min(100, (load.weighted / load.target) * 100)}%`, background: BAR[load.status] }} />
        </span>
      ) : null}
      <span className={cn('whitespace-nowrap tabular-nums', off && 'font-semibold text-[#9a3412]')}>
        {load.target ? `${count} / ${bn(load.target)}` : `${count}টা ক্লাস`}
        {off && ` · ${STATUS_LABEL[load.status]}`}
      </span>
    </span>
  );
}

/** A teacher's initial in a circle (dashed for an open post). */
export function Avatar({ name, vacancy, className }: { name: string; vacancy?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#efe9e3] text-[13px] font-bold text-muted-foreground', vacancy && 'border border-dashed border-[#a8a29e] bg-white', className)}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function NoRoutine({ children }: { children?: ReactNode }) {
  return (
    <EmptyState>
      {children ?? 'এখনো কোনো রুটিন বানানো হয়নি।'}{' '}
      <Link href="/admin/routine/setup" className="text-foreground underline underline-offset-4">
        সেটআপে গিয়ে রুটিন ভার্সন, ক্লাস আর গ্রুপ যোগ করুন।
      </Link>
    </EmptyState>
  );
}

/** "রুটিন ২০২৭ · খসড়া" under a page title. */
export function routineSub(routine: { name: string; status: string }, extra?: string) {
  return [`রুটিন ${routine.name}${routine.status === 'draft' ? ' (ড্রাফট)' : ''}`, extra].filter(Boolean).join(' · ');
}
