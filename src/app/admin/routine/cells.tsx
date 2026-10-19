'use client';

import { createContext, Fragment, useContext } from 'react';
import { effectiveRoomId, type Lookup } from '@/lib/routine/clash';
import { DAYS, daysText, durationText, minutesOf, periodTime } from '@/lib/routine/days';
import type { Assignment, Group, Period, Role } from '@/lib/routine/types';
import { cn } from '@/lib/utils';

// Pieces every routine view shares (docs/class-routine.md §5): the period heads, a class as the
// sheet writes it, and the tile that opens the editor.

export const MAIN = 'text-primary';
export const TA = 'text-[#1d4ed8]';

export const byDays = (a: Assignment, b: Assignment) => Math.min(...a.days) - Math.min(...b.days);

/** Today's absences and who covers them, shown in the routine when today's day is on screen. */
export type Changes = {
  absent: (teacherId: string, periodId: string) => boolean;
  proxy: (assignmentId: string, role: Role) => { id: string; name: string } | null;
};

/** What every cell needs: names, the day shown, the teacher looked for, today's changes, subject colours. */
export type CellCtx = { names: Lookup; day: 'all' | number; teacherId: string; changes: Changes | null; colors: Map<string, string> | null };

export const NowContext = createContext<string | null>(null);

/** A period's column head; the running period is tinted and marked "এখন". */
export function PeriodTh({ p, hide, className }: { p: Period; hide?: string; className?: string }) {
  const now = useContext(NowContext) === p.id;
  return (
    <th scope="col" className={cn('text-left', now && 'rt-now', className)}>
      <PeriodHead p={p} hide={hide} now={now} />
    </th>
  );
}

/** Time and length under a period, and its name when it adds something. */
export function PeriodHead({ p, hide, now }: { p: Period; hide?: string; now?: boolean }) {
  return (
    <>
      <span className="whitespace-nowrap">{periodTime(p)}</span>
      {now && <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[11px] font-medium text-primary-foreground sv-no-print">এখন</span>}
      <div className="whitespace-nowrap text-[11.5px] font-normal text-muted-foreground">
        {durationText(minutesOf(p))}
        {p.label && p.label !== hide && ` · ${p.label}`}
      </div>
    </>
  );
}

/** Whether the teacher looked for is in this class: main, TA, or covering it today. */
export function involves(a: Assignment, ctx: CellCtx) {
  const id = ctx.teacherId;
  return !!id && (a.teacherId === id || a.taId === id || ctx.changes?.proxy(a.id, 'main')?.id === id || ctx.changes?.proxy(a.id, 'ta')?.id === id);
}

/** One class: subject (with its days when the cell changes by day), teachers, a room or note when set. */
export function Entry({ a, group, ctx }: { a: Assignment; group: Group; ctx: CellCtx }) {
  const { names, day, changes } = ctx;
  const room = effectiveRoomId(a, names.groups);
  const person = (id: string, role: Role) => {
    const t = names.teachers.get(id);
    const away = !!changes?.absent(id, a.periodId);
    const cover = away ? changes!.proxy(a.id, role) : null;
    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-1">
        <span
          className={cn(
            'font-semibold',
            role === 'ta' ? TA : MAIN,
            t?.isVacancy && 'rounded border border-dashed border-[#a8a29e] px-1 text-[#44403c]',
            away && 'text-muted-foreground line-through',
            ctx.teacherId === id && 'rounded bg-foreground px-1 text-background',
          )}
        >
          {role === 'ta' && '+ '}
          {t?.shortName}
        </span>
        {away &&
          (cover ? (
            <span className={cn('font-bold text-[#9a4a06]', ctx.teacherId === cover.id && 'rounded bg-foreground px-1 text-background')}>→ {cover.name}</span>
          ) : (
            <span className="rounded-full bg-[#fdf0e1] px-1.5 text-[11px] font-bold text-[#9a4a06]">প্রক্সি লাগবে</span>
          ))}
      </span>
    );
  };
  return (
    <span className="flex flex-col items-start gap-0.5 leading-snug">
      <span className="flex flex-wrap items-center gap-x-1 font-semibold text-foreground">
        {names.subjects.get(a.subjectId)?.name}
        {day === 'all' && a.days.length < DAYS.length && <span className="rounded-full bg-black/[0.05] px-1.5 text-[10.5px] font-normal text-[#44403c]">{daysText(a.days)}</span>}
      </span>
      <span className="flex flex-wrap gap-x-2">
        {person(a.teacherId, 'main')}
        {a.taId && person(a.taId, 'ta')}
      </span>
      {room && room !== group.defaultRoomId && <span className="text-[11px] text-muted-foreground">রুম {names.rooms.get(room)?.name}</span>}
      {a.note && <span className="rounded-full bg-[#f4ece6] px-1.5 text-[10.5px] font-semibold text-primary">{a.note}</span>}
    </span>
  );
}

/** A group's classes in one period as a tile that opens the editor; "+" when there are none. */
export function Tile({ list, group, ctx, onOpen, label, className }: { list: Assignment[]; group: Group; ctx: CellCtx; onOpen: () => void; label: string; className?: string }) {
  const mine = list.some((a) => involves(a, ctx));
  const tint = ctx.colors && list.length ? ctx.colors.get(list[0].subjectId) : undefined;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${label}: ${list.length ? 'বদলান' : 'ক্লাস যোগ করুন'}`}
      style={tint && !mine ? { background: tint, borderColor: 'transparent' } : undefined}
      className={cn(
        'flex min-h-[52px] w-full flex-col gap-1.5 rounded-[10px] border px-2.5 py-2 text-left text-[12.5px]',
        list.length ? 'items-start border-[#efedea] bg-[#fbfaf9] hover:border-input' : 'items-center justify-center border-dashed border-[#d6d3d1] text-[#a8a29e] hover:text-foreground',
        ctx.teacherId && !mine && 'opacity-30',
        mine && 'border-2 border-foreground bg-white',
        className,
      )}
    >
      {list.length
        ? list.map((a, i) => (
            <Fragment key={a.id}>
              {i > 0 && <span aria-hidden className="h-px w-full bg-[#ece9e5]" />}
              <Entry a={a} group={group} ctx={ctx} />
            </Fragment>
          ))
        : '+'}
    </button>
  );
}
