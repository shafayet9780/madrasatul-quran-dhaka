'use client';

import Link from 'next/link';
import { Fragment, useContext, useMemo, useState } from 'react';
import { periodText, periodTime, timeText } from '@/lib/routine/days';
import { bandRuns, groupPeriods, sheetBlocks, sheetLayout, type Lane } from '@/lib/routine/layout';
import type { Assignment, Group, Period, RoutineData } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { Entry, NowContext, PeriodHead, Tile, type CellCtx } from './cells';
import { ScrollToNow, SELECT } from './controls';

// The routine's views (docs/class-routine.md §5): শিট (a column per block of the day, as the
// school's sheet thinks of it), টাইমলাইন (every group on one time axis) and, on a phone, one
// group's or one teacher's day.

export type ViewProps = {
  data: RoutineData;
  ctx: CellCtx;
  shown: (groupId: string, periodId: string) => Assignment[];
  open: (groupId: string, periodId: string) => void;
  groupHref: (id: string) => string;
};

const CARD = 'overflow-hidden rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(28,25,23,0.05),0_6px_20px_rgba(28,25,23,0.04)]';
const SUBHEAD = 'text-[11px] font-bold tracking-[0.08em] text-muted-foreground';

const span = (ps: Period[]) => `${timeText(ps[0].startsAt)}–${timeText(ps[ps.length - 1].endsAt)}`;

function GroupName({ g, data, groupHref, inline }: { g: Group; data: RoutineData; groupHref: (id: string) => string; inline?: boolean }) {
  const room = g.defaultRoomId && data.rooms.find((r) => r.id === g.defaultRoomId)?.name;
  return (
    <span className={cn('flex gap-x-2', inline ? 'flex-wrap items-baseline justify-between' : 'flex-col')}>
      <Link href={groupHref(g.id)} className="text-[13.5px] font-bold no-underline hover:underline">
        {g.name}
      </Link>
      {room && <span className="whitespace-nowrap text-[11px] font-normal text-muted-foreground">রুম {room}</span>}
    </span>
  );
}

/**
 * Like the school's sheet, as a web page: each block of the day (হিফয, কুরআন, আরবি, জেনারেল, …) is a
 * column of its own groups under their bands. A one-period block shows cards, a longer one a small
 * table; a group on its own times (Six (F)) gets a strip below.
 */
export function SheetView({ data, ctx, shown, open, groupHref }: ViewProps) {
  const { lanes, strips } = useMemo(() => sheetLayout(data.periods, data.assignments, data.groups), [data]);
  const nowId = useContext(NowContext);
  // A new group with no class whose heading has no column yet: filled in from the timeline.
  const placed = new Set([...lanes.flatMap((l) => l.groups), ...strips]);
  const waiting = data.groups.filter((g) => g.active && !placed.has(g));
  if (!lanes.length && !strips.length) {
    return <p className="m-0 rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">এখনো কোনো ক্লাস নেই। &quot;টাইমলাইন&quot; ভিউতে গিয়ে ক্লাস যোগ করুন।</p>;
  }
  const tile = (g: Group, p: Period, className?: string) => <Tile list={shown(g.id, p.id)} group={g} ctx={ctx} onOpen={() => open(g.id, p.id)} label={`${g.name}, ${periodText(p)}`} className={className} />;
  return (
    <div className="flex flex-col gap-3">
      <div id="rt-lanes" className="rt-lanes relative flex items-start gap-2.5 overflow-x-auto pb-1">
        {lanes.map((lane, i) => {
          const isNow = lane.periods.some((p) => p.id === nowId);
          return (
            <section
              key={i}
              aria-label={lane.headings[0] || 'অন্যান্য'}
              data-now={isNow || undefined}
              style={lane.cards ? undefined : { minWidth: 104 + lane.periods.length * 124 }}
              className={cn(CARD, 'shrink-0', isNow && 'border-[1.5px] border-primary print:border print:border-[#e7e5e2]', lane.cards ? 'w-[186px]' : 'flex-1')}
            >
              <header className="flex flex-wrap items-start justify-between gap-2 border-b px-3.5 py-3">
                <div>
                  <h2 className="m-0 text-[16px] font-bold">{lane.headings[0] || 'অন্যান্য'}</h2>
                  <div className="text-[12.5px] text-muted-foreground">
                    {span(lane.periods)} · {bn(lane.groups.length)}টা গ্রুপ
                  </div>
                </div>
                {isNow && <span className="whitespace-nowrap rounded-full bg-primary px-2.5 py-0.5 text-[12px] font-semibold text-primary-foreground sv-no-print">এখন চলছে</span>}
              </header>
              {lane.cards ? <LaneCards lane={lane} data={data} groupHref={groupHref} tile={tile} /> : <LaneTable lane={lane} data={data} groupHref={groupHref} tile={tile} />}
            </section>
          );
        })}
        {nowId && <ScrollToNow id="rt-lanes" />}
      </div>
      {strips.map((g) => {
        const own = groupPeriods(data.periods, data.assignments, data.groups, g);
        return (
          <section key={g.id} aria-label={g.name} className={cn(CARD, 'flex flex-col gap-2.5 p-3.5')}>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <GroupName g={g} data={data} groupHref={groupHref} inline />
              <span className="text-[12.5px] text-muted-foreground">নিজের সময়ে চলে</span>
            </div>
            <ol className="m-0 grid list-none gap-2 p-0 [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]">
              {own.map((p) => (
                <li key={p.id} className="flex flex-col gap-1">
                  <span className={cn('text-[12px] font-semibold text-muted-foreground', p.id === nowId && 'text-primary')}>{periodTime(p)}</span>
                  {tile(g, p, 'h-full')}
                </li>
              ))}
            </ol>
          </section>
        );
      })}
      {waiting.length > 0 && (
        <p className="m-0 text-[12.5px] text-muted-foreground sv-no-print">
          এখনো ক্লাস নেই: {waiting.map((g) => g.name).join(', ')}। &quot;টাইমলাইন&quot; ভিউতে ক্লাস যোগ করুন।
        </p>
      )}
    </div>
  );
}

type TileFn = (g: Group, p: Period, className?: string) => React.ReactNode;

/** A block with one period (or the same classes in each): a card per group, under its band. */
function LaneCards({ lane, data, groupHref, tile }: { lane: Lane; data: RoutineData; groupHref: (id: string) => string; tile: TileFn }) {
  return (
    <div className="flex flex-col gap-2.5 p-2.5">
      {bandRuns(lane.groups).map((run, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          {run.band && <div className={cn(SUBHEAD, 'px-1 pt-1')}>{run.band}</div>}
          {run.groups.map((g) => (
            <div key={g.id} className="flex flex-col gap-1 rounded-[10px] border border-[#efedea] bg-[#fbfaf9] p-2 has-[[data-faded]]:opacity-30 has-[[data-found]]:border-2 has-[[data-found]]:border-foreground has-[[data-found]]:bg-white">
              <GroupName g={g} data={data} groupHref={groupHref} inline />
              {tile(g, lane.periods[0], 'min-h-0 border-0 bg-transparent p-0 opacity-100 hover:border-0')}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** A block of several periods: a small table, groups down the side under their bands. */
function LaneTable({ lane, data, groupHref, tile }: { lane: Lane; data: RoutineData; groupHref: (id: string) => string; tile: TileFn }) {
  const nowId = useContext(NowContext);
  return (
    <table className="w-full table-fixed border-collapse text-[12.5px]">
      <thead>
        <tr>
          <th scope="col" className="w-[104px] px-3 py-2 text-left text-[12px] font-medium text-muted-foreground">
            গ্রুপ
          </th>
          {lane.periods.map((p) => (
            <th key={p.id} scope="col" className={cn('px-2.5 py-2 text-left text-[13px] font-semibold', p.id === nowId && 'bg-[#f4ece6]')}>
              <PeriodHead p={p} hide={lane.headings[0]} now={p.id === nowId} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bandRuns(lane.groups).map((run, i) => (
          <Fragment key={i}>
            {run.band && (
              <tr>
                <th colSpan={lane.periods.length + 1} scope="colgroup" className={cn(SUBHEAD, 'border-t border-[#f2f0ed] px-3.5 pb-1 pt-3 text-left')}>
                  {run.band}
                </th>
              </tr>
            )}
            {run.groups.map((g) => (
              <tr key={g.id}>
                <th scope="row" className="px-3 py-1.5 text-left align-top font-normal">
                  <GroupName g={g} data={data} groupHref={groupHref} />
                </th>
                {lane.periods.map((p) => (
                  <td key={p.id} className={cn('px-1 py-1 align-top', p.id === nowId && 'bg-[#fcf8f5]')}>
                    {tile(g, p)}
                  </td>
                ))}
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

/** Every group on one time axis: a row per group under its heading, a column per period. */
export function TimelineView({ data, ctx, shown, open, groupHref }: ViewProps) {
  const nowId = useContext(NowContext);
  const { sections, session } = useMemo(() => {
    const blocks = sheetBlocks(data.periods, data.assignments, data.groups);
    const used = new Set(data.assignments.map((a) => a.groupId));
    const groups = data.groups.filter((g) => g.active || used.has(g.id));
    const headings = [...new Set([...blocks.map((b) => b.headings[0]), ...groups.map((g) => g.section)])];
    // The periods a group is at school: its blocks (with no class yet, its heading's blocks).
    const session = new Map(groups.map((g) => [g.id, new Set(blocks.filter((b) => b.groups.includes(g) || (!used.has(g.id) && b.headings[0] === g.section)).flatMap((b) => b.periods.map((p) => p.id)))]));
    return { sections: headings.map((heading) => ({ heading, groups: groups.filter((g) => g.section === heading) })).filter((s) => s.groups.length), session };
  }, [data]);
  return (
    <div className="rt-scroll max-h-[calc(100vh-200px)] overflow-auto rounded-[14px] border bg-card print:max-h-none">
      <table className="w-full border-separate border-spacing-0 text-[12.5px]" style={{ minWidth: 150 + data.periods.length * 128 }}>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 top-0 z-[3] border-b border-r bg-muted px-3 py-2.5 text-left">
              গ্রুপ
            </th>
            {data.periods.map((p) => (
              <th key={p.id} scope="col" className={cn('sticky top-0 z-[2] border-b border-r px-2.5 py-2.5 text-left align-top font-semibold', p.id === nowId ? 'bg-[#e9e1db]' : 'bg-muted')}>
                <PeriodHead p={p} now={p.id === nowId} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <Fragment key={s.heading}>
              <tr>
                <th colSpan={data.periods.length + 1} scope="colgroup" className="sticky left-0 border-b bg-[#f0ebe7] px-3 py-1.5 text-left text-[12.5px] font-bold text-[#5c3a25]">
                  {s.heading || 'অন্যান্য'} · {bn(s.groups.length)}টা গ্রুপ
                </th>
              </tr>
              {s.groups.map((g) => (
                <tr key={g.id}>
                  <th scope="row" className="sticky left-0 z-[1] border-b border-r bg-card px-3 py-1.5 text-left align-top font-normal">
                    <GroupName g={g} data={data} groupHref={groupHref} />
                  </th>
                  {data.periods.map((p) => {
                    const inSession = session.get(g.id)?.has(p.id);
                    const list = shown(g.id, p.id);
                    return (
                      <td key={p.id} className={cn('min-w-[118px] border-b border-r p-1 align-top', p.id === nowId && 'bg-[#fcf8f5]', !inSession && !list.length && 'bg-muted/50')}>
                        {inSession || list.length ? (
                          <Tile list={list} group={g} ctx={ctx} onOpen={() => open(g.id, p.id)} label={`${g.name}, ${periodText(p)}`} />
                        ) : (
                          <button type="button" aria-label={`${g.name}, ${periodText(p)}: ক্লাস যোগ করুন`} onClick={() => open(g.id, p.id)} className="block min-h-[52px] w-full rounded-[10px] text-transparent hover:text-[#a8a29e] focus-visible:text-[#a8a29e]">
                            +
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** On a phone: one group's day (or one teacher's) as a list, the running period outlined. */
export function PhoneDay({ data, ctx, shown, open, groupHref }: ViewProps) {
  const nowId = useContext(NowContext);
  // In the sheet's order, then any group not on it yet.
  const groups = useMemo(() => {
    const { lanes, strips } = sheetLayout(data.periods, data.assignments, data.groups);
    return [...new Set([...lanes.flatMap((l) => l.groups), ...strips, ...data.groups.filter((g) => g.active)])];
  }, [data]);
  const [mode, setMode] = useState<'group' | 'teacher'>('group');
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const used = new Set(data.assignments.flatMap((a) => [a.teacherId, a.taId]));
  const teachers = data.teachers.filter((t) => used.has(t.id)).sort((a, b) => a.shortName.localeCompare(b.shortName));
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? '');
  const group = data.groups.find((g) => g.id === groupId);
  const time = (p: Period) => (
    <span className="w-14 shrink-0 pt-2 text-right text-[12.5px] text-muted-foreground">
      <span className="block font-semibold text-foreground">{timeText(p.startsAt)}</span>
      {timeText(p.endsAt)}
    </span>
  );
  const rows =
    mode === 'group'
      ? group
        ? groupPeriods(data.periods, data.assignments, data.groups, group)
        : []
      : data.periods.filter((p) => data.assignments.some((a) => a.periodId === p.id && (a.teacherId === teacherId || a.taId === teacherId) && shown(a.groupId, p.id).includes(a)));
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="দেখুন" className="grid grid-cols-2 gap-0.5 rounded-lg bg-muted p-[3px]">
        {(
          [
            ['group', 'গ্রুপ'],
            ['teacher', 'টিচার'],
          ] as const
        ).map(([m, label]) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={cn('h-9 rounded-md text-sm font-medium', mode === m ? 'bg-white shadow-[0_1px_2px_rgba(23,23,23,0.08)]' : 'text-muted-foreground')}>
            {label}
          </button>
        ))}
      </div>
      {mode === 'group' ? (
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
          {groups.map((g) => (
            <button key={g.id} type="button" aria-pressed={g.id === groupId} onClick={() => setGroupId(g.id)} className={cn('h-10 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[13.5px]', g.id === groupId ? 'border-primary bg-primary font-semibold text-primary-foreground' : 'bg-white')}>
              {g.name}
            </button>
          ))}
        </div>
      ) : (
        <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
          টিচার
          <select className={cn(SELECT, 'h-11')} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.shortName}
              </option>
            ))}
          </select>
        </label>
      )}
      {mode === 'group' && group && <GroupName g={group} data={data} groupHref={groupHref} inline />}
      {rows.length === 0 ? (
        <p className="m-0 rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">এ দিন কোনো ক্লাস নেই।</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {rows.map((p) => (
            <li key={p.id} className="flex items-stretch gap-2.5">
              {time(p)}
              <div className={cn('flex-1 rounded-[10px]', p.id === nowId && 'outline outline-2 outline-primary')}>
                {mode === 'group' && group ? (
                  <Tile list={shown(group.id, p.id)} group={group} ctx={ctx} onOpen={() => open(group.id, p.id)} label={`${group.name}, ${periodText(p)}`} className="min-h-12" />
                ) : (
                  data.assignments
                    .filter((a) => a.periodId === p.id && (a.teacherId === teacherId || a.taId === teacherId) && shown(a.groupId, p.id).includes(a))
                    .map((a) => {
                      const g = data.groups.find((x) => x.id === a.groupId)!;
                      return (
                        <button key={a.id} type="button" onClick={() => open(g.id, p.id)} className="flex w-full flex-col items-start gap-0.5 rounded-[10px] border border-[#efedea] bg-[#fbfaf9] px-2.5 py-2 text-left text-[12.5px]">
                          <span className="text-[13.5px] font-bold">{g.name}</span>
                          <Entry a={a} group={g} ctx={ctx} />
                        </button>
                      );
                    })
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
