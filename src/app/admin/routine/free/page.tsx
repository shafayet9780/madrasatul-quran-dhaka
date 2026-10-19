import type { Metadata } from 'next';
import Link from 'next/link';
import { dayBoard, type BoardCell } from '@/lib/routine/availability';
import { proxyDay } from '@/lib/routine/data';
import { dateText, dayOfDate, dhakaMinutes, dhakaToday, isDate, periodAt, periodTime } from '@/lib/routine/days';
import type { Period, Teacher } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { PageTop } from '../../AdminShell';
import { EmptyState, LINK, PageBody, PageTitle } from '../../ui';
import { DatePicker, ParamSelect, ScrollToNow } from '../controls';
import { NoRoutine, routineSub } from '../ui';

export const metadata: Metadata = { title: 'ফ্রি টিচার' };
export const dynamic = 'force-dynamic';

// Who is free in every period of a date (docs/class-routine.md §5). Two views: নাম (a column per
// period, every teacher a coloured chip) and টেবিল (a row per teacher). Solid green: free and teaches
// a subject taught then (or the chosen one); dashed: free, other subjects; orange: on a proxy; red: in
// class; grey: absent. Teachers not at school in that sitting fold into one line.

const CHIP = 'flex min-h-11 flex-col justify-center rounded-lg border px-2.5 py-1.5 no-underline';
const STYLE = {
  fits: 'border-[#15803d] bg-[#15803d] text-white hover:bg-[#116331]',
  free: 'border-dashed border-[#6fb487] bg-[#f6fbf7] text-[#2b5c3b] hover:border-[#15803d]',
  proxy: 'border-[#eab27a] bg-[#fdf0e1] text-foreground',
  class: 'border-[#f0b4b4] bg-[#fdecec] text-foreground',
  absent: 'border-[#d4d4d4] bg-[#ededed] text-[#404040]',
  away: 'bg-[repeating-linear-gradient(135deg,#f4f4f4_0_4px,#e9e9e9_4px_6px)] text-muted-foreground',
};
// The table's cells: free green, in class white, as in the routine.
const CELL = {
  fits: 'bg-[#15803d]',
  free: 'bg-[#e3f2e8]',
  proxy: 'bg-[#fdf0e1]',
  class: 'bg-card',
  absent: 'bg-[#ededed]',
  away: STYLE.away,
};
const NOTE = { fits: 'text-[#e8f5ec]', free: 'text-muted-foreground', proxy: 'text-[#8a4205]', class: 'text-[#a61b1b]', absent: 'text-muted-foreground', away: '' };

export default async function FreePage({ searchParams }: { searchParams: Promise<{ date?: string; subject?: string; view?: string }> }) {
  const sp = await searchParams;
  const date = isDate(sp.date) ? sp.date : dhakaToday();
  const day = dayOfDate(date);
  const table = sp.view === 'table';
  const { data, absences, proxies } = await proxyDay(date);
  const crumbs = [{ label: 'রুটিন', href: '/admin/routine' }, { label: 'ফ্রি টিচার' }];
  if (!data) {
    return (
      <>
        <PageTop crumbs={crumbs} round={false} />
        <PageBody>
          <PageTitle>ফ্রি টিচার</PageTitle>
          <NoRoutine>কোনো রুটিন চালু নেই।</NoRoutine>
        </PageBody>
      </>
    );
  }
  const subject = data.subjects.find((s) => s.id === sp.subject);
  const subjectName = new Map(data.subjects.map((s) => [s.id, s.name]));
  const groupName = new Map(data.groups.map((g) => [g.id, g.name]));
  const isToday = date === dhakaToday();
  const now = dhakaMinutes();
  const running = isToday ? periodAt(data.periods, now) : null;
  const past = (p: Period) => isToday && p.endsAt <= now;
  const board = day === null ? null : dayBoard({ teachers: data.teachers, assignments: data.assignments, periods: data.periods, day, absences, proxies, subjectId: subject?.id });
  const away = absences.map((a) => data.teachers.find((t) => t.id === a.teacherId)?.shortName).filter(Boolean);
  const subjectsOf = (t: Teacher) => t.subjectIds.map((id) => subjectName.get(id)).filter(Boolean).join(', ') || 'সাবজেক্ট দেওয়া নেই';
  const look = (c: BoardCell) => (c.kind === 'free' ? (c.fits ? 'fits' : 'free') : c.kind);
  const note = (t: Teacher, c: BoardCell) => {
    if (c.kind === 'free') return subjectsOf(t);
    if (c.kind !== 'class' && c.kind !== 'proxy') return c.kind === 'absent' ? 'অ্যাবসেন্ট' : '';
    const group = groupName.get(c.assignment?.groupId ?? '') ?? '';
    return c.kind === 'proxy' ? `প্রক্সি · ${group}` : `${group} · ${subjectName.get(c.assignment?.subjectId ?? '') ?? ''}${c.role === 'ta' ? ' (টিএ)' : ''}`;
  };
  const href = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(Object.entries({ date: sp.date ?? null, subject: sp.subject ?? null, view: sp.view ?? null, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/routine/free${q.size ? `?${q}` : ''}`;
  };
  const teacherHref = (t: Teacher) => `/admin/routine/teachers/${t.id}`;
  const freeText = (n: number) => (n ? `${bn(n)} জন ফ্রি` : 'কেউ ফ্রি নেই');

  const views = (
    <div role="group" aria-label="ভিউ" className="inline-flex gap-0.5 rounded-lg bg-muted p-[3px]">
      {(
        [
          [false, 'নাম'],
          [true, 'টেবিল'],
        ] as const
      ).map(([isTable, label]) => (
        <Link
          key={label}
          href={href({ view: isTable ? 'table' : null })}
          aria-current={table === isTable ? 'page' : undefined}
          className={cn('rounded-md px-3 py-1 text-sm font-medium no-underline', table === isTable ? 'bg-white text-foreground shadow-[0_1px_2px_rgba(23,23,23,0.08)]' : 'text-muted-foreground hover:text-foreground')}
        >
          {label}
        </Link>
      ))}
    </div>
  );

  return (
    <>
      <PageTop crumbs={crumbs} round={false} />
      <PageBody>
        <PageTitle sub={routineSub(data.routine, isToday && running ? `এখন ${periodTime(running)}` : '')}>ফ্রি টিচার · {isToday ? 'আজ' : dateText(date)}</PageTitle>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {views}
            <DatePicker date={date} />
          </div>
          <ParamSelect name="subject" value={subject?.id ?? ''} label="সাবজেক্ট" options={[{ value: '', label: 'সব সাবজেক্ট' }, ...data.subjects.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))]} />
        </div>
        {!board ? (
          <EmptyState>শুক্রবার ক্লাস নেই।</EmptyState>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-muted-foreground">
              {(
                [
                  ['fits', subject ? `ফ্রি, ${subject.name} পড়ান` : 'ফ্রি, এ সময়ের সাবজেক্ট পড়ান'],
                  ['free', 'ফ্রি, অন্য সাবজেক্ট'],
                  ['proxy', 'প্রক্সিতে'],
                  ['class', 'ক্লাসে'],
                  ['absent', 'অ্যাবসেন্ট'],
                ] as const
              ).map(([k, label]) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span aria-hidden className={cn('size-3.5 rounded border', STYLE[k])} />
                  {label}
                </span>
              ))}
              {away.length > 0 && (
                <span>
                  · {isToday ? 'আজ' : 'এ দিন'} অ্যাবসেন্ট: {away.join(', ')} ·{' '}
                  <Link href={`/admin/routine/proxy${isToday ? '' : `?date=${date}`}`} className={LINK}>
                    প্রক্সি
                  </Link>
                </span>
              )}
            </div>

            {!table ? (
              <div id="free-board" className="relative overflow-x-auto pb-1">
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${board.periods.length}, minmax(140px, 1fr))`, minWidth: board.periods.length * 148 }}>
                  {board.periods.map(({ period: p, cells, free }) => {
                    const isNow = p === running;
                    const order = { fits: 0, free: 1, proxy: 2, class: 3, absent: 4, away: 5 };
                    const list = board.teachers
                      .map((t) => ({ t, c: cells.get(t.id)! }))
                      .filter(({ c }) => c.kind !== 'away')
                      .sort((a, b) => order[look(a.c)] - order[look(b.c)] || (a.c.kind === 'free' ? board.classes.get(a.t.id)! - board.classes.get(b.t.id)! : 0) || a.t.shortName.localeCompare(b.t.shortName));
                    const awayCount = board.teachers.length - list.length;
                    return (
                      <section key={p.id} aria-label={periodTime(p)} data-now={isNow || undefined} className={cn('self-start rounded-xl bg-card', isNow ? 'border-2 border-primary' : 'border', past(p) && 'opacity-55')}>
                        <div className={cn('rounded-t-[11px] border-b px-2.5 py-2', isNow ? 'bg-[#e9e1db]' : 'bg-muted')}>
                          <div className="flex items-center gap-1.5 whitespace-nowrap text-[13.5px] font-semibold">
                            {periodTime(p)}
                            {isNow && <span className="rounded-full bg-primary px-1.5 py-px text-[11px] font-medium text-primary-foreground">এখন</span>}
                          </div>
                          {p.label && <div className="text-[12px] text-muted-foreground">{p.label}</div>}
                          <div className="mt-1 text-[12.5px] font-semibold text-success">{freeText(free)}</div>
                        </div>
                        <ul className="m-0 flex list-none flex-col gap-1.5 p-2">
                          {list.map(({ t, c }) => (
                            <li key={t.id}>
                              <Link href={teacherHref(t)} className={cn(CHIP, STYLE[look(c)])}>
                                <span className="text-[13.5px] font-semibold">{t.shortName}</span>
                                <span className={cn('text-[11.5px] leading-snug', NOTE[look(c)])}>{note(t, c)}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {awayCount > 0 && <p className="m-0 px-2.5 pb-2.5 text-[12px] text-muted-foreground">+{bn(awayCount)} জন স্কুলে নেই</p>}
                      </section>
                    );
                  })}
                </div>
                {isToday && <ScrollToNow id="free-board" />}
              </div>
            ) : (
              <div id="free-table" className="relative overflow-x-auto rounded-xl border bg-card">
                <table className="w-full border-separate border-spacing-0 text-[13px]" style={{ minWidth: 200 + board.periods.length * 116 }}>
                  <caption className="sr-only">কোন পিরিয়ডে কোন টিচার ফ্রি</caption>
                  <thead>
                    <tr>
                      <th scope="col" data-pin className="sticky left-0 z-[2] border-b border-r bg-muted px-3 py-2.5 text-left font-semibold">
                        টিচার
                      </th>
                      {board.periods.map(({ period: p, free }) => (
                        <th key={p.id} scope="col" data-now={p === running || undefined} className={cn('border-b border-r px-2.5 py-2.5 text-left align-top', p === running ? 'bg-[#e9e1db] shadow-[inset_2px_0_0_var(--primary),inset_-2px_0_0_var(--primary)]' : 'bg-muted', past(p) && 'opacity-55')}>
                          <div className="flex items-center gap-1.5 whitespace-nowrap font-semibold">
                            {periodTime(p)}
                            {p === running && <span className="rounded-full bg-primary px-1.5 py-px text-[11px] font-medium text-primary-foreground">এখন</span>}
                          </div>
                          {p.label && <div className="whitespace-nowrap text-[12px] font-normal text-muted-foreground">{p.label}</div>}
                          <div className="mt-1 whitespace-nowrap text-[12px] font-semibold text-success">{freeText(free)}</div>
                        </th>
                      ))}
                      <th scope="col" className="whitespace-nowrap border-b bg-muted px-3 py-2.5 text-left font-semibold">
                        {isToday ? 'আজ' : 'এ দিন'} ক্লাস
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(subject
                      ? [
                          [`${subject.name} পড়ান`, board.teachers.filter((t) => t.subjectIds.includes(subject.id))],
                          ['অন্য টিচার', board.teachers.filter((t) => !t.subjectIds.includes(subject.id))],
                        ]
                      : [['', board.teachers]]
                    ).map(([title, list]) => (
                      <TeacherRows key={title as string} title={title as string} teachers={list as Teacher[]} span={board.periods.length + 2}>
                        {(t) => (
                          <tr key={t.id}>
                            <th scope="row" className="sticky left-0 z-[1] border-b border-r bg-card px-3 py-2 text-left align-top font-normal">
                              <Link href={teacherHref(t)} className="font-semibold no-underline hover:underline">
                                {t.shortName}
                              </Link>
                              <div className="text-[12px] text-muted-foreground">{subjectsOf(t)}</div>
                            </th>
                            {board.periods.map(({ period: p, cells }) => {
                              const c = cells.get(t.id)!;
                              const k = look(c);
                              return (
                                <td key={p.id} className={cn('min-w-[108px] border-b border-r px-2.5 py-2 align-top', CELL[k], p === running && 'shadow-[inset_2px_0_0_var(--primary),inset_-2px_0_0_var(--primary)]', past(p) && 'opacity-55')}>
                                  {k === 'fits' || k === 'free' ? (
                                    <span className={cn('font-semibold', k === 'fits' ? 'text-white' : 'text-[#116331]')}>ফ্রি</span>
                                  ) : k === 'away' ? (
                                    <span className="text-[12px]">—</span>
                                  ) : (
                                    <span className={cn('text-[12px] leading-snug', NOTE[k])}>{note(t, c)}</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="whitespace-nowrap border-b px-3 py-2 align-top text-[#404040]">{bn(board.classes.get(t.id) ?? 0)}টা</td>
                          </tr>
                        )}
                      </TeacherRows>
                    ))}
                  </tbody>
                </table>
                {isToday && <ScrollToNow id="free-table" />}
              </div>
            )}
          </>
        )}
      </PageBody>
    </>
  );
}

/** A run of teacher rows, under a heading row when there is one (the chosen subject's teachers first). */
function TeacherRows({ title, teachers, span, children }: { title: string; teachers: Teacher[]; span: number; children: (t: Teacher) => React.ReactNode }) {
  return (
    <>
      {title && (
        <tr>
          <th scope="colgroup" colSpan={span} className="border-b bg-muted/60 px-3 py-2 text-left text-[12.5px] font-semibold text-muted-foreground">
            {title} · {bn(teachers.length)} জন
          </th>
        </tr>
      )}
      {teachers.map(children)}
    </>
  );
}
