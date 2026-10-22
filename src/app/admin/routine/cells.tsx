'use client';

import { createContext, useContext } from 'react';
import { rowOf, type Lookup } from '@/lib/routine/clash';
import { DAYS, daysText, durationText, minutesOf, spanText } from '@/lib/routine/days';
import type { Assignment, ClassType, Role, TimeSpan } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';

// Pieces every routine view shares (docs/class-routine.md §5): the time heads, a lesson as the sheet
// writes it, and the kind colours.

export const MAIN = 'text-primary';
export const TA = 'text-[#1d4ed8]';

export const byDays = (a: Assignment, b: Assignment) => Math.min(...a.days) - Math.min(...b.days);

/** Flat fills for the group types, in type order, as the school's sheet colours its blocks. */
const FILLS = [
  { bg: '#f1ecfb', ink: '#5b21b6' },
  { bg: '#fbeef4', ink: '#9d174d' },
  { bg: '#e7f3f5', ink: '#0e6273' },
  { bg: '#fcf2e4', ink: '#92400e' },
  { bg: '#eef4e6', ink: '#3f6212' },
  { bg: '#eef1f8', ink: '#1e3a8a' },
];
export type Fill = (typeof FILLS)[number];

/** Each group type's fill (classes get none). */
export function typeFills(types: ClassType[]): Map<string, Fill> {
  return new Map(types.filter((t) => t.placement !== 'class').map((t, i) => [t.id, FILLS[i % FILLS.length]]));
}

/** Today's absences and who covers them, shown in the routine when today's day is on screen. */
export type Changes = {
  absent: (teacherId: string, span: TimeSpan) => boolean;
  proxy: (assignmentId: string, role: Role) => { id: string; name: string } | null;
};

/** What every cell needs: names, room names, the day shown, the teacher looked for, today's changes, the fills. */
export type CellCtx = { names: Lookup; rooms: Map<string, string>; day: 'all' | number; teacherId: string; changes: Changes | null; fills: Map<string, Fill> };

/** The time running now ("startsAt-endsAt"), or null. */
export const NowContext = createContext<string | null>(null);
export const timeKey = (t: TimeSpan) => `${t.startsAt}-${t.endsAt}`;

/** A time's column head; the running one is tinted and marked "এখন". */
export function TimeTh({ time, className }: { time: TimeSpan; className?: string }) {
  const now = useContext(NowContext) === timeKey(time);
  return (
    <th scope="col" className={cn('text-left', now && 'rt-now', className)} data-now={now || undefined}>
      <span className="whitespace-nowrap">{spanText(time)}</span>
      {now && <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[11px] font-medium text-primary-foreground sv-no-print">এখন</span>}
      <div className="whitespace-nowrap text-[11.5px] font-normal text-muted-foreground">{durationText(minutesOf(time))}</div>
    </th>
  );
}

/** Whether the teacher looked for is in this lesson: main, TA, or covering it today. */
export function involves(a: Assignment, ctx: CellCtx) {
  const id = ctx.teacherId;
  return !!id && (a.teacherId === id || a.taId === id || ctx.changes?.proxy(a.id, 'main')?.id === id || ctx.changes?.proxy(a.id, 'ta')?.id === id);
}

/**
 * One lesson: the group's name when it sits in a class's row, the subject (with its days when the
 * cell changes by day), the teachers; struck through with the proxy when away today.
 */
export function Entry({ a, ctx, by }: { a: Assignment; ctx: CellCtx; by: 'room' | 'group' }) {
  const { names, day, changes } = ctx;
  const group = names.groups.get(a.groupId);
  const fill = group ? ctx.fills.get(group.typeId) : undefined;
  const seated = by === 'room' && rowOf(a) !== a.groupId;
  const host = by === 'group' && a.hostGroupId ? names.groups.get(a.hostGroupId) : undefined;
  const subject = names.subjects.get(a.subjectId)?.name ?? '';
  const person = (id: string, role: Role) => {
    const t = names.teachers.get(id);
    const away = !!changes?.absent(id, a);
    const cover = away ? changes!.proxy(a.id, role) : null;
    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-1">
        <span
          className={cn(
            'font-medium',
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
    <span className="rt-entry">
      {seated && (
        <span className="font-bold" style={{ color: fill?.ink }}>
          {group?.name}
        </span>
      )}
      {(!seated || !group?.name.startsWith(subject)) && (
        <span className="font-semibold text-foreground">
          {subject}
          {day === 'all' && a.days.length < DAYS.length && <span className="rt-days"> ({daysText(a.days)})</span>}
        </span>
      )}
      {seated && group?.name.startsWith(subject) && day === 'all' && a.days.length < DAYS.length && <span className="rt-days">{daysText(a.days)}</span>}
      <span className="flex flex-wrap gap-x-2">
        {person(a.teacherId, 'main')}
        {a.taId && person(a.taId, 'ta')}
      </span>
      {host && (
        <span className="text-[11.5px] text-muted-foreground">
          {host.name}-এর রুমে{host.defaultRoomId && ctx.rooms.has(host.defaultRoomId) && ` · ${bn(ctx.rooms.get(host.defaultRoomId)!)}`}
        </span>
      )}
    </span>
  );
}
