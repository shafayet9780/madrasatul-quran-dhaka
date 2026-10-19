'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { Button } from '@/components/shadcn/button';
import { editorChoices } from '@/lib/routine/availability';
import { clashText, findClashes, lookup, type Draft, type Lookup } from '@/lib/routine/clash';
import { DAY_SHORT, DAYS, dayOfDate, daysText, dhakaMinutes, dhakaToday, periodAt, periodText } from '@/lib/routine/days';
import { teacherLoads } from '@/lib/routine/load';
import { absentIn, type Absence, type ProxyRecord } from '@/lib/routine/proxy';
import type { Assignment, Group, Period, RoutineData } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { ReportTools } from '../reports/ReportTools';
import { deleteAssignmentAction, saveAssignmentAction } from './actions';
import { byDays, involves, MAIN, NowContext, PeriodTh, TA, type CellCtx, type Changes } from './cells';
import { ConfirmButton, INPUT, OUTLINE, RoutineDialog, SELECT, useAction } from './controls';
import { TeacherPicker } from './TeacherPicker';
import { LoadBadge } from './ui';
import { PhoneDay, SheetView, TimelineView } from './views';

// The school routine (docs/class-routine.md §5) in three views: শিট (a column per block of the day,
// as on the school's sheet), টাইমলাইন (every group on one time axis) and by teacher; on a phone, one
// group's or one teacher's day. A cell opens the editor; names are coloured main teacher / TA.

type Day = 'all' | number;
type View = 'sheet' | 'timeline' | 'teacher';

const VIEWS: [View, string][] = [
  ['sheet', 'শিট'],
  ['timeline', 'টাইমলাইন'],
  ['teacher', 'টিচার অনুযায়ী'],
];

/** One colour per subject for the timeline (a soft tint of it behind the class). */
const PALETTE = ['#a47a3f', '#6f5fb0', '#c0507a', '#3f74b8', '#c88a12', '#23897e', '#7f8436', '#a3529f', '#7a5a3c', '#4f8a3a'];

/** Today's absences and proxies: the routine shows them when today's day is on screen. */
export type Today = { day: number; absences: Absence[]; proxies: ProxyRecord[] };

/** A radio group of buttons: one tab stop, arrow keys move the choice (as native radios do). */
function Segmented<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const i = options.findIndex(([v]) => v === value);
    const next = (i + step + options.length) % options.length;
    onChange(options[next][0]);
    (e.currentTarget.children[next] as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={move} className="inline-flex shrink-0 gap-0.5 rounded-lg bg-muted p-[3px]">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          tabIndex={value === v ? 0 : -1}
          onClick={() => onChange(v)}
          className={cn('h-[30px] whitespace-nowrap rounded-md px-3 text-sm font-medium', value === v ? 'bg-white text-foreground shadow-[0_1px_2px_rgba(23,23,23,0.08)]' : 'text-muted-foreground hover:text-foreground')}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

const isView = (v: string | null): v is View => VIEWS.some(([x]) => x === v);
const dayParam = (v: string | null): Day => (v !== null && (DAYS as readonly number[]).includes(Number(v)) ? Number(v) : 'all');

/** Keeps a choice in the address without a reload, so back, reload and a shared link keep it. */
function remember(key: string, value: string | null) {
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState(null, '', url);
}

export function RoutineGrid({ data, today }: { data: RoutineData; today: Today | null }) {
  const params = useSearchParams();
  const asked = params.get('view');
  const askedDay = params.get('day');
  const [view, setViewState] = useState<View>(isView(asked) ? asked : 'sheet');
  const [day, setDayState] = useState<Day>(dayParam(askedDay));
  // A phone shows one group's day: today's, unless a day is asked for (the width is only known
  // after hydration).
  useEffect(() => {
    if (askedDay === null && today && window.matchMedia('(max-width: 767px)').matches) setDayState(today.day);
  }, [askedDay, today]);
  // The period running now (on a school day, when that day is shown), refreshed every minute; known
  // only in the browser, so the server render never disagrees.
  const [nowId, setNowId] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      const weekday = dayOfDate(dhakaToday());
      setNowId(weekday !== null && (day === 'all' || day === weekday) ? (periodAt(data.periods, dhakaMinutes())?.id ?? null) : null);
    };
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [data.periods, day]);
  const setView = (v: View) => {
    setViewState(v);
    remember('view', v);
  };
  const setDay = (d: Day) => {
    setDayState(d);
    remember('day', d === 'all' ? null : String(d));
  };
  const [teacherId, setTeacherId] = useState('');
  const [colors, setColors] = useState(true);
  const [open, setOpen] = useState<{ groupId: string; periodId: string } | null>(null);
  const names = useMemo(() => lookup(data), [data]);
  const groupHref = (id: string) => `/admin/routine/groups/${id}${data.routine.status === 'active' ? '' : `?r=${data.routine.id}`}`;
  const shown = (groupId: string, periodId: string) =>
    data.assignments.filter((a) => a.groupId === groupId && a.periodId === periodId && (day === 'all' || a.days.includes(day))).sort(byDays);
  const changes: Changes | null =
    today && day === today.day
      ? {
          absent: (id, periodId) => today.absences.some((x) => x.teacherId === id && absentIn(x, periodId)),
          proxy: (assignmentId, role) => {
            const p = today.proxies.find((x) => x.assignmentId === assignmentId && x.role === role);
            return p ? { id: p.proxyTeacherId, name: names.teachers.get(p.proxyTeacherId)?.shortName ?? '' } : null;
          },
        }
      : null;
  const palette = useMemo(() => new Map([...data.subjects].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)).map((s, i) => [s.id, `${PALETTE[i % PALETTE.length]}1f`])), [data.subjects]);
  const ctx: CellCtx = { names, day, teacherId, changes, colors: view === 'timeline' && colors ? palette : null };
  const used = new Set(data.assignments.flatMap((a) => [a.teacherId, a.taId]));
  const searchable = data.teachers.filter((t) => used.has(t.id)).sort((a, b) => a.shortName.localeCompare(b.shortName));
  // Classes a week (a row on three days is three), or that day's.
  const found = teacherId ? data.assignments.filter((a) => (day === 'all' || a.days.includes(day)) && involves(a, ctx)).reduce((n, a) => n + (day === 'all' ? a.days.length : 1), 0) : 0;
  const props = { data, ctx, shown, open: (groupId: string, periodId: string) => setOpen({ groupId, periodId }), groupHref };

  const openGroup = open && names.groups.get(open.groupId);
  const openPeriod = open && data.periods.find((p) => p.id === open.periodId);

  return (
    <>
      <div className="hidden flex-wrap items-center justify-between gap-3 md:flex sv-no-print">
        <Segmented label="ভিউ" value={view} options={VIEWS} onChange={setView} />
        <ReportTools printLabel="প্রিন্ট (A3)" />
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sv-no-print">
        <div className="-mx-4 max-w-[100vw] overflow-x-auto px-4 md:mx-0 md:px-0">
          <Segmented label="দিন" value={day} options={[['all', 'সব দিন'], ...DAYS.map((d): [Day, string] => [d, today?.day === d ? `${DAY_SHORT[d]} · আজ` : DAY_SHORT[d]])]} onChange={setDay} />
        </div>
        {view !== 'teacher' && (
          <label className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            টিচার খুঁজুন
            <select className={cn(SELECT, 'min-w-36')} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">কেউ না</option>
              {searchable.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.shortName}
                </option>
              ))}
            </select>
            {teacherId && (
              <span className="font-semibold text-foreground">
                {bn(found)}টা ক্লাস{day === 'all' ? ' (সপ্তাহে)' : ''}
              </span>
            )}
          </label>
        )}
        {view === 'timeline' && (
          <label className="hidden items-center gap-2 text-sm md:flex">
            <input type="checkbox" className="size-4 accent-primary" checked={colors} onChange={(e) => setColors(e.target.checked)} />
            সাবজেক্টের রং
          </label>
        )}
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground md:ml-auto">
          <span>
            <span className={cn('font-semibold', MAIN)}>নাম</span> মেইন
          </span>
          <span>
            <span className={cn('font-semibold', TA)}>+ নাম</span> টিএ
          </span>
          <span>
            <span className="rounded border border-dashed border-[#a8a29e] px-1">নাম</span> খালি পোস্ট
          </span>
          {changes && (
            <span>
              <span className="line-through">নাম</span> <span className="font-semibold text-[#9a4a06]">→ প্রক্সি</span> আজ অ্যাবসেন্ট
            </span>
          )}
        </span>
      </div>
      <p className="sv-print-only m-0 text-sm">
        {VIEWS.find(([v]) => v === view)?.[1]} · {day === 'all' ? 'সব দিন' : DAY_SHORT[day]}
      </p>

      <NowContext.Provider value={nowId}>
        <div className="hidden md:block print:block">
          {view === 'sheet' && <SheetView {...props} />}
          {view === 'timeline' && <TimelineView {...props} />}
          {view === 'teacher' && <TeacherView data={data} names={names} day={day} groupHref={groupHref} />}
        </div>
        <div className="md:hidden print:hidden">
          <PhoneDay {...props} />
        </div>
      </NowContext.Provider>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {openGroup && openPeriod && <CellEditor key={`${openGroup.id}:${openPeriod.id}`} data={data} names={names} group={openGroup} period={openPeriod} />}
      </Dialog>
    </>
  );
}

/** One row per teacher, periods across: where each teacher is, an empty cell is a free period. */
function TeacherView({ data, names, day, groupHref }: { data: RoutineData; names: Lookup; day: Day; groupHref: (id: string) => string }) {
  const used = new Set(data.assignments.flatMap((a) => [a.teacherId, a.taId]));
  const teachers = data.teachers.filter((t) => t.active || used.has(t.id));
  const loads = useMemo(() => teacherLoads(data.teachers, data.assignments, data.periods), [data]);
  const q = data.routine.status === 'active' ? '' : `?r=${data.routine.id}`;
  return (
    <div className="rt-scroll overflow-x-auto rounded-xl border bg-card">
      <table className="rt-grid w-full">
        <thead>
          <tr>
            <th scope="col" className="text-left">
              টিচার
            </th>
            {data.periods.map((p) => (
              <PeriodTh key={p.id} p={p} />
            ))}
            <th scope="col" className="text-left">
              সপ্তাহে
            </th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => {
            const load = loads.get(t.id)!;
            return (
              <tr key={t.id}>
                <th scope="row">
                  <Link href={`/admin/routine/teachers/${t.id}${q}`} className="no-underline hover:underline">
                    {t.shortName}
                  </Link>
                  {t.isVacancy && <div className="text-[11.5px] font-normal text-muted-foreground">খালি পোস্ট</div>}
                </th>
                {data.periods.map((p) => {
                  const list = data.assignments
                    .filter((a) => a.periodId === p.id && (a.teacherId === t.id || a.taId === t.id) && (day === 'all' || a.days.includes(day)))
                    .sort(byDays);
                  return (
                    <td key={p.id}>
                      <div className="rt-cell">
                        {list.map((a) => (
                          <span key={a.id} className="rt-entry">
                            {day === 'all' && a.days.length < DAYS.length && <span className="rt-days">{daysText(a.days)}</span>}
                            <Link href={groupHref(a.groupId)} className={cn('font-medium no-underline hover:underline', a.taId === t.id ? TA : MAIN)}>
                              {names.groups.get(a.groupId)?.name}
                            </Link>
                            <span>
                              {names.subjects.get(a.subjectId)?.name}
                              {a.taId === t.id && <span className={TA}> · টিএ</span>}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                  );
                })}
                <td>
                  <div className="rt-cell">
                    <span className="tabular-nums">
                      {bn(load.weighted)}
                      {load.target != null && ` / ${bn(load.target)}`}
                    </span>
                    <span>
                      <LoadBadge status={load.status} />
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type Form = { id?: string; days: number[]; subjectId: string; teacherId: string; taId: string; roomId: string; note: string };

/**
 * One cell: its classes (a cell may change by day) and adding or changing one. Tap a subject, then
 * a teacher from the picker (green free, red busy); the TA, a split by days, the room and a note
 * are there when needed.
 */
function CellEditor({ data, names, group, period }: { data: RoutineData; names: Lookup; group: Group; period: Period }) {
  const cell = data.assignments.filter((a) => a.groupId === group.id && a.periodId === period.id).sort(byDays);
  const freeDays = () => DAYS.filter((d) => !cell.some((a) => a.days.includes(d)));
  const blank = (): Form => ({ days: freeDays(), subjectId: '', teacherId: '', taId: '', roomId: '', note: '' });
  const [form, setForm] = useState<Form>(blank);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  // Days show when the class already varies by day, or when asked for.
  const [split, setSplit] = useState(() => cell.length > 0);
  const [taOpen, setTaOpen] = useState(false);
  const { pending, run, line, warnings, clear } = useAction();
  const editing = form.id ? cell.find((a) => a.id === form.id) : undefined;
  // Every day already has a class: nothing to add, only rows to change or delete.
  const full = !form.id && freeDays().length === 0;

  const draft: Draft = { id: form.id, groupId: group.id, periodId: period.id, days: form.days, subjectId: form.subjectId, teacherId: form.teacherId, taId: form.taId || null, roomId: form.roomId || null, note: form.note };
  const clashes = form.teacherId && form.days.length ? findClashes(draft, data.assignments, names.groups, names.rooms) : [];
  const choices = editorChoices({ teachers: data.teachers, assignments: data.assignments, groups: names.groups, groupId: group.id, periodId: period.id, days: form.days, subjectId: form.subjectId, exceptId: form.id, keep: [editing?.teacherId ?? '', editing?.taId ?? ''] });
  const subjects = data.subjects.filter((s) => s.active || s.id === editing?.subjectId);
  const subjectName = names.subjects.get(form.subjectId)?.name ?? '';
  const defaultRoom = group.defaultRoomId ? names.rooms.get(group.defaultRoomId)?.name : null;
  const ta = names.teachers.get(form.taId);

  const edit = (a: Assignment) => {
    clear();
    setSplit(true);
    setTaOpen(false);
    setForm({ id: a.id, days: a.days, subjectId: a.subjectId, teacherId: a.teacherId, taId: a.taId ?? '', roomId: a.roomId ?? '', note: a.note });
  };
  const save = (confirm: boolean) =>
    run(
      () => saveAssignmentAction(data.routine.id, { ...draft, id: form.id }, confirm),
      () => {
        setTaOpen(false);
        setForm({ days: DAYS.filter((d) => !cell.some((a) => a.id !== form.id && a.days.includes(d)) && !form.days.includes(d)), subjectId: '', teacherId: '', taId: '', roomId: '', note: '' });
      },
      'সেভ হয়েছে।',
    );

  const STEP = 'm-0 text-[13px] font-medium text-muted-foreground';
  return (
    <RoutineDialog>
      <DialogHeader>
        <DialogTitle className="text-lg">
          {group.name} · {periodText(period)}
        </DialogTitle>
        <DialogDescription>সাবজেক্ট আর টিচার সিলেক্ট করে সেভ করুন। সবুজ নাম ফ্রি, লাল নাম এ সময় অন্য ক্লাসে।</DialogDescription>
      </DialogHeader>

      {cell.length > 0 && (
        <ul className="m-0 flex list-none flex-col divide-y rounded-lg border p-0">
          {cell.map((a) => (
            <li key={a.id} className={cn('flex flex-wrap items-center justify-between gap-2 px-3 py-2.5', a.id === form.id && 'bg-muted/60')}>
              <span className="flex flex-col">
                <span className="text-[12.5px] text-muted-foreground">{daysText(a.days)}</span>
                <span>
                  <span className="font-medium">{names.subjects.get(a.subjectId)?.name}</span> · <span className={MAIN}>{names.teachers.get(a.teacherId)?.shortName}</span>
                  {a.taId && (
                    <>
                      {' + '}
                      <span className={TA}>{names.teachers.get(a.taId)?.shortName}</span> <span className="text-muted-foreground">(টিএ)</span>
                    </>
                  )}
                </span>
              </span>
              <span className="inline-flex items-center gap-4">
                <button type="button" className="text-[13px] font-medium underline-offset-4 hover:underline" onClick={() => edit(a)}>
                  বদলান
                </button>
                <ConfirmButton confirm="হ্যাঁ, ডিলিট করুন" disabled={pending} onConfirm={() => run(() => deleteAssignmentAction(a.id), () => a.id === form.id && setForm(blank()))}>
                  ডিলিট
                </ConfirmButton>
              </span>
            </li>
          ))}
        </ul>
      )}

      {full ? (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed px-3 py-3 text-[13px] text-muted-foreground">
          <p className="m-0">এই ঘরের সব দিনে ক্লাস আছে। বদলাতে উপরে &quot;বদলান&quot; চাপুন, বা একটা ক্লাস ডিলিট করুন।</p>
          {line}
        </div>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save(false);
          }}
        >
          <h3 className="m-0 text-[15px] font-semibold">{form.id ? 'ক্লাসটা বদলান' : cell.length ? 'আরেকটা ক্লাস যোগ করুন' : 'ক্লাস যোগ করুন'}</h3>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className={STEP}>দিন: {form.days.length ? daysText(form.days) : 'কোনো দিন নেই'}</p>
              {!split && (
                <button type="button" className="text-[13px] underline underline-offset-4" onClick={() => setSplit(true)}>
                  দিন ভাগ করুন
                </button>
              )}
            </div>
            {split && (
              <fieldset className="m-0 flex flex-wrap gap-1.5 border-0 p-0">
                <legend className="sr-only">দিন</legend>
                {DAYS.map((d) => (
                  <label key={d} className={cn('flex h-9 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-sm', form.days.includes(d) ? 'border-primary bg-primary/5' : 'bg-white')}>
                    <input type="checkbox" className="size-3.5 accent-primary" checked={form.days.includes(d)} onChange={(e) => set({ days: e.target.checked ? [...form.days, d].sort() : form.days.filter((x) => x !== d) })} />
                    {DAY_SHORT[d]}
                  </label>
                ))}
              </fieldset>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className={STEP}>১. সাবজেক্ট</p>
            <div role="group" aria-label="সাবজেক্ট" className="flex flex-wrap gap-1.5">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={form.subjectId === s.id}
                  onClick={() => set({ subjectId: s.id })}
                  className={cn('h-9 rounded-md border px-3 text-sm', form.subjectId === s.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-white hover:border-input')}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {form.subjectId && (
            <div className="flex flex-col gap-2">
              <p className={STEP}>২. টিচার</p>
              <TeacherPicker choices={choices} subjectName={subjectName} selected={form.teacherId} onPick={(id) => set({ teacherId: id === form.teacherId ? '' : id, taId: form.taId === id ? '' : form.taId })} foldBusy />
            </div>
          )}

          {form.teacherId && (
            <div className="flex flex-col gap-2">
              {ta && !taOpen ? (
                <p className="m-0 text-sm">
                  টিএ: <span className={cn('font-medium', TA)}>{ta.shortName}</span>{' '}
                  <button type="button" className="ml-2 text-[13px] underline underline-offset-4" onClick={() => setTaOpen(true)}>
                    বদলান
                  </button>
                  <button type="button" className="ml-3 text-[13px] text-destructive underline-offset-4 hover:underline" onClick={() => set({ taId: '' })}>
                    টিএ বাদ দিন
                  </button>
                </p>
              ) : taOpen ? (
                <>
                  <p className={STEP}>টিএ (না থাকলে বাদ দিন)</p>
                  <TeacherPicker
                    choices={choices.filter((c) => c.teacher.id !== form.teacherId)}
                    subjectName={subjectName}
                    selected={form.taId}
                    onPick={(id) => {
                      set({ taId: id === form.taId ? '' : id });
                      setTaOpen(false);
                    }}
                    foldBusy
                  />
                </>
              ) : (
                <button type="button" className="self-start text-[13px] underline underline-offset-4" onClick={() => setTaOpen(true)}>
                  + টিএ যোগ করুন
                </button>
              )}

              <details className="text-[13px]" open={!!(form.roomId || form.note)}>
                <summary className="cursor-pointer text-muted-foreground">আরও: রুম, নোট</summary>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-muted-foreground">
                    রুম
                    <select className={SELECT} value={form.roomId} onChange={(e) => set({ roomId: e.target.value })}>
                      <option value="">{defaultRoom ? `গ্রুপের রুম (${defaultRoom})` : 'রুম নেই'}</option>
                      {data.rooms
                        .filter((r) => r.id !== group.defaultRoomId)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                            {r.shared ? ' (একসাথে কয়েকটা ক্লাস বসে)' : ''}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-muted-foreground">
                    নোট
                    <input className={INPUT} value={form.note} onChange={(e) => set({ note: e.target.value })} maxLength={200} placeholder="যেমন RA-1, Extra support" />
                  </label>
                </div>
              </details>
            </div>
          )}

          {clashes.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
              {clashes.map((c, i) => (
                <li key={i}>{clashText(c, names)}</li>
              ))}
            </ul>
          )}
          {warnings.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-[13px] text-warning">
              {warnings.map((w, i) => (
                <p key={i} className="m-0">
                  {w}
                </p>
              ))}
              <Button type="button" variant="outline" className={cn(OUTLINE, 'self-start text-foreground')} disabled={pending} onClick={() => save(true)}>
                তাও সেভ করুন
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" className="h-10 px-5" disabled={pending || clashes.length > 0 || !form.days.length || !form.subjectId || !form.teacherId}>
              {form.id ? 'সেভ করুন' : 'যোগ করুন'}
            </Button>
            {form.id && (
              <Button
                type="button"
                variant="outline"
                className={OUTLINE}
                onClick={() => {
                  clear();
                  setForm(blank());
                }}
              >
                বাতিল
              </Button>
            )}
            {line}
          </div>
        </form>
      )}
    </RoutineDialog>
  );
}
