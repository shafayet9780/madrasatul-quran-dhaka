'use client';

import Link from 'next/link';
import { createContext, Fragment, useContext, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { Button } from '@/components/shadcn/button';
import { editorChoices } from '@/lib/routine/availability';
import { clashText, effectiveRoomId, findClashes, lookup, type Draft, type Lookup } from '@/lib/routine/clash';
import { DAY_SHORT, DAYS, dayOfDate, daysText, dhakaMinutes, dhakaToday, durationText, minutesOf, periodAt, periodText, periodTime } from '@/lib/routine/days';
import { bandSpans, sheetBlocks } from '@/lib/routine/layout';
import { teacherLoads } from '@/lib/routine/load';
import type { Assignment, Group, Period, RoutineData } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { ReportTools } from '../reports/ReportTools';
import { deleteAssignmentAction, saveAssignmentAction } from './actions';
import { ConfirmButton, INPUT, OUTLINE, RoutineDialog, SELECT, useAction } from './controls';
import { TeacherPicker } from './TeacherPicker';
import { LoadBadge } from './ui';

// The school routine (docs/class-routine.md §5) in three views: like the school's sheet (the day
// left to right in blocks), by heading (one table per জেনারেল, কুরআন, …) and by teacher. A cell of
// the first two opens the editor; names are coloured main teacher / TA as in the sheet.

type Day = 'all' | number;
type View = 'sheet' | 'heading' | 'teacher';

const VIEWS: [View, string][] = [
  ['sheet', 'শিট ভিউ'],
  ['heading', 'সেকশন অনুযায়ী'],
  ['teacher', 'টিচার অনুযায়ী'],
];

const MAIN = 'text-primary';
const TA = 'text-[#1d4ed8]';

const byDays = (a: Assignment, b: Assignment) => Math.min(...a.days) - Math.min(...b.days);

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
    <div role="radiogroup" aria-label={label} onKeyDown={move} className="inline-flex flex-wrap gap-0.5 rounded-lg bg-muted p-[3px]">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          tabIndex={value === v ? 0 : -1}
          onClick={() => onChange(v)}
          className={cn('h-[30px] rounded-md px-3 text-sm font-medium', value === v ? 'bg-white text-foreground shadow-[0_1px_2px_rgba(23,23,23,0.08)]' : 'text-muted-foreground hover:text-foreground')}
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

export function RoutineGrid({ data }: { data: RoutineData }) {
  const params = useSearchParams();
  const asked = params.get('view');
  const [view, setViewState] = useState<View>(isView(asked) ? asked : 'sheet');
  const [day, setDayState] = useState<Day>(dayParam(params.get('day')));
  // Phones start on the by-heading tables: the whole-day sheet is too wide to work in there (the
  // screen width is only known after hydration).
  useEffect(() => {
    if (!isView(asked) && window.matchMedia('(max-width: 767px)').matches) setViewState('heading');
  }, [asked]);
  // The period running now (on a school day, when that day is shown), refreshed every minute; known
  // only in the browser, so the server render never disagrees.
  const [nowId, setNowId] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      const today = dayOfDate(dhakaToday());
      setNowId(today !== null && (day === 'all' || day === today) ? (periodAt(data.periods, dhakaMinutes())?.id ?? null) : null);
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
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<{ groupId: string; periodId: string } | null>(null);
  const names = useMemo(() => lookup(data), [data]);
  const groupHref = (id: string) => `/admin/routine/groups/${id}${data.routine.status === 'active' ? '' : `?r=${data.routine.id}`}`;
  const shown = (groupId: string, periodId: string) =>
    data.assignments.filter((a) => a.groupId === groupId && a.periodId === periodId && (day === 'all' || a.days.includes(day))).sort(byDays);

  /** A group × period cell: its classes, and a button that opens the editor. */
  const cell = (g: Group, p: Period) => {
    const list = shown(g.id, p.id);
    return (
      <button type="button" className="rt-cell" onClick={() => setOpen({ groupId: g.id, periodId: p.id })} aria-label={`${g.name}, ${periodText(p)}: ${list.length ? 'বদলান' : 'ক্লাস যোগ করুন'}`}>
        {list.length ? list.map((a) => <Entry key={a.id} a={a} names={names} group={g} showDays={day === 'all'} />) : <span className="rt-add">+</span>}
      </button>
    );
  };
  const groupName = (g: Group) => (
    <>
      <Link href={groupHref(g.id)} className="no-underline hover:underline">
        {g.name}
      </Link>
      {g.defaultRoomId && <div className="text-[11.5px] font-normal text-muted-foreground">রুম {names.rooms.get(g.defaultRoomId)?.name}</div>}
    </>
  );

  const openGroup = open && names.groups.get(open.groupId);
  const openPeriod = open && data.periods.find((p) => p.id === open.periodId);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 sv-no-print">
        <Segmented label="ভিউ" value={view} options={VIEWS} onChange={setView} />
        <ReportTools printLabel="প্রিন্ট (A3)" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 sv-no-print">
        <Segmented label="দিন" value={day} options={[['all', 'সব দিন'], ...DAYS.map((d): [Day, string] => [d, DAY_SHORT[d]])]} onChange={setDay} />
        <div className="flex flex-wrap items-center gap-4 text-[13px]">
          <span className="flex items-center gap-3 text-muted-foreground">
            নামের রং: <span className={cn('font-medium', MAIN)}>মেইন টিচার</span>
            <span className={cn('font-medium', TA)}>টিএ</span>
          </span>
          {view === 'heading' && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-primary" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              সব পিরিয়ড দেখান
            </label>
          )}
        </div>
      </div>
      <p className="sv-print-only m-0 text-sm">
        {VIEWS.find(([v]) => v === view)?.[1]} · {day === 'all' ? 'সব দিন' : DAY_SHORT[day]}
      </p>

      <NowContext.Provider value={nowId}>
        {view === 'sheet' && <SheetView data={data} cell={cell} groupName={groupName} />}
        {view === 'heading' && <HeadingView data={data} showAll={showAll} cell={cell} groupName={groupName} />}
        {view === 'teacher' && <TeacherView data={data} names={names} day={day} groupHref={groupHref} />}
      </NowContext.Provider>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {openGroup && openPeriod && <CellEditor key={`${openGroup.id}:${openPeriod.id}`} data={data} names={names} group={openGroup} period={openPeriod} />}
      </Dialog>
    </>
  );
}

type CellFn = (g: Group, p: Period) => ReactNode;

const NowContext = createContext<string | null>(null);

/** A period's column head; the running period is tinted and marked "এখন". */
function PeriodTh({ p, hide }: { p: Period; hide?: string }) {
  const now = useContext(NowContext) === p.id;
  return (
    <th scope="col" className={cn('text-left', now && 'rt-now')}>
      <PeriodHead p={p} hide={hide} now={now} />
    </th>
  );
}

/** Time and length under a period, and its name when it adds something. */
function PeriodHead({ p, hide, now }: { p: Period; hide?: string; now?: boolean }) {
  return (
    <>
      {periodTime(p)}
      {now && <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[11px] font-medium text-primary-foreground sv-no-print">এখন</span>}
      <div className="text-[11.5px] font-normal text-muted-foreground">
        {durationText(minutesOf(p))}
        {p.label && p.label !== hide && ` · ${p.label}`}
      </div>
    </>
  );
}

/** The band label beside a run of groups (LEVEL-1 beside L-1 A, B, C). */
function BandCell({ band, span, className }: { band: string; span: number; className?: string }) {
  return (
    <th scope="rowgroup" rowSpan={span} className={cn('rt-band', className)}>
      {band && <span>{band}</span>}
    </th>
  );
}

/**
 * Like the school's sheet: the day left to right in blocks (HIFZ | QURAN | ARABIC | GENERAL | …),
 * each with its own groups down the side; row n of the table holds the n-th group of every block.
 */
function SheetView({ data, cell, groupName }: { data: RoutineData; cell: CellFn; groupName: (g: Group) => ReactNode }) {
  const blocks = useMemo(() => sheetBlocks(data.periods, data.assignments, data.groups), [data]);
  if (!blocks.length) {
    return <p className="m-0 rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">এখনো কোনো ক্লাস নেই। &quot;সেকশন অনুযায়ী&quot; ভিউতে গিয়ে ক্লাস যোগ করুন।</p>;
  }
  const spans = blocks.map((b) => bandSpans(b.groups));
  const rows = Math.max(...blocks.map((b) => b.groups.length));
  const width = (b: (typeof blocks)[number]) => (b.banded ? 2 : 1) + b.periods.length;
  return (
    <>
      <div className="rt-scroll overflow-x-auto rounded-xl border bg-card">
        <table className="rt-grid rt-sheet w-full">
          <thead>
            <tr>
              {blocks.map((b, i) => (
                <th key={i} scope="colgroup" colSpan={width(b)} className="rt-block-start rt-block-name">
                  {b.headings.filter(Boolean).join(' · ') || '—'}
                </th>
              ))}
            </tr>
            <tr>
              {blocks.map((b, i) => (
                <Fragment key={i}>
                  <th scope="col" colSpan={b.banded ? 2 : 1} className="rt-block-start text-left">
                    গ্রুপ
                  </th>
                  {b.periods.map((p) => (
                    <PeriodTh key={p.id} p={p} hide={b.headings[0]} />
                  ))}
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                {blocks.map((b, i) => {
                  const g = b.groups[r];
                  if (!g) return <td key={i} colSpan={width(b)} className="rt-block-start rt-empty" />;
                  return (
                    <Fragment key={i}>
                      {b.banded && spans[i][r] > 0 && <BandCell band={g.band} span={spans[i][r]} className="rt-block-start" />}
                      <th scope="row" className={cn(!b.banded && 'rt-block-start')}>
                        {groupName(g)}
                      </th>
                      {b.periods.map((p) => (
                        <td key={p.id}>{cell(g, p)}</td>
                      ))}
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-[12.5px] text-muted-foreground sv-no-print">শিট ভিউতে শুধু যেসব পিরিয়ডে ক্লাস আছে সেগুলো আসে। নতুন পিরিয়ডে বা নতুন গ্রুপে ক্লাস দিতে &quot;সেকশন অনুযায়ী&quot; ভিউতে যান।</p>
    </>
  );
}

/** One table per heading, stacked; a heading shows only the periods its groups use, unless "সব পিরিয়ড" is on. */
function HeadingView({ data, showAll, cell, groupName }: { data: RoutineData; showAll: boolean; cell: CellFn; groupName: (g: Group) => ReactNode }) {
  const sections = useMemo(() => {
    const used = new Set(data.assignments.map((a) => a.groupId));
    const groups = data.groups.filter((g) => g.active || used.has(g.id));
    return [...new Set(groups.map((g) => g.section))].map((heading) => {
      const rows = groups.filter((g) => g.section === heading);
      const ids = new Set(rows.map((g) => g.id));
      const usedPeriods = data.periods.filter((p) => data.assignments.some((a) => a.periodId === p.id && ids.has(a.groupId)));
      return { heading, rows, spans: bandSpans(rows), banded: rows.some((g) => g.band), periods: showAll || !usedPeriods.length ? data.periods : usedPeriods };
    });
  }, [data, showAll]);
  return sections.map((s) => (
    <section key={s.heading} className="flex flex-col gap-2">
      {s.heading && <h2 className="m-0 text-[15px] font-semibold">{s.heading}</h2>}
      <div className="rt-scroll overflow-x-auto rounded-xl border bg-card">
        <table className={cn('rt-grid w-full', s.banded && 'rt-banded')}>
          <thead>
            <tr>
              <th scope="col" colSpan={s.banded ? 2 : 1} className="text-left">
                গ্রুপ
              </th>
              {s.periods.map((p) => (
                <PeriodTh key={p.id} p={p} hide={s.heading} />
              ))}
            </tr>
          </thead>
          <tbody>
            {s.rows.map((g, r) => (
              <tr key={g.id}>
                {s.banded && s.spans[r] > 0 && <BandCell band={g.band} span={s.spans[r]} />}
                <th scope="row">{groupName(g)}</th>
                {s.periods.map((p) => (
                  <td key={p.id}>{cell(g, p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  ));
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

function Entry({ a, names, group, showDays }: { a: Assignment; names: Lookup; group: Group; showDays: boolean }) {
  const room = effectiveRoomId(a, names.groups);
  return (
    <span className="rt-entry">
      {showDays && a.days.length < DAYS.length && <span className="rt-days">{daysText(a.days)}</span>}
      <span className="font-medium">{names.subjects.get(a.subjectId)?.name}</span>
      <span>
        <span className={MAIN}>{names.teachers.get(a.teacherId)?.shortName}</span>
        {a.taId && (
          <>
            {' + '}
            <span className={TA}>{names.teachers.get(a.taId)?.shortName}</span>
          </>
        )}
      </span>
      {room && room !== group.defaultRoomId && <span className="rt-days">রুম {names.rooms.get(room)?.name}</span>}
      {a.note && <span className="rt-days">{a.note}</span>}
    </span>
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
