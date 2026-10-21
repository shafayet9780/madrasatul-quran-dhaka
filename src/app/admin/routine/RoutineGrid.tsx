'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, MoreHorizontal, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Dialog } from '@/components/shadcn/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/shadcn/dropdown-menu';
import { lookup, type Lookup } from '@/lib/routine/clash';
import { DAY_SHORT, DAYS, dayOfDate, daysText, dhakaMinutes, dhakaToday, distinctTimes, runningAt, sameTime, spanText } from '@/lib/routine/days';
import { cellLessons, groupSections, tableSections, type Section } from '@/lib/routine/layout';
import { teacherLoads } from '@/lib/routine/load';
import { absentIn, type Absence, type ProxyRecord } from '@/lib/routine/proxy';
import type { Assignment, RoutineData, TimeSpan } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { byDays, Entry, involves, MAIN, NowContext, TA, TimeTh, timeKey, typeFills, type CellCtx, type Changes } from './cells';
import { Segmented, SELECT, useUndo } from './controls';
import { LessonPanel, type PanelStart } from './LessonPanel';
import { LoadBadge } from './ui';

// The school routine (docs/class-routine.md §5) in three views, every one a plain table with the
// routine's times across: টেবিল (a row per room, as on the school's sheet: Hifz and Najera groups,
// then the classes with the Quran and Arabic groups that sit in their rooms), গ্রুপ (a row per class
// or group, under its type) and টিচার. Any lesson opens the side panel; "+" in an empty cell adds one.

type Day = 'all' | number;
type View = 'table' | 'group' | 'teacher';

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

export function RoutineGrid({ data, today, title, picker }: { data: RoutineData; today: Today | null; title: ReactNode; picker: ReactNode }) {
  const params = useSearchParams();
  const asked = params.get('view');
  const [view, setViewState] = useState<View>(isView(asked) ? asked : 'table');
  const [day, setDayState] = useState<Day>(dayParam(params.get('day')));
  const [teacherId, setTeacherId] = useState('');
  const [compact, setCompact] = useState(false);
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

  const names = useMemo(() => lookup(data), [data]);
  const fills = useMemo(() => typeFills(data.types), [data.types]);
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
  const ctx: CellCtx = { names, rooms, day, teacherId, changes, fills };
  const used = new Set(data.assignments.flatMap((a) => [a.teacherId, a.taId]));
  const searchable = data.teachers.filter((t) => used.has(t.id)).sort((a, b) => a.shortName.localeCompare(b.shortName));
  // Lessons a week (a row on three days is three), or that day's.
  const found = teacherId ? data.assignments.filter((a) => (day === 'all' || a.days.includes(day)) && involves(a, ctx)).reduce((n, a) => n + (day === 'all' ? a.days.length : 1), 0) : 0;

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        {title}
        <div className="flex flex-wrap items-center gap-2 sv-no-print">
          {picker}
          <DropdownMenu>
            <DropdownMenuTrigger className={ICON} aria-label="রঙের মানে">
              <HelpCircle aria-hidden className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="adm w-72 p-3 text-[13px]">
              <Legend fills={[...fills.entries()].map(([id, fill]) => ({ name: names.types.get(id)?.name ?? '', fill }))} today={!!changes} />
            </DropdownMenuContent>
          </DropdownMenu>
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
        {view !== 'teacher' && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
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
        {view !== 'teacher' && (
          <button type="button" aria-pressed={compact} onClick={() => setCompact(!compact)} className="h-9 rounded-lg border bg-white px-3 text-sm hover:bg-muted md:ml-auto">
            {compact ? 'বড় করে দেখুন' : 'ছোট করে দেখুন'}
          </button>
        )}
      </div>
      <p className="sv-print-only m-0 text-sm">
        {VIEWS.find(([v]) => v === view)?.[1]} · {day === 'all' ? 'সব দিন' : DAY_SHORT[day]}
      </p>

      <NowContext.Provider value={nowKey}>
        {view === 'teacher' ? (
          <TeacherView data={data} names={names} day={day} times={times} onOpen={(a) => openPanel({ edit: a })} />
        ) : (
          <Grid
            sections={sections}
            by={view === 'group' ? 'group' : 'room'}
            times={times}
            data={data}
            ctx={ctx}
            compact={compact}
            folded={folded}
            onFold={fold}
            onOpen={(a) => openPanel({ edit: a })}
            onAdd={(rowId, time) => openPanel({ rowId, time, day: day === 'all' ? null : day })}
          />
        )}
      </NowContext.Provider>

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

/**
 * The plain routine table: a row per room (টেবিল) or per class or group (গ্রুপ), the times across.
 * A section heading folds its rows into one line that counts the groups in class at each time;
 * printing shows every row.
 */
function Grid({
  sections,
  by,
  times,
  data,
  ctx,
  compact,
  folded,
  onFold,
  onOpen,
  onAdd,
}: {
  sections: Section[];
  by: 'room' | 'group';
  times: TimeSpan[];
  data: RoutineData;
  ctx: CellCtx;
  compact: boolean;
  folded: string[];
  onFold: (key: string) => void;
  onOpen: (a: Assignment) => void;
  onAdd: (rowId: string, time: TimeSpan) => void;
}) {
  const { names, day, teacherId } = ctx;
  const groupHref = (id: string) => `/admin/routine/groups/${id}${data.routine.status === 'active' ? '' : `?r=${data.routine.id}`}`;
  const shownDay = day === 'all' ? null : day;
  if (!sections.length) return <p className="m-0 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">এখনো কোনো ক্লাস বা গ্রুপ নেই। সেটআপে যোগ করুন।</p>;
  return (
    <div id="rt-table" className={cn('rt-scroll max-h-[calc(100dvh-220px)] overflow-auto rounded-xl border bg-card', compact && 'rt-compact')}>
      <table className="rt-grid rt-table w-full">
        <thead>
          <tr>
            <th scope="col" className="text-left" data-pin>
              {by === 'room' ? 'ক্লাস / গ্রুপ' : 'গ্রুপ / ক্লাস'}
            </th>
            {times.map((t) => (
              <TimeTh key={timeKey(t)} time={t} />
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => {
            const closed = folded.includes(s.key);
            const ids = new Set(s.groups.map((g) => g.id));
            const teachers = new Set(data.assignments.filter((a) => ids.has(by === 'room' ? (a.hostGroupId ?? a.groupId) : a.groupId)).flatMap((a) => [a.teacherId, a.taId ?? a.teacherId]));
            const isClasses = s.groups.every((g) => names.types.get(g.typeId)?.placement === 'class');
            return (
              <Fragment key={s.key}>
                <tr className="rt-sec">
                  <th scope="rowgroup">
                    <button type="button" aria-expanded={!closed} onClick={() => onFold(s.key)} className="flex flex-col items-start text-left">
                      <span className="whitespace-nowrap text-[12.5px] font-bold text-primary">
                        <span aria-hidden className="sv-no-print">{closed ? '▸ ' : '▾ '}</span>
                        {s.title}
                      </span>
                      <span className="whitespace-nowrap text-[11.5px] font-normal text-muted-foreground">
                        {bn(s.groups.length)}টা {isClasses ? 'ক্লাস' : 'গ্রুপ'} · {bn(teachers.size)} জন টিচার
                      </span>
                    </button>
                  </th>
                  {times.map((t) => {
                    const n = closed ? new Set(data.assignments.filter((a) => ids.has(by === 'room' ? (a.hostGroupId ?? a.groupId) : a.groupId) && sameTime(a, t) && (shownDay === null || a.days.includes(shownDay))).map((a) => (by === 'room' ? (a.hostGroupId ?? a.groupId) : a.groupId))).size : 0;
                    return (
                      <td key={timeKey(t)} className="text-[12px] text-muted-foreground">
                        {n > 0 && (
                          <span className="block whitespace-nowrap px-2 py-1.5 sv-no-print">
                            {/* টেবিল counts rooms in use (a class's room may hold a seated group). */}
                            {bn(n)}টা {isClasses ? (by === 'room' ? 'রুমে ক্লাস' : 'ক্লাস') : 'গ্রুপ'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                {s.groups.map((g) => {
                  const room = g.defaultRoomId ? data.rooms.find((r) => r.id === g.defaultRoomId)?.name : null;
                  const placement = names.types.get(g.typeId)?.placement;
                  const meta = [room && `রুম ${bn(room)}`, by === 'room' && placement !== 'class' && names.types.get(g.typeId)?.name].filter(Boolean).join(' · ');
                  return (
                    <tr key={g.id} className={cn(closed && 'rt-folded')}>
                      <th scope="row">
                        <Link href={groupHref(g.id)} className="font-semibold no-underline hover:underline">
                          {g.name}
                        </Link>
                        {meta && <div className="text-[11.5px] font-normal text-muted-foreground">{meta}</div>}
                      </th>
                      {times.map((t) => {
                        const list = cellLessons(data.assignments, g.id, t, by, shownDay);
                        const fill = list.length ? ctx.fills.get(names.groups.get(list[0].groupId)?.typeId ?? '') : undefined;
                        const mine = list.some((a) => involves(a, ctx));
                        // A seated group's own row (গ্রুপ) can take a lesson; in টেবিল only rooms can.
                        const canAdd = by === 'group' || placement !== 'seated';
                        return (
                          <td key={timeKey(t)} style={fill && !(teacherId && !mine) ? { background: fill.bg } : undefined} className={cn('rt-td', teacherId && !mine && 'rt-faded', mine && 'rt-found')}>
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
                      })}
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

/** One row per teacher, the times across: where each teacher is; an empty cell is free. */
function TeacherView({ data, names, day, times, onOpen }: { data: RoutineData; names: Lookup; day: Day; times: TimeSpan[]; onOpen: (a: Assignment) => void }) {
  const used = new Set(data.assignments.flatMap((a) => [a.teacherId, a.taId]));
  const teachers = data.teachers.filter((t) => t.active || used.has(t.id));
  const loads = useMemo(() => teacherLoads(data.teachers, data.assignments), [data]);
  const q = data.routine.status === 'active' ? '' : `?r=${data.routine.id}`;
  return (
    <div id="rt-table" className="rt-scroll max-h-[calc(100dvh-220px)] overflow-auto rounded-xl border bg-card">
      <table className="rt-grid rt-table w-full">
        <thead>
          <tr>
            <th scope="col" className="text-left" data-pin>
              টিচার
            </th>
            {times.map((t) => (
              <TimeTh key={timeKey(t)} time={t} />
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
                {times.map((time) => {
                  const list = data.assignments.filter((a) => sameTime(a, time) && (a.teacherId === t.id || a.taId === t.id) && (day === 'all' || a.days.includes(day))).sort(byDays);
                  return (
                    <td key={timeKey(time)} className="rt-td">
                      {list.length > 0 && (
                        <div className="rt-cell">
                          {list.map((a) => (
                            <button key={a.id} type="button" className="rt-lesson" onClick={() => onOpen(a)}>
                              <span className="rt-entry">
                                <span className={cn('font-semibold', a.taId === t.id ? TA : MAIN)}>{names.groups.get(a.groupId)?.name}</span>
                                <span>
                                  {names.subjects.get(a.subjectId)?.name}
                                  {a.taId === t.id && <span className={TA}> · টিএ</span>}
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
                <td>
                  <div className="rt-cell">
                    <span className="tabular-nums">
                      মেইন {bn(load.main)}
                      {load.ta > 0 && ` · টিএ ${bn(load.ta)}`}
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

/** What the names and colours mean. */
function Legend({ fills, today }: { fills: { name: string; fill: { bg: string } }[]; today: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <span>
        <span className={cn('font-semibold', MAIN)}>নাম</span> মেইন টিচার · <span className={cn('font-semibold', TA)}>+ নাম</span> টিএ
      </span>
      <span>
        <span className="rounded border border-dashed border-[#a8a29e] px-1">নাম</span> খালি পোস্ট
      </span>
      {today && (
        <span>
          <span className="line-through">নাম</span> <span className="font-semibold text-[#9a4a06]">→ প্রক্সি</span> আজ অ্যাবসেন্ট
        </span>
      )}
      <span className="flex flex-wrap gap-1.5">
        {fills.map((f) => (
          <span key={f.name} className="px-2 py-0.5" style={{ background: f.fill.bg }}>
            {f.name}
          </span>
        ))}
      </span>
      <span className="text-muted-foreground">কুরআন আর আরবি গ্রুপ যে ক্লাসের রুমে বসে, টেবিলে সেই ক্লাসের সারিতে দেখায়। খালি ঘরে + চাপলে সেই সারি আর সময় দিয়ে ফর্ম খোলে।</span>
    </div>
  );
}
