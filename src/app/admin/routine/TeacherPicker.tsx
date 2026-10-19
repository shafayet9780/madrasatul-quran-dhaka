'use client';

import type { Choice } from '@/lib/routine/availability';
import type { Teacher } from '@/lib/routine/types';
import { cn } from '@/lib/utils';

// One teacher picker for the proxy screen and the class editor: free teachers green (those who
// teach the subject first), the rest red with the reason. Big tap targets for phones.

export function TeacherPicker<T extends Teacher>({
  choices,
  subjectName,
  selected,
  onPick,
  disabled,
  foldBusy,
}: {
  choices: Choice<T>[];
  subjectName: string;
  selected?: string | null;
  onPick: (teacherId: string) => void;
  disabled?: boolean;
  /** Fold the red list away (the editor, where most teachers are busy in any period). */
  foldBusy?: boolean;
}) {
  const can = choices.filter((c) => c.free && c.canTeach);
  const other = choices.filter((c) => c.free && !c.canTeach);
  const busy = choices.filter((c) => !c.free);
  const chip = (c: Choice<T>) => {
    const on = c.teacher.id === selected;
    return (
      <li key={c.teacher.id}>
        <button
          type="button"
          disabled={!c.free || disabled}
          aria-pressed={c.free ? on : undefined}
          onClick={() => onPick(c.teacher.id)}
          className={cn(
            'flex min-h-11 flex-col items-start rounded-lg border px-3 py-1.5 text-left',
            c.free ? 'border-success/35 bg-success/5 hover:border-success hover:bg-success/10' : 'cursor-not-allowed border-destructive/25 bg-destructive/5',
            on && 'border-success bg-success/15 ring-2 ring-success/40',
          )}
        >
          <span className="text-sm font-medium text-foreground">
            {c.teacher.shortName}
            {on && <span className="text-success"> ✓</span>}
          </span>
          <span className={cn('text-[12px]', c.free ? 'text-success' : 'text-destructive')}>{c.free ? c.meta : c.why}</span>
        </button>
      </li>
    );
  };
  const section = (title: string, list: Choice<T>[]) =>
    list.length > 0 && (
      <div className="flex flex-col gap-1.5">
        <p className="m-0 text-[12.5px] font-medium text-muted-foreground">
          {title} · {list.length.toLocaleString('bn-BD')} জন
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">{list.map(chip)}</ul>
      </div>
    );
  return (
    <div className="flex flex-col gap-3">
      {can.length + other.length === 0 && <p className="m-0 text-sm text-destructive">এ সময় কোনো টিচার ফ্রি নেই।</p>}
      {section(subjectName ? `${subjectName} পড়ান` : 'ফ্রি', can)}
      {section(subjectName ? 'অন্য সাবজেক্টের টিচার' : 'ফ্রি', other)}
      {foldBusy && busy.length > 0 ? (
        <details>
          <summary className="cursor-pointer text-[12.5px] font-medium text-muted-foreground">ফ্রি নেই · {busy.length.toLocaleString('bn-BD')} জন</summary>
          <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-2 p-0">{busy.map(chip)}</ul>
        </details>
      ) : (
        section('ফ্রি নেই', busy)
      )}
    </div>
  );
}
