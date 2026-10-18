import type { Metadata } from 'next';
import Link from 'next/link';
import { listRoutines, monthProxyCounts, pickRoutine, routineData } from '@/lib/routine/data';
import { DAY_SHORT, dhakaToday, durationText } from '@/lib/routine/days';
import { busiestDay, salaryPerPeriod, teacherLoads, type LoadStatus } from '@/lib/routine/load';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { PageTop } from '../../AdminShell';
import { Card, EmptyState, LINK, PageBody, PageTitle, StatTile, StatTiles } from '../../ui';
import { RoutinePicker } from '../controls';
import { LoadBadge, NoRoutine, routineSub } from '../ui';

export const metadata: Metadata = { title: 'ওয়ার্কলোড' };
export const dynamic = 'force-dynamic';

const ORDER: Record<LoadStatus, number> = { over: 0, under: 1, none: 2, ok: 3 };
const TH = 'px-3 py-2.5 text-left text-[12.5px] font-medium text-muted-foreground whitespace-nowrap';
const TD = 'px-3 py-2.5 align-top whitespace-nowrap';
const money = (n: number | null) => (n == null ? '—' : `৳${bn(n.toLocaleString('en-IN'))}`);
const num = (n: number) => bn(Number.isInteger(n) ? n : n.toFixed(1));

export default async function WorkloadPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { r } = await searchParams;
  const [routines, routine, month] = await Promise.all([listRoutines(), pickRoutine(r), monthProxyCounts(dhakaToday())]);
  const data = routine ? await routineData(routine) : null;
  const crumbs = [{ label: 'রুটিন', href: '/admin/routine' }, { label: 'ওয়ার্কলোড' }];
  if (!data) {
    return (
      <>
        <PageTop crumbs={crumbs} round={false} />
        <PageBody>
          <PageTitle>ওয়ার্কলোড</PageTitle>
          <NoRoutine />
        </PageBody>
      </>
    );
  }
  const active = data.teachers.filter((t) => t.active);
  const loads = teacherLoads(active, data.assignments, data.periods);
  const subjectName = new Map(data.subjects.map((s) => [s.id, s.name]));
  const staff = active.filter((t) => !t.isVacancy).sort((a, b) => ORDER[loads.get(a.id)!.status] - ORDER[loads.get(b.id)!.status] || a.shortName.localeCompare(b.shortName));
  const vacancies = active.filter((t) => t.isVacancy);
  const count = (s: LoadStatus) => staff.filter((t) => loads.get(t.id)!.status === s).length;
  const q = routine?.status === 'active' ? '' : `?r=${routine!.id}`;

  return (
    <>
      <PageTop crumbs={crumbs} round={false} />
      <PageBody>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageTitle sub={routineSub(data.routine, 'সপ্তাহে পিরিয়ড = মূল + সহকারীর অর্ধেক; লক্ষ্যের ৮০%-এর কম ‘কম’, ১০০%-এর বেশি ‘বেশি’')}>ওয়ার্কলোড</PageTitle>
          <RoutinePicker routines={routines} current={data.routine.id} />
        </div>
        <StatTiles>
          <StatTile label="বেশি" value={bn(count('over'))} unit="জন" />
          <StatTile label="কম" value={bn(count('under'))} unit="জন" />
          <StatTile label="ঠিক আছে" value={bn(count('ok'))} unit="জন" />
          <StatTile label="লক্ষ্য দেওয়া নেই" value={bn(count('none'))} unit="জন" muted />
        </StatTiles>

        {staff.length === 0 ? (
          <EmptyState>কোনো সক্রিয় শিক্ষক নেই।</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b">
                  <th className={TH}>শিক্ষক</th>
                  <th className={TH}>মূল</th>
                  <th className={TH}>সহকারী</th>
                  <th className={TH}>মোট / লক্ষ্য</th>
                  <th className={TH}>অবস্থা</th>
                  <th className={TH}>সপ্তাহে সময়</th>
                  <th className={TH}>ব্যস্ততম দিন</th>
                  <th className={TH}>এ মাসে প্রক্সি</th>
                  <th className={TH}>বেতন</th>
                  <th className={TH}>পিরিয়ডপ্রতি</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((t) => {
                  const l = loads.get(t.id)!;
                  const busy = busiestDay(l);
                  return (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className={TD}>
                        <Link href={`/admin/routine/teachers/${t.id}${q}`} className={cn(LINK, 'font-medium')}>
                          {t.shortName}
                        </Link>
                      </td>
                      <td className={cn(TD, 'tabular-nums')}>{bn(l.main)}</td>
                      <td className={cn(TD, 'tabular-nums')}>{bn(l.ta)}</td>
                      <td className={cn(TD, 'tabular-nums')}>
                        {num(l.weighted)}
                        {l.target != null && <span className="text-muted-foreground"> / {bn(l.target)}</span>}
                        {l.percent != null && <span className="text-muted-foreground"> ({bn(Math.round(l.percent * 100))}%)</span>}
                      </td>
                      <td className={TD}>
                        <LoadBadge status={l.status} />
                      </td>
                      <td className={TD}>{durationText(l.minutesMain + l.minutesTa)}</td>
                      <td className={TD}>{busy ? `${DAY_SHORT[busy.day]} (${bn(busy.count)})` : '—'}</td>
                      <td className={cn(TD, 'tabular-nums')}>{bn(month[t.id] ?? 0)}</td>
                      <td className={cn(TD, 'tabular-nums')}>{money(t.salary)}</td>
                      <td className={cn(TD, 'tabular-nums')}>{money(salaryPerPeriod(t.salary, l.weighted))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Card title="শূন্য পদ">
          {vacancies.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">কোনো শূন্য পদ নেই। নিয়োগ বাকি এমন পদ শিক্ষক পেজে &quot;শূন্য পদ&quot; হিসেবে যোগ করে রুটিনে বসানো যায়।</p>
          ) : (
            <ul className="m-0 flex list-none flex-col divide-y p-0 text-sm">
              {vacancies.map((t) => {
                const l = loads.get(t.id)!;
                return (
                  <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                    <span>
                      <Link href={`/admin/routine/teachers/${t.id}${q}`} className={cn(LINK, 'font-medium')}>
                        {t.shortName}
                      </Link>
                      <span className="text-muted-foreground"> · {t.subjectIds.map((id) => subjectName.get(id)).filter(Boolean).join(', ') || 'বিষয় দেওয়া নেই'}</span>
                    </span>
                    <span className="tabular-nums">সপ্তাহে {num(l.weighted)} পিরিয়ড</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </PageBody>
    </>
  );
}
