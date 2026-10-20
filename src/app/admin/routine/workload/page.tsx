import type { Metadata } from 'next';
import Link from 'next/link';
import { listRoutines, monthProxyCounts, pickRoutine, routineData } from '@/lib/routine/data';
import { DAYS, daysText, dhakaToday, durationText } from '@/lib/routine/days';
import { busiestDays, salaryPerPeriod, teacherLoads, type LoadStatus } from '@/lib/routine/load';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { PageTop } from '../../AdminShell';
import { Card, EmptyState, LINK, PageBody, PageTitle, StatTile, StatTiles } from '../../ui';
import { RoutinePicker } from '../controls';
import { LoadBadge, NoRoutine, routineSub } from '../ui';
import { TargetInput } from './TargetInput';

export const metadata: Metadata = { title: 'ওয়ার্কলোড' };
export const dynamic = 'force-dynamic';

const TH = 'px-3 py-2.5 text-left text-[12.5px] font-medium text-muted-foreground whitespace-nowrap';
const TD = 'px-3 py-2.5 align-top whitespace-nowrap';
const money = (n: number | null) => (n == null ? '—' : `৳${bn(n.toLocaleString('en-IN'))}`);
const num = (n: number) => bn(Number.isInteger(n) ? n : n.toFixed(1));
/** Periods a school day as the sheet writes it, main + TA, to the nearest whole: "৩+১". */
const perDay = (main: number, ta: number) => `${bn(Math.round(main / DAYS.length))}+${bn(Math.round(ta / DAYS.length))}`;

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
  // By name, so a row stays put when its target is typed in and its status changes.
  const staff = active.filter((t) => !t.isVacancy);
  const vacancies = active.filter((t) => t.isVacancy);
  const count = (s: LoadStatus) => staff.filter((t) => loads.get(t.id)!.status === s).length;
  const q = routine?.status === 'active' ? '' : `?r=${routine!.id}`;

  return (
    <>
      <PageTop crumbs={crumbs} round={false} />
      <PageBody>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageTitle sub={routineSub(data.routine, 'সপ্তাহের পিরিয়ড = মেইন + টিএ-র অর্ধেক। টার্গেটের ৮০%-এর কম হলে ‘কম’, ১০০%-এর বেশি হলে ‘বেশি’। টার্গেট এখানেই লিখুন, Enter দিলে সেভ হবে।')}>ওয়ার্কলোড</PageTitle>
          <RoutinePicker routines={routines} current={data.routine.id} />
        </div>
        <StatTiles>
          <StatTile label="বেশি" value={bn(count('over'))} unit="জন" />
          <StatTile label="কম" value={bn(count('under'))} unit="জন" />
          <StatTile label="ঠিক আছে" value={bn(count('ok'))} unit="জন" />
          <StatTile label="টার্গেট দেওয়া নেই" value={bn(count('none'))} unit="জন" muted />
        </StatTiles>

        {staff.length === 0 ? (
          <EmptyState>কোনো চালু টিচার নেই।</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="border-b">
                  <th className={TH}>টিচার</th>
                  <th className={TH}>মেইন</th>
                  <th className={TH}>টিএ</th>
                  <th className={TH}>দিনে (মেইন+টিএ)</th>
                  <th className={TH}>সপ্তাহে মোট</th>
                  <th className={TH}>টার্গেট</th>
                  <th className={TH}>স্ট্যাটাস</th>
                  <th className={TH}>সপ্তাহে সময়</th>
                  <th className={TH}>সবচেয়ে বেশি ক্লাস</th>
                  <th className={TH}>এ মাসে প্রক্সি</th>
                  <th className={TH}>বেতন</th>
                  <th className={TH}>প্রতি পিরিয়ডে</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((t) => {
                  const l = loads.get(t.id)!;
                  const busy = busiestDays(l);
                  return (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className={TD}>
                        <Link href={`/admin/routine/teachers/${t.id}${q}`} className={cn(LINK, 'font-medium')}>
                          {t.shortName}
                        </Link>
                      </td>
                      <td className={cn(TD, 'tabular-nums')}>{bn(l.main)}</td>
                      <td className={cn(TD, 'tabular-nums')}>{bn(l.ta)}</td>
                      <td className={cn(TD, 'tabular-nums')}>{perDay(l.main, l.ta)}</td>
                      <td className={cn(TD, 'tabular-nums')}>{num(l.weighted)}</td>
                      <td className={cn(TD, 'py-1.5')}>
                        <TargetInput teacherId={t.id} name={t.shortName} target={t.targetPeriods} />
                      </td>
                      <td className={TD}>
                        <span className="inline-flex items-center gap-1.5">
                          <LoadBadge status={l.status} />
                          {l.percent != null && <span className="tabular-nums text-muted-foreground">{bn(Math.round(l.percent * 100))}%</span>}
                        </span>
                      </td>
                      <td className={TD}>{durationText(l.minutesMain + l.minutesTa)}</td>
                      <td className={TD}>{busy ? `${daysText(busy.days)} (${bn(busy.count)})` : '—'}</td>
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

        <Card title="খালি পোস্ট">
          {vacancies.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">কোনো খালি পোস্ট নেই। যে পোস্টে এখনো টিচার নেওয়া হয়নি, সেটা টিচার পেজে &quot;খালি পোস্ট&quot; হিসেবে যোগ করে রুটিনে বসানো যায়।</p>
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
                      <span className="text-muted-foreground"> · {t.subjectIds.map((id) => subjectName.get(id)).filter(Boolean).join(', ') || 'সাবজেক্ট দেওয়া নেই'}</span>
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
