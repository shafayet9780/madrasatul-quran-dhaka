import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { listRoutines, monthProxyCounts, pickRoutine, routineData, teacherProxies } from '@/lib/routine/data';
import { DAY_NAMES, dateText, daysText, dhakaToday, durationText } from '@/lib/routine/days';
import { busiestDays, salaryPerPeriod, teacherLoads } from '@/lib/routine/load';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { PageTop } from '../../../AdminShell';
import { ReportTools } from '../../../reports/ReportTools';
import { Card, EmptyState, LINK, PageBody, PageTitle, StatTile, StatTiles } from '../../../ui';
import { RoutinePicker } from '../../controls';
import { LoadBadge, NoRoutine, routineSub } from '../../ui';
import { WeekTable } from '../../WeekTable';

export const metadata: Metadata = { title: 'শিক্ষকের রুটিন' };
export const dynamic = 'force-dynamic';

export default async function TeacherPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ r?: string }> }) {
  const [{ id }, { r }] = await Promise.all([params, searchParams]);
  const [routines, routine] = await Promise.all([listRoutines(), pickRoutine(r)]);
  const data = routine ? await routineData(routine) : null;
  const teacher = data?.teachers.find((t) => t.id === id);
  if (data && !teacher) notFound();
  const crumbs = [{ label: 'রুটিন', href: '/admin/routine' }, { label: 'শিক্ষক', href: '/admin/routine/teachers' }, { label: teacher?.shortName ?? '' }];
  if (!data || !teacher) {
    return (
      <>
        <PageTop crumbs={crumbs} round={false} />
        <PageBody>
          <NoRoutine />
        </PageBody>
      </>
    );
  }
  const [proxies, month] = await Promise.all([teacherProxies(id), monthProxyCounts(dhakaToday())]);
  const load = teacherLoads([teacher], data.assignments, data.periods).get(teacher.id)!;
  const busiest = busiestDays(load);
  const perPeriod = salaryPerPeriod(teacher.salary, load.weighted);
  const groups = new Map(data.groups.map((g) => [g.id, g]));
  const subjects = new Map(data.subjects.map((s) => [s.id, s.name]));
  const mine = data.assignments.filter((a) => a.teacherId === id || a.taId === id);
  const q = routine && routine.status !== 'active' ? `?r=${routine.id}` : '';

  return (
    <>
      <PageTop
        crumbs={crumbs}
        round={false}
        actions={
          <Button asChild variant="outline" className="adm h-9 bg-white shadow-none">
            <Link href={`/admin/routine/teachers/${id}/edit`}>
              <Pencil aria-hidden />
              তথ্য এডিট
            </Link>
          </Button>
        }
      />
      <PageBody className="rt-a4l">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageTitle sub={routineSub(data.routine, [teacher.fullName, teacher.designation].filter(Boolean).join(' · '))}>
            {teacher.shortName}
            {teacher.isVacancy && <span className="ml-2 text-base font-normal text-muted-foreground">শূন্য পদ</span>}
            {!teacher.active && <span className="ml-2 text-base font-normal text-muted-foreground">নিষ্ক্রিয়</span>}
          </PageTitle>
          <div className="flex flex-wrap items-center gap-3">
            <RoutinePicker routines={routines} current={data.routine.id} />
            <ReportTools printLabel="প্রিন্ট (A4)" />
          </div>
        </div>

        <div className="sv-no-print">
          <StatTiles>
            <StatTile label="সপ্তাহে পিরিয়ড" value={bn(load.weighted)} unit={load.target ? `/ ${bn(load.target)}` : undefined} sub={`মূল ${bn(load.main)} · সহকারী ${bn(load.ta)} (অর্ধেক ধরে)`} note={<LoadBadge status={load.status} />} />
            <StatTile label="সপ্তাহে সময়" value={durationText(load.minutesMain + load.minutesTa)} sub={load.minutesTa ? `সহকারী হিসেবে ${durationText(load.minutesTa)}` : undefined} />
            <StatTile label="সবচেয়ে ব্যস্ত দিন" value={busiest ? (busiest.days.length === 1 ? DAY_NAMES[busiest.days[0]] : daysText(busiest.days)) : '—'} sub={busiest ? `${bn(busiest.count)}টি পিরিয়ড${busiest.days.length > 1 ? ' করে' : ''}` : undefined} />
            <StatTile label="এ মাসে প্রক্সি" value={bn(month[id] ?? 0)} unit="টি" sub={perPeriod ? `পিরিয়ডপ্রতি বেতন প্রায় ৳${bn(perPeriod)}` : undefined} />
          </StatTiles>
        </div>

        <p className="m-0 text-sm">
          <span className="text-muted-foreground">যে বিষয় পড়ান: </span>
          {teacher.subjectIds.map((s) => subjects.get(s)).filter(Boolean).join(', ') || '—'}
        </p>

        {mine.length === 0 ? (
          <EmptyState>এই রুটিনে এখনো কোনো ক্লাস নেই।</EmptyState>
        ) : (
          <WeekTable
            periods={data.periods}
            label={`${teacher.shortName}-এর সাপ্তাহিক রুটিন`}
            cell={(day, period) =>
              mine
                .filter((a) => a.periodId === period.id && a.days.includes(day))
                .map((a) => (
                  <div key={a.id} className="rt-entry">
                    <Link href={`/admin/routine/groups/${a.groupId}${q}`} className="font-medium no-underline hover:underline">
                      {groups.get(a.groupId)?.name}
                    </Link>
                    <span>
                      {subjects.get(a.subjectId)}
                      {a.taId === id && <span className="text-muted-foreground"> · সহকারী</span>}
                    </span>
                  </div>
                ))
            }
          />
        )}

        {proxies.length > 0 && (
          <Card title="সাম্প্রতিক প্রক্সি" className="sv-no-print">
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
              {proxies.map((p, i) => (
                <li key={i}>
                  <Link href={`/admin/routine/proxy?date=${p.date}`} className={LINK}>
                    {dateText(p.date)}
                  </Link>
                  {' · '}
                  {p.snapshot.period} · {p.snapshot.group} ({p.snapshot.subject}) · {p.snapshot.absent}-এর বদলে{p.role === 'ta' ? ' (সহকারী)' : ''}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </PageBody>
    </>
  );
}
