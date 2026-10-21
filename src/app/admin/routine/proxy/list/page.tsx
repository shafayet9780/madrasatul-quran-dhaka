import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { lookup } from '@/lib/routine/clash';
import { activeRoutine, dayRecords, monthProxyCounts, routineData } from '@/lib/routine/data';
import { dateText, dayOfDate, dhakaToday, isDate, spanText } from '@/lib/routine/days';
import { needsFor, proxyDayText, type ProxyLine } from '@/lib/routine/proxy';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { PageTop } from '../../../AdminShell';
import { ReportTools } from '../../../reports/ReportTools';
import { Card, LINK, PageBody, PageTitle, StatTile, StatTiles } from '../../../ui';
import { NoRoutine } from '../../ui';
import { CopyText } from '../ProxyBoard';

export const metadata: Metadata = { title: 'প্রক্সি তালিকা' };
export const dynamic = 'force-dynamic';

// Who was away and who covered their classes, for one day or a school week (Saturday–Thursday),
// docs/class-routine.md §6. Giving a proxy is on the register (/admin/routine/proxy).

const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** The school week (Saturday–Thursday) a date is in; a Friday belongs to the week after. */
function weekOf(date: string): string[] {
  const day = dayOfDate(date);
  const saturday = day === null ? addDays(date, 1) : addDays(date, -day);
  return Array.from({ length: 6 }, (_, i) => addDays(saturday, i));
}
/** The school day before or after, skipping Friday. */
function stepDay(date: string, step: 1 | -1) {
  let next = addDays(date, step);
  if (dayOfDate(next) === null) next = addDays(next, step);
  return next;
}
const short = (date: string) => new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));

type Row = ProxyLine & { key: string; at: number };

export default async function ProxyListPage({ searchParams }: { searchParams: Promise<{ date?: string; mode?: string }> }) {
  const sp = await searchParams;
  const today = dhakaToday();
  const date = isDate(sp.date) ? sp.date : today;
  const week = sp.mode !== 'day';
  const dates = week ? weekOf(date) : [dayOfDate(date) === null ? stepDay(date, 1) : date];
  const crumbs = [{ label: 'রুটিন', href: '/admin/routine' }, { label: 'প্রক্সি', href: '/admin/routine/proxy' }, { label: 'তালিকা' }];
  const routine = await activeRoutine();
  if (!routine) {
    return (
      <>
        <PageTop crumbs={crumbs} round={false} />
        <PageBody>
          <PageTitle>প্রক্সি তালিকা</PageTitle>
          <NoRoutine>কোনো রুটিন চালু নেই।</NoRoutine>
        </PageBody>
      </>
    );
  }
  const [data, records, month] = await Promise.all([routineData(routine), Promise.all(dates.map(dayRecords)), monthProxyCounts(date)]);
  const names = lookup(data);
  const teacher = (id: string) => names.teachers.get(id)?.shortName ?? '';

  const days = dates.map((d, i) => {
    const weekday = dayOfDate(d)!;
    const { absences, proxies } = records[i];
    // Past days are history: only the proxies given then (their snapshot), since the routine may
    // have changed since. Today and later: every class of an absent teacher, covered or not.
    const past = d < today;
    const rows: Row[] = (past ? [] : needsFor(weekday, absences, data.assignments)).map((n) => {
        const p = proxies.find((x) => x.assignmentId === n.assignment.id && x.role === n.role);
        return {
          key: `${n.assignment.id}:${n.role}`,
          at: n.assignment.startsAt,
          time: spanText(n.assignment),
          group: names.groups.get(n.assignment.groupId)?.name ?? '',
          subject: names.subjects.get(n.assignment.subjectId)?.name ?? '',
          absent: teacher(n.absentId),
          proxy: p ? teacher(p.proxyTeacherId) : null,
          role: n.role,
        };
      });
    // A proxy for a lesson no longer in the routine keeps its names in the snapshot.
    const shown = new Set(rows.map((r) => r.key));
    for (const p of proxies) {
      if (!past && p.assignmentId && shown.has(`${p.assignmentId}:${p.role}`)) continue;
      rows.push({ key: p.id, at: p.startsAt ?? 0, time: p.snapshot.period, group: p.snapshot.group, subject: p.snapshot.subject, absent: p.snapshot.absent, proxy: teacher(p.proxyTeacherId), role: p.role });
    }
    const away = absences.map((a) => teacher(a.teacherId)).filter(Boolean);
    rows.sort((a, b) => a.at - b.at);
    return { date: d, rows, away, past };
  });
  const all = days.flatMap((d) => d.rows);
  const done = all.filter((r) => r.proxy).length;
  const text = days.filter((d) => d.rows.length).map((d) => proxyDayText(d.date, d.rows)).join('\n\n');
  const monthRows = Object.entries(month)
    .map(([id, n]) => ({ name: teacher(id), n }))
    .filter((r) => r.name)
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const max = Math.max(1, ...monthRows.map((r) => r.n));
  const href = (patch: { date?: string; mode?: string }) => {
    const q = new URLSearchParams({ ...(week ? {} : { mode: 'day' }), date, ...patch });
    if (q.get('mode') === 'week') q.delete('mode');
    if (q.get('date') === today) q.delete('date');
    return `/admin/routine/proxy/list${q.size ? `?${q}` : ''}`;
  };
  const range = week ? `${short(dates[0])} – ${short(dates[5])}` : dateText(dates[0]);
  const monthName = new Intl.DateTimeFormat('bn-BD', { month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
  const ARROW = 'inline-flex size-9 items-center justify-center rounded-lg border bg-white hover:bg-muted';
  const SEG = 'h-[30px] rounded-md px-3 text-sm font-medium leading-[30px] no-underline';

  return (
    <>
      <PageTop crumbs={crumbs} round={false} />
      <PageBody>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageTitle
            sub={
              <>
                কে আসেননি, কার ক্লাস কে নিয়েছেন। প্রক্সি দিতে{' '}
                <Link href="/admin/routine/proxy" className={LINK}>
                  প্রক্সি রেজিস্টার
                </Link>
                ।
              </>
            }
          >
            প্রক্সি তালিকা
          </PageTitle>
          {all.length > 0 && (
            <div className="flex flex-wrap gap-2 sv-no-print">
              <CopyText text={text} label="WhatsApp-এ কপি" />
              <ReportTools printLabel="প্রিন্ট" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 sv-no-print">
          <div role="radiogroup" aria-label="দিন না সপ্তাহ" className="inline-flex gap-0.5 rounded-lg bg-muted p-[3px]">
            {(
              [
                ['day', 'দিন'],
                ['week', 'সপ্তাহ'],
              ] as const
            ).map(([m, label]) => (
              <Link key={m} href={href({ mode: m })} role="radio" aria-checked={(m === 'week') === week} className={cn(SEG, (m === 'week') === week ? 'bg-white text-foreground shadow-[0_1px_2px_rgba(23,23,23,0.08)]' : 'text-muted-foreground hover:text-foreground')}>
                {label}
              </Link>
            ))}
          </div>
          <Link href={href({ date: week ? addDays(dates[0], -7) : stepDay(dates[0], -1) })} className={ARROW} aria-label={week ? 'আগের সপ্তাহ' : 'আগের দিন'}>
            <ChevronLeft aria-hidden className="size-4" />
          </Link>
          <span className="min-w-40 text-center text-sm font-medium">{range}</span>
          <Link href={href({ date: week ? addDays(dates[0], 7) : stepDay(dates[0], 1) })} className={ARROW} aria-label={week ? 'পরের সপ্তাহ' : 'পরের দিন'}>
            <ChevronRight aria-hidden className="size-4" />
          </Link>
          {dayOfDate(today) !== null && !dates.includes(today) && (
            <Link href={href({ date: today })} className="text-sm underline underline-offset-4">
              {week ? 'এই সপ্তাহ' : 'আজ'}
            </Link>
          )}
        </div>
        <p className="sv-print-only m-0 text-sm">{range}</p>

        <StatTiles>
          <StatTile label="মোট" value={bn(all.length)} unit="টা ক্লাস" />
          <StatTile label="ঠিক হয়েছে" value={bn(done)} unit="টা" />
          <StatTile label="প্রক্সি লাগবে" value={bn(all.length - done)} unit="টা" />
        </StatTiles>

        <div className="flex flex-col gap-3">
          {days.map((d) => (
            <section key={d.date} className="rounded-xl border bg-card">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b bg-muted/50 px-4 py-2.5">
                <h2 className="m-0 text-[15px] font-semibold">
                  {dateText(d.date)}
                  {d.date === today && <span className="ml-2 text-[13px] font-medium text-primary">আজ</span>}
                </h2>
                {d.away.length > 0 && (
                  <span className="text-[13px] text-muted-foreground">
                    অ্যাবসেন্ট: {d.away.join(', ')} · {bn(d.rows.length)}টা ক্লাস
                  </span>
                )}
              </div>
              {d.rows.length === 0 ? (
                <p className="m-0 px-4 py-3 text-sm text-muted-foreground">{!d.away.length ? 'এ দিনে কেউ অ্যাবসেন্ট ছিলেন না।' : d.past ? 'এ দিন কোনো প্রক্সি দেওয়া হয়নি।' : 'যাঁরা আসেননি, তাঁদের এ দিন কোনো ক্লাস নেই।'}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {['সময়', 'ক্লাস · সাবজেক্ট', 'অ্যাবসেন্ট', 'প্রক্সি'].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-[12.5px] font-medium text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {d.rows.map((r) => (
                      <tr key={r.key} className="border-b last:border-0">
                        <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{r.time}</td>
                        <td className="px-4 py-2">
                          <span className="font-medium">{r.group}</span> · {r.subject}
                          {r.role === 'ta' && <span className="text-muted-foreground"> (টিএ)</span>}
                        </td>
                        <td className="px-4 py-2">{r.absent}</td>
                        <td className="px-4 py-2">
                          {r.proxy ? (
                            <span className="font-semibold text-success">→ {r.proxy}</span>
                          ) : (
                            <Link href={`/admin/routine/proxy${d.date === today ? '' : `?date=${d.date}`}`} className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[13px] font-semibold text-destructive no-underline">
                              প্রক্সি লাগবে
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>

        <Card title={`${monthName} মাসে কে কয়টা প্রক্সি নিয়েছেন`} className="sv-no-print">
          {monthRows.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">{monthName} মাসে কোনো প্রক্সি নেই।</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
              {monthRows.map((r) => (
                <li key={r.name} className="grid grid-cols-[96px_1fr_32px] items-center gap-3">
                  <span>{r.name}</span>
                  <span className="h-2.5 rounded bg-muted">
                    <span className="block h-full rounded bg-primary" style={{ width: `${Math.round((r.n / max) * 100)}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{bn(r.n)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </PageBody>
    </>
  );
}
