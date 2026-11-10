'use client';

import Link from 'next/link';
import { Fragment, useContext, useEffect, useMemo, useOptimistic, useState, type DragEvent, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, ChevronLeft, ChevronRight, GripVertical, MoreHorizontal, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Dialog } from '@/components/shadcn/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/shadcn/dropdown-menu';
import { lookup, type Lookup } from '@/lib/routine/clash';
import { DAY_SHORT, DAYS, dayOfDate, daysText, dhakaMinutes, dhakaToday, distinctTimes, runningAt, sameTime, spanText } from '@/lib/routine/days';
import { cellLessons, groupSections, nameColumnAt, tableSections, type Section } from '@/lib/routine/layout';
import { teacherLoads, type Load } from '@/lib/routine/load';
import { absentIn, type Absence, type ProxyRecord } from '@/lib/routine/proxy';
import { subjectLabels } from '@/lib/routine/subjects';
import type { Assignment, RoutineData, Teacher, TimeSpan } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { setNameColumnAction } from './actions';
import { byDays, Entry, involves, MAIN, NoTeacher, NowContext, TA, TimeTh, timeKey, typeFills, type CellCtx, type Changes, type Fill } from './cells';
import { Segmented, SELECT, useAction, useUndo } from './controls';
import { LessonPanel, type PanelStart } from './LessonPanel';
import { SubjectTeachers } from './SubjectTeachers';
import { Avatar, LoadLine } from './ui';

// The school routine (docs/class-routine.md §5) in three views, every one a plain table with the
// routine's times across: টেবিল (a row per room, as on the school's sheet: Hifz and Najera groups,
// then the classes with the Quran and Arabic groups that sit in their rooms), গ্রুপ (a row per class
// or group, under its type) and টিচার. Any lesson opens the side panel; "+" in an empty cell adds one.

type Day = 'all' | number;
type View = 'table' | 'group' | 'teacher';
type Sort = 'name' | 'subject' | 'load';

const VIEWS: [View, string][] = [
  ['table', 'টেবিল'],
  ['group', 'গ্রুপ'],
  ['teacher', 'টিচার'],
];

/** Today's absences and proxies: the routine shows them when today's day is on screen. */
export type Today = { day: number; absences: Absence[]; proxies: ProxyRecord[] };

const isView = (v: string | null): v is View => VIEWS.some(([x]) => x === v);
const dayParam = (v: string | null): Day => (v !== null && (DAYS as readonly number[]).includes(Number(v)) ? Number(v) : 'all');

/** Keeps a choice in the address without a reload, so back, reload and a shared link keep it. */
function remember(key: string, value: string | null) {
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState(null, '', url);
}

const FOLD_KEY = 'routine-folded';
function readFolded(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FOLD_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/** Lessons a week (a row on three days is three), or that day's. */
const lessonCount = (list: Assignment[], day: Day) => list.filter((a) => day === 'all' || a.days.includes(day)).reduce((n, a) => n + (day === 'all' ? a.days.length : 1), 0);

export function RoutineGrid({ data, today, title, picker }: { data: RoutineData; today: Today | null; title: ReactNode; picker: ReactNode }) {
  const params = useSearchParams();
  const asked = params.get('view');
  const [view, setViewState] = useState<View>(isView(asked) ? asked : 'table');
  const [day, setDayState] = useState<Day>(dayParam(params.get('day')));
  const [teacherId, setTeacherId] = useState('');
  const [noTeacher, setNoTeacher] = useState(false);
  const [compact, setCompact] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [flash, setFlash] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [sort, setSort] = useState<Sort>('name');
  const [folded, setFolded] = useState<string[]>([]);
  useEffect(() => setFolded(readFolded()), []);
  const fold = (key: string) => {
    const next = folded.includes(key) ? folded.filter((k) => k !== key) : [...folded, key];
    setFolded(next);
    try {
      localStorage.setItem(FOLD_KEY, JSON.stringify(next));
    } catch {}
  };
  // The time running now (on a school day, when that day is shown), refreshed every minute; known
  // only in the browser, so the server render never disagrees.
  const times = useMemo(() => distinctTimes(data.assignments), [data.assignments]);
  const [nowKey, setNowKey] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      const weekday = dayOfDate(dhakaToday());
      const minutes = dhakaMinutes();
      const running = weekday !== null && (day === 'all' || day === weekday) ? times.find((t) => runningAt(t, minutes)) : undefined;
      setNowKey(running ? timeKey(running) : null);
    };
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [times, day]);
  const setView = (v: View) => {
    setViewState(v);
    remember('view', v);
  };
  const setDay = (d: Day) => {
    setDayState(d);
    remember('day', d === 'all' ? null : String(d));
  };

  // Where the টেবিল's class / group column sits; moved at once, saved behind.
  const [nameAfter, setNameAfter] = useOptimistic(data.routine.nameAfter);
  const { run, line } = useAction();
  const moveName = (k: number) => {
    const after = k === 0 ? null : times[k - 1];
    run(async () => {
      setNameAfter(after);
      return setNameColumnAction(data.routine.id, after);
    });
  };

  const names = useMemo(() => lookup(data), [data]);
  const fills = useMemo(() => typeFills(data.types), [data.types]);
  const loads = useMemo(() => teacherLoads(data.teachers, data.assignments), [data]);
  const labels = useMemo(() => subjectLabels(data.subjects, data.types), [data.subjects, data.types]);
  const changes: Changes | null =
    today && day === today.day
      ? {
          absent: (id, span) => today.absences.some((x) => x.teacherId === id && absentIn(x, span)),
          proxy: (assignmentId, role) => {
            const p = today.proxies.find((x) => x.assignmentId === assignmentId && x.role === role);
            return p ? { id: p.proxyTeacherId, name: names.teachers.get(p.proxyTeacherId)?.shortName ?? '' } : null;
          },
        }
      : null;
  const rooms = useMemo(() => new Map(data.rooms.map((r) => [r.id, r.name])), [data.rooms]);
  // Lessons with no teacher (that day's, or the week's).
  const missing = lessonCount(
    data.assignments.filter((a) => !a.teacherId),
    day,
  );
  const ctx: CellCtx = { names, rooms, day, teacherId, noTeacher: noTeacher && missing > 0, changes, fills };
  const used = new Set(data.assignments.flatMap((a) => [a.teacherId, a.taId]));
  const searchable = data.teachers.filter((t) => used.has(t.id) || t.id === teacherId).sort((a, b) => a.shortName.localeCompare(b.shortName));
  const found = teacherId ? lessonCount(data.assignments.filter((a) => involves(a, ctx)), day) : 0;
  // টিচার: the teachers listed, and the active subjects one of them has.
  const listed = data.teachers.filter((t) => t.active || used.has(t.id));
  const taught = data.subjects.filter((s) => s.active && listed.some((t) => t.subjectIds.includes(s.id))).sort((a, b) => labels.get(a.id)!.localeCompare(labels.get(b.id)!));

  const pickTeacher = (id: string) => {
    if (view === 'teacher') {
      setFlash(id);
      // Scroll the table's box only (the page stays put), the row just under the time row.
      const box = document.getElementById('rt-table');
      const row = document.getElementById(`rt-teacher-${id}`);
      if (box && row) box.scrollBy({ top: row.getBoundingClientRect().top - box.getBoundingClientRect().top - (box.querySelector('thead')?.offsetHeight ?? 0), behavior: 'smooth' });
      setTimeout(() => setFlash((f) => (f === id ? '' : f)), 1600);
      return;
    }
    setTeacherId(teacherId === id ? '' : id);
    setNoTeacher(false);
  };

  const [panel, setPanel] = useState<PanelStart | null>(null);
  const [panelKey, setPanelKey] = useState(0);
  const openPanel = (start: PanelStart) => {
    setPanel(start);
    setPanelKey((k) => k + 1);
  };
  const { show, node: toast } = useUndo();
  const sections = view === 'group' ? groupSections(data.types, data.groups, data.assignments) : tableSections(data.types, data.groups, data.assignments);

  const ICON = 'inline-flex size-9 items-center justify-center rounded-lg border bg-white text-muted-foreground hover:bg-muted hover:text-foreground';
  return (
    <>
      <div className="flex items-start gap-5">
        <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            {title}
            <div className="flex flex-wrap items-center gap-2 sv-no-print">
              {picker}
              <button
                type="button"
                aria-pressed={drawer}
                onClick={() => setDrawer(!drawer)}
                className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-sm hover:bg-muted', drawer && 'border-foreground bg-foreground text-background hover:bg-foreground')}
              >
                <BookOpen aria-hidden className="size-4" /> সাবজেক্টের টিচার
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger className={ICON} aria-label="আরও">
                  <MoreHorizontal aria-hidden className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="adm w-60">
                  <DropdownMenuItem onSelect={() => window.print()}>
                    <Printer aria-hidden /> প্রিন্ট (A4)
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/routine/setup?tab=routines">রুটিন ভার্সন (কপি, চালু করা)</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="button" className="h-9 px-4" onClick={() => openPanel({ day: day === 'all' ? null : day })}>
                <Plus aria-hidden /> ক্লাস যোগ করুন
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 sv-no-print">
            <Segmented label="ভিউ" value={view} options={VIEWS} onChange={setView} />
            <div className="-mx-4 max-w-[100vw] overflow-x-auto px-4 md:mx-0 md:px-0">
              <Segmented label="দিন" value={day} options={[['all', 'সব দিন'], ...DAYS.map((d): [Day, string] => [d, today?.day === d ? `${DAY_SHORT[d]} · আজ` : DAY_SHORT[d]])]} onChange={setDay} />
            </div>
            {view !== 'teacher' ? (
              <>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  টিচার খুঁজুন
                  <select className={cn(SELECT, 'min-w-36')} value={teacherId} onChange={(e) => (setTeacherId(e.target.value), setNoTeacher(false))}>
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
                {missing > 0 && (
                  <button
                    type="button"
                    aria-pressed={ctx.noTeacher}
                    onClick={() => (setNoTeacher(!ctx.noTeacher), setTeacherId(''))}
                    className={cn('h-9 rounded-lg border border-[#f0c9a0] bg-[#fff7ed] px-3 text-sm font-semibold text-[#9a3412] hover:bg-[#ffedd5]', ctx.noTeacher && 'border-[#9a3412] shadow-[inset_0_0_0_1px_#9a3412]')}
                  >
                    {bn(missing)}টা ক্লাসে টিচার নেই
                  </button>
                )}
                <button type="button" aria-pressed={compact} onClick={() => setCompact(!compact)} className="h-9 rounded-lg border bg-white px-3 text-sm hover:bg-muted md:ml-auto">
                  {compact ? 'বড় করে দেখুন' : 'ছোট করে দেখুন'}
                </button>
              </>
            ) : (
              <>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  সাবজেক্ট
                  <select className={cn(SELECT, 'min-w-32')} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                    <option value="">সব</option>
                    {taught.map((s) => (
                      <option key={s.id} value={s.id}>
                        {labels.get(s.id)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  সাজান
                  <select className={SELECT} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                    <option value="name">নাম</option>
                    <option value="subject">সাবজেক্ট</option>
                    <option value="load">লোড</option>
                  </select>
                </label>
              </>
            )}
          </div>
          {view !== 'teacher' && <Key fills={[...fills.entries()].map(([id, fill]) => ({ id, name: names.types.get(id)?.name ?? '', fill }))} today={!!changes} />}
          {line}
          <p className="sv-print-only m-0 text-sm">
            {VIEWS.find(([v]) => v === view)?.[1]} · {day === 'all' ? 'সব দিন' : DAY_SHORT[day]}
          </p>

          <NowContext.Provider value={nowKey}>
            {view === 'teacher' ? (
              <TeacherView
                data={data}
                teachers={listed}
                names={names}
                labels={labels}
                loads={loads}
                fills={fills}
                changes={changes}
                day={day}
                times={times}
                subjectId={subjectId}
                sort={sort}
                flash={flash}
                onOpen={(a) => openPanel({ edit: a })}
              />
            ) : (
              <Grid
                sections={sections}
                by={view === 'group' ? 'group' : 'room'}
                times={times}
                split={view === 'table' ? nameColumnAt(times, nameAfter) : 0}
                data={data}
                ctx={ctx}
                compact={compact}
                folded={folded}
                onFold={fold}
                onMove={moveName}
                onOpen={(a) => openPanel({ edit: a })}
                onAdd={(rowId, time) => openPanel({ rowId, time, day: day === 'all' ? null : day })}
              />
            )}
          </NowContext.Provider>
        </div>
        {drawer && <SubjectTeachers data={data} loads={loads} picked={view === 'teacher' ? flash : teacherId} onPick={pickTeacher} onClose={() => setDrawer(false)} />}
      </div>

      <Dialog open={!!panel} onOpenChange={(o) => !o && setPanel(null)}>
        {panel && (
          <LessonPanel
            key={panelKey}
            data={data}
            names={names}
            start={panel}
            onDone={(text, undo) => {
              setPanel(null);
              show(text, undo && (() => void undo()));
            }}
          />
        )}
      </Dialog>
      {toast}
    </>
  );
}

/** What the fills and marks mean, always on screen under the toolbar. */
function Key({ fills, today }: { fills: { id: string; name: string; fill: Fill }[]; today: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-0.5 text-[12.5px] text-[#44403c] sv-no-print">
      {fills.map((f) => (
        <span key={f.id} className="inline-flex items-center gap-1.5">
          <i aria-hidden className="inline-block size-3 rounded-[3px] border border-black/10" style={{ background: f.fill.bg }} />
          {f.name}
        </span>
      ))}
      <span className={cn('font-medium', MAIN)}>মেইন টিচার</span>
      <span className={cn('font-medium', TA)}>+ টিএ</span>
      <span className="rounded border border-dashed border-[#a8a29e] px-1 font-medium">খালি পোস্ট</span>
      <NoTeacher />
      {today && (
        <span>
          <span className="line-through">নাম</span> <span className="font-semibold text-[#9a4a06]">→ প্রক্সি</span> আজ অ্যাবসেন্ট
        </span>
      )}
    </div>
  );
}

const DRAG = 'application/x-rt-name';

/**
 * The plain routine table: a row per room (টেবিল) or per class or group (গ্রুপ), the times across,
 * the name column after the first `split` times (টেবিল only; dragged or moved with its arrows). An
 * open section has a slim heading row; folded, its one line counts the groups in class at each time.
 * Printing shows every row.
 */
function Grid({
  sections,
  by,
  times,
  split,
  data,
  ctx,
  compact,
  folded,
  onFold,
  onMove,
  onOpen,
  onAdd,
}: {
  sections: Section[];
  by: 'room' | 'group';
  times: TimeSpan[];
  split: number;
  data: RoutineData;
  ctx: CellCtx;
  compact: boolean;
  folded: string[];
  onFold: (key: string) => void;
  onMove: (split: number) => void;
  onOpen: (a: Assignment) => void;
  onAdd: (rowId: string, time: TimeSpan) => void;
}) {
  const now = useContext(NowContext);
  // While the name column is dragged: where it would land (time columns before it).
  const [drop, setDrop] = useState<number | null>(null);
  const { names, day } = ctx;
  const searching = !!ctx.teacherId || ctx.noTeacher;
  const movable = by === 'room';
  const groupHref = (id: string) => `/admin/routine/groups/${id}${data.routine.status === 'active' ? '' : `?r=${data.routine.id}`}`;
  const shownDay = day === 'all' ? null : day;
  /** A row's cells: the times before the name column, the name, then the rest. */
  const around = (name: ReactNode, cell: (t: TimeSpan) => ReactNode) => [...times.slice(0, split).map(cell), name, ...times.slice(split).map(cell)];
  const over = (i: number) => (e: DragEvent<HTMLTableCellElement>) => {
    if (!e.dataTransfer.types.includes(DRAG)) return;
    e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    setDrop(i === 0 && e.clientX < box.left + box.width / 2 ? 0 : i + 1);
  };
  const dropped = (e: DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    if (drop !== null && drop !== split) onMove(drop);
    setDrop(null);
  };
  if (!sections.length) return <p className="m-0 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">এখনো কোনো ক্লাস বা গ্রুপ নেই। সেটআপে যোগ করুন।</p>;
  const MOVE = 'inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent';
  return (
    <div id="rt-table" className={cn('rt-scroll max-h-[calc(100dvh-220px)] overflow-auto rounded-xl border bg-card', compact && 'rt-compact')}>
      <table className="rt-grid rt-table w-full">
        <thead>
          <tr>
            {around(
              <th
                key="name"
                scope="col"
                className="rt-name text-left"
                data-pin
                draggable={movable}
                onDragStart={(e) => {
                  e.dataTransfer.setData(DRAG, '1');
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => setDrop(null)}
              >
                <span className="flex items-center gap-1">
                  {movable && <GripVertical aria-hidden className="size-3.5 shrink-0 cursor-grab text-muted-foreground sv-no-print" />}
                  {by === 'room' ? 'ক্লাস / গ্রুপ' : 'গ্রুপ / ক্লাস'}
                  {movable && (
                    <span className="ml-auto flex pl-1 sv-no-print">
                      <button type="button" className={MOVE} aria-label="বাঁয়ে সরান" disabled={split === 0} onClick={() => onMove(split - 1)}>
                        <ChevronLeft aria-hidden className="size-3.5" />
                      </button>
                      <button type="button" className={MOVE} aria-label="ডানে সরান" disabled={split === times.length} onClick={() => onMove(split + 1)}>
                        <ChevronRight aria-hidden className="size-3.5" />
                      </button>
                    </span>
                  )}
                </span>
              </th>,
              (t) => {
                const i = times.indexOf(t);
                return (
                  <TimeTh
                    key={timeKey(t)}
                    time={t}
                    className={cn(drop === 0 && i === 0 && 'rt-drop-before', drop === i + 1 && 'rt-drop-after')}
                    {...(movable && { onDragOver: over(i), onDrop: dropped })}
                  />
                );
              },
            )}
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => {
            const closed = folded.includes(s.key);
            const ids = new Set(s.groups.map((g) => g.id));
            const teachers = new Set(data.assignments.filter((a) => ids.has(by === 'room' ? (a.hostGroupId ?? a.groupId) : a.groupId)).flatMap((a) => [a.teacherId, a.taId]).filter(Boolean));
            const isClasses = s.groups.every((g) => names.types.get(g.typeId)?.placement === 'class');
            const heading = (
              <>
                <span className="whitespace-nowrap text-[12.5px] font-bold text-primary">
                  <span aria-hidden className="sv-no-print">{closed ? '▸ ' : '▾ '}</span>
                  {s.title}
                </span>
                <span className="whitespace-nowrap text-[11.5px] font-normal text-muted-foreground">
                  {bn(s.groups.length)}টা {isClasses ? 'ক্লাস' : 'গ্রুপ'} · {bn(teachers.size)} জন টিচার
                </span>
              </>
            );
            return (
              <Fragment key={s.key}>
                {closed ? (
                  <tr className="rt-sec">
                    {around(
                      <th key="name" scope="rowgroup" className="rt-name">
                        <button type="button" aria-expanded={false} onClick={() => onFold(s.key)} className="flex flex-col items-start text-left">
                          {heading}
                        </button>
                      </th>,
                      (t) => {
                        const n = new Set(data.assignments.filter((a) => ids.has(by === 'room' ? (a.hostGroupId ?? a.groupId) : a.groupId) && sameTime(a, t) && (shownDay === null || a.days.includes(shownDay))).map((a) => (by === 'room' ? (a.hostGroupId ?? a.groupId) : a.groupId))).size;
                        return (
                          <td key={timeKey(t)} className={cn('text-[12px] text-muted-foreground', now === timeKey(t) && 'rt-nowcol')}>
                            {n > 0 && (
                              <span className="block whitespace-nowrap px-2 py-1.5 sv-no-print">
                                {/* টেবিল counts rooms in use (a class's room may hold a seated group). */}
                                {bn(n)}টা {isClasses ? (by === 'room' ? 'রুমে ক্লাস' : 'ক্লাস') : 'গ্রুপ'}
                              </span>
                            )}
                          </td>
                        );
                      },
                    )}
                  </tr>
                ) : (
                  <tr className="rt-sec rt-sec-open">
                    <th scope="rowgroup" colSpan={times.length + 1}>
                      <button type="button" aria-expanded onClick={() => onFold(s.key)} className="sticky left-3 inline-flex items-baseline gap-2 text-left">
                        {heading}
                      </button>
                    </th>
                  </tr>
                )}
                {s.groups.map((g) => {
                  const room = g.defaultRoomId ? data.rooms.find((r) => r.id === g.defaultRoomId)?.name : null;
                  const placement = names.types.get(g.typeId)?.placement;
                  const meta = [room && `রুম ${bn(room)}`, by === 'room' && placement !== 'class' && names.types.get(g.typeId)?.name].filter(Boolean).join(' · ');
                  return (
                    <tr key={g.id} className={cn(closed && 'rt-folded')}>
                      {around(
                        <th key="name" scope="row" className="rt-name">
                          <Link href={groupHref(g.id)} className="font-semibold no-underline hover:underline">
                            {g.name}
                          </Link>
                          {meta && <div className="text-[11.5px] font-normal text-muted-foreground">{meta}</div>}
                        </th>,
                        (t) => {
                          const list = cellLessons(data.assignments, g.id, t, by, shownDay);
                          const fill = list.length ? ctx.fills.get(names.groups.get(list[0].groupId)?.typeId ?? '') : undefined;
                          const mine = list.some((a) => involves(a, ctx));
                          // A seated group's own row (গ্রুপ) can take a lesson; in টেবিল only rooms can.
                          const canAdd = by === 'group' || placement !== 'seated';
                          return (
                            <td
                              key={timeKey(t)}
                              style={fill && !(searching && !mine) ? { background: fill.bg } : undefined}
                              className={cn('rt-td', searching && !mine && 'rt-faded', mine && 'rt-found', now === timeKey(t) && 'rt-nowcol')}
                            >
                              {list.length > 0 ? (
                                <div className="rt-cell">
                                  {list.sort(byDays).map((a) => (
                                    <button key={a.id} type="button" className="rt-lesson" onClick={() => onOpen(a)} aria-label={`${names.groups.get(a.groupId)?.name}, ${names.subjects.get(a.subjectId)?.name}: এডিট`}>
                                      <Entry a={a} ctx={ctx} by={by} />
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                canAdd && (
                                  <button type="button" className="rt-add sv-no-print" onClick={() => onAdd(g.id, t)} aria-label={`${g.name}, ${spanText(t)}: ক্লাস যোগ করুন`}>
                                    +
                                  </button>
                                )
                              )}
                            </td>
                          );
                        },
                      )}
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * One row per teacher, the times across: where each teacher is, their subjects and week by the
 * name; on one day an empty cell says "ফ্রি". A last row lists the lessons with no teacher.
 */
function TeacherView({
  data,
  teachers,
  names,
  labels,
  loads,
  fills,
  changes,
  day,
  times,
  subjectId,
  sort,
  flash,
  onOpen,
}: {
  data: RoutineData;
  teachers: Teacher[];
  names: Lookup;
  labels: Map<string, string>;
  loads: Map<string, Load>;
  fills: Map<string, Fill>;
  changes: Changes | null;
  day: Day;
  times: TimeSpan[];
  subjectId: string;
  sort: Sort;
  flash: string;
  onOpen: (a: Assignment) => void;
}) {
  const now = useContext(NowContext);
  const q = data.routine.status === 'active' ? '' : `?r=${data.routine.id}`;
  const onDay = (a: Assignment) => day === 'all' || a.days.includes(day);
  // A teacher's subjects in the setup's order (types, then subjects).
  const typeSort = new Map(data.types.map((t) => [t.id, t.sort]));
  const order = data.subjects.filter((s) => labels.has(s.id)).sort((a, b) => (typeSort.get(a.typeId) ?? 0) - (typeSort.get(b.typeId) ?? 0) || a.sort - b.sort);
  const subjectsOf = (t: Teacher) => order.filter((s) => t.subjectIds.includes(s.id)).map((s) => labels.get(s.id)!);
  const byName = (a: Teacher, b: Teacher) => a.shortName.localeCompare(b.shortName);
  const rows = teachers
    .filter((t) => !subjectId || t.subjectIds.includes(subjectId))
    .sort((a, b) => {
      if (sort === 'subject') return (subjectsOf(a)[0] ?? '￿').localeCompare(subjectsOf(b)[0] ?? '￿') || byName(a, b);
      if (sort === 'load') return loads.get(b.id)!.main + loads.get(b.id)!.ta - (loads.get(a.id)!.main + loads.get(a.id)!.ta) || byName(a, b);
      return byName(a, b);
    });
  const open = data.assignments.filter((a) => !a.teacherId && onDay(a) && (!subjectId || a.subjectId === subjectId));
  const openCount = lessonCount(open, day);
  return (
    <div id="rt-table" className="rt-scroll max-h-[calc(100dvh-220px)] overflow-auto rounded-xl border bg-card">
      <table className="rt-grid rt-table rt-teachers w-full">
        <thead>
          <tr>
            <th scope="col" className="rt-name text-left" data-pin>
              টিচার
            </th>
            {times.map((t) => (
              <TimeTh key={timeKey(t)} time={t} />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const load = loads.get(t.id)!;
            const away = !!changes && times.some((time) => changes.absent(t.id, time));
            const subjects = subjectsOf(t);
            return (
              <tr key={t.id} id={`rt-teacher-${t.id}`} className={cn(flash === t.id && 'rt-flash')}>
                <th scope="row" className={cn('rt-name', away && 'rt-away')}>
                  <div className="w-52">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={t.shortName} vacancy={t.isVacancy} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-1.5">
                          <Link href={`/admin/routine/teachers/${t.id}${q}`} className={cn('no-underline hover:underline', away && 'text-muted-foreground line-through')}>
                            {t.shortName}
                          </Link>
                          {t.isVacancy && <span className="text-[11.5px] font-normal text-muted-foreground">· খালি পোস্ট</span>}
                          {away && <span className="whitespace-nowrap rounded-full bg-[#fdf0e1] px-2 text-[11.5px] font-semibold text-[#9a3412]">আজ অ্যাবসেন্ট</span>}
                        </div>
                        <div className="truncate text-[11.5px] font-normal text-muted-foreground">{subjects.join(' · ') || '—'}</div>
                      </div>
                    </div>
                    <div className="mt-1.5">
                      <LoadLine load={load} word />
                    </div>
                  </div>
                </th>
                {times.map((time) => {
                  const list = data.assignments.filter((a) => sameTime(a, time) && (a.teacherId === t.id || a.taId === t.id) && onDay(a)).sort(byDays);
                  const fill = list.length ? fills.get(names.groups.get(list[0].groupId)?.typeId ?? '') : undefined;
                  const free = day !== 'all' && !list.length && t.active && !t.isVacancy && !changes?.absent(t.id, time);
                  return (
                    <td key={timeKey(time)} style={fill ? { background: fill.bg } : undefined} className={cn('rt-td', free && 'rt-free', now === timeKey(time) && 'rt-nowcol')}>
                      {list.length > 0 && (
                        <div className="rt-cell">
                          {list.map((a) => {
                            const role = a.taId === t.id ? 'ta' : 'main';
                            const cover = changes?.absent(t.id, a) ? changes.proxy(a.id, role) : undefined;
                            return (
                              <button key={a.id} type="button" className="rt-lesson" onClick={() => onOpen(a)}>
                                <span className="rt-entry">
                                  <span className={cn('font-semibold', role === 'ta' ? TA : MAIN)}>{names.groups.get(a.groupId)?.name}</span>
                                  <span>
                                    {names.subjects.get(a.subjectId)?.name}
                                    {role === 'ta' && <span className={TA}> · টিএ</span>}
                                    {day === 'all' && a.days.length < DAYS.length && <span className="rt-days"> · {daysText(a.days)}</span>}
                                  </span>
                                  {cover === null && <span className="self-start rounded-full bg-[#fdf0e1] px-1.5 text-[11px] font-bold text-[#9a4a06]">প্রক্সি লাগবে</span>}
                                  {cover && <span className="font-bold text-[#9a4a06]">→ {cover.name} (প্রক্সি)</span>}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {free && <div className="rt-cell">ফ্রি</div>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {open.length > 0 && (
            <tr className="rt-noteacher">
              <th scope="row" className="rt-name">
                <div className="flex w-52 items-center gap-2.5">
                  <Avatar name="?" className="border border-dashed border-[#b45309] bg-[#fff7ed] text-[#9a3412]" />
                  <div className="text-[#9a3412]">
                    টিচার নেই
                    <div className="text-[11.5px] font-normal">
                      {bn(openCount)}টা ক্লাস{day === 'all' ? ' (সপ্তাহে)' : ''}
                    </div>
                  </div>
                </div>
              </th>
              {times.map((time) => {
                const list = open.filter((a) => sameTime(a, time)).sort(byDays);
                return (
                  <td key={timeKey(time)} className={cn('rt-td', now === timeKey(time) && 'rt-nowcol')}>
                    {list.length > 0 && (
                      <div className="rt-cell">
                        {list.map((a) => (
                          <button key={a.id} type="button" className="rt-lesson" onClick={() => onOpen(a)}>
                            <span className="rt-entry">
                              <span className="font-semibold">{names.groups.get(a.groupId)?.name}</span>
                              <span>
                                {names.subjects.get(a.subjectId)?.name}
                                {day === 'all' && a.days.length < DAYS.length && <span className="rt-days"> · {daysText(a.days)}</span>}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
