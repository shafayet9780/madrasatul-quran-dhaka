import Link from 'next/link';
import type { ReactNode } from 'react';
import { STATUS_LABEL, type LoadStatus } from '@/lib/routine/load';
import { cn } from '@/lib/utils';
import { EmptyState, TONE_TEXT } from '../ui';

// Routine-only pieces; the shared page pieces are in ../ui.tsx.

const STATUS_TONE: Record<LoadStatus, keyof typeof TONE_TEXT> = { under: 'warn', ok: 'ok', over: 'bad', none: 'muted' };

export function LoadBadge({ status }: { status: LoadStatus }) {
  return <span className={cn('inline-flex h-[22px] items-center whitespace-nowrap rounded-md border bg-white px-2 text-xs font-medium', TONE_TEXT[STATUS_TONE[status]])}>{STATUS_LABEL[status]}</span>;
}

export function NoRoutine({ children }: { children?: ReactNode }) {
  return (
    <EmptyState>
      {children ?? 'এখনো কোনো রুটিন তৈরি হয়নি।'}{' '}
      <Link href="/admin/routine/setup" className="text-foreground underline underline-offset-4">
        সেটআপে গিয়ে রুটিন, পিরিয়ড ও গ্রুপ যোগ করুন।
      </Link>
    </EmptyState>
  );
}

/** "রুটিন ২০২৭ · খসড়া" under a page title. */
export function routineSub(routine: { name: string; status: string }, extra?: string) {
  return [`রুটিন ${routine.name}${routine.status === 'draft' ? ' (খসড়া)' : ''}`, extra].filter(Boolean).join(' · ');
}
