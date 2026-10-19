import type { Metadata } from 'next';
import Link from 'next/link';
import { freeOnDate } from '@/lib/routine/availability';
import { proxyDay } from '@/lib/routine/data';
import { dateText, dayOfDate, dhakaMinutes, dhakaToday, isDate, periodAt, periodText } from '@/lib/routine/days';
import { periodsOnDay } from '@/lib/routine/free';
import type { Period, Teacher } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { PageTop } from '../../AdminShell';
import { EmptyState, LINK, PageBody, PageTitle } from '../../ui';
import { DatePicker, ParamSelect } from '../controls';
import { NoRoutine, routineSub } from '../ui';

export const metadata: Metadata = { title: 'ফ্রি টিচার' };
export const dynamic = 'force-dynamic';

// Who is free in every period of a date (docs/class-routine.md §5): one card per period. On a
// school day that is today the running period comes first; absences and proxies of the date count.

export default async function FreePage({ searchParams }: { searchParams: Promise<{ date?: string; subject?: string }> }) {
  const sp = await searchParams;
  const date = isDate(sp.date) ? sp.date : dhakaToday();
  const day = dayOfDate(date);
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
  const isToday = date === dhakaToday();
  const now = dhakaMinutes();
  const running = isToday ? periodAt(data.periods, now) : null;
  // Today: the running period, then the ones still to come; the earlier ones fold away.
  const later = isToday ? data.periods.filter((p) => p !== running && p.startsAt >= now) : [];
  const live = isToday && (running !== null || later.length > 0);
  const shown = live ? [...(running ? [running] : []), ...later] : data.periods;
  const earlier = live ? data.periods.filter((p) => !shown.includes(p)) : [];
  const away = absences.map((a) => data.teachers.find((t) => t.id === a.teacherId)?.shortName).filter(Boolean);

  const chip = (t: Teacher, strong: boolean) => (
    <li key={t.id}>
      <Link href={`/admin/routine/teachers/${t.id}`} className={cn('flex min-h-11 flex-col rounded-lg border px-3 py-1.5 no-underline', strong ? 'border-success/35 bg-success/5 text-foreground hover:border-success' : 'bg-muted/40 text-muted-foreground hover:border-input')}>
        <span className="text-sm font-medium">
          {t.shortName}
          <span className="font-normal text-muted-foreground"> · এ দিন {bn(day === null ? 0 : periodsOnDay(data.assignments, t.id, day))}টা ক্লাস</span>
        </span>
        <span className="text-[12px] text-muted-foreground">{t.subjectIds.map((id) => subjectName.get(id)).filter(Boolean).join(', ') || 'সাবজেক্ট দেওয়া নেই'}</span>
      </Link>
    </li>
  );

  const card = (p: Period) => {
    const { here, away: notIn } = freeOnDate({ teachers: data.teachers, assignments: data.assignments, periods: data.periods, day: day!, periodId: p.id, absences, proxies });
    const can = subject ? here.filter((t) => t.subjectIds.includes(subject.id)) : here;
    const rest = subject ? here.filter((t) => !t.subjectIds.includes(subject.id)) : [];
    const isNow = p === running;
    return (
      <section key={p.id} className={cn('rounded-xl border bg-card p-4', isNow && 'border-primary/50 ring-2 ring-primary/15')}>
        <h2 className="m-0 mb-3 flex flex-wrap items-baseline gap-2 text-[15px] font-semibold">
          {periodText(p)}
          {isNow && <span className="rounded-full bg-primary px-2 py-0.5 text-[12px] font-medium text-primary-foreground">এখন চলছে</span>}
          <span className="text-[13px] font-normal text-muted-foreground">{bn(here.length)} জন ফ্রি</span>
        </h2>
        <div className="flex flex-col gap-2">
          {subject && <p className="m-0 text-[13px] text-muted-foreground">{can.length ? `${subject.name} পড়ান` : `${subject.name} পড়ান এমন কেউ ফ্রি নেই`}</p>}
          {!subject && here.length === 0 && <p className="m-0 text-sm text-muted-foreground">এ সময় স্কুলে থাকা কেউ ফ্রি নেই।</p>}
          {can.length > 0 && <ul className="m-0 flex list-none flex-wrap gap-2 p-0">{can.map((t) => chip(t, true))}</ul>}
          {rest.length > 0 && (
            <>
              <p className="m-0 text-[13px] text-muted-foreground">অন্য সাবজেক্টের টিচার</p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">{rest.map((t) => chip(t, false))}</ul>
            </>
          )}
          {notIn.length > 0 && (
            <details className="text-[13px] text-muted-foreground">
              <summary className="cursor-pointer">এ সময় স্কুলে থাকেন না ({bn(notIn.length)} জন, এ বেলা তাঁদের কোনো ক্লাস নেই)</summary>
              <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">{notIn.map((t) => chip(t, false))}</ul>
            </details>
          )}
        </div>
      </section>
    );
  };

  return (
    <>
      <PageTop crumbs={crumbs} round={false} />
      <PageBody>
        <PageTitle sub={routineSub(data.routine, 'প্রতিটি পিরিয়ডে কে ফ্রি আর কোন সাবজেক্ট পড়ান')}>ফ্রি টিচার · {isToday ? 'আজ' : dateText(date)}</PageTitle>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DatePicker date={date} />
          <ParamSelect name="subject" value={subject?.id ?? ''} label="সাবজেক্ট" options={[{ value: '', label: 'সব সাবজেক্ট' }, ...data.subjects.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))]} />
        </div>
        {day === null ? (
          <EmptyState>শুক্রবার ক্লাস নেই।</EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {away.length > 0 && (
              <p className="m-0 text-sm text-muted-foreground">
                {isToday ? 'আজ' : 'এ দিন'} অ্যাবসেন্ট: {away.join(', ')} ·{' '}
                <Link href={`/admin/routine/proxy${isToday ? '' : `?date=${date}`}`} className={LINK}>
                  প্রক্সি দেখুন
                </Link>
              </p>
            )}
            {shown.map(card)}
            {earlier.length > 0 && (
              <details className="rounded-xl border bg-card px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium">আগের পিরিয়ডগুলো ({bn(earlier.length)}টা)</summary>
                <div className="mt-3 flex flex-col gap-3">{earlier.map(card)}</div>
              </details>
            )}
          </div>
        )}
      </PageBody>
    </>
  );
}
