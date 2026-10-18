import type { Metadata } from 'next';
import Link from 'next/link';
import { activeRoutine, routineData } from '@/lib/routine/data';
import { DAY_NAMES, DAY_SHORT, DAYS, dayOfDate, dhakaToday, periodText } from '@/lib/routine/days';
import { freeTeachers, periodsOnDay } from '@/lib/routine/free';
import type { Teacher } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { PageTop } from '../../AdminShell';
import { PageBody, PageTitle } from '../../ui';
import { ParamSelect } from '../controls';
import { NoRoutine, routineSub } from '../ui';

export const metadata: Metadata = { title: 'ফ্রি শিক্ষক' };
export const dynamic = 'force-dynamic';

export default async function FreePage({ searchParams }: { searchParams: Promise<{ day?: string; subject?: string }> }) {
  const sp = await searchParams;
  const routine = await activeRoutine();
  const data = routine ? await routineData(routine) : null;
  const asked = Number(sp.day);
  const day = Number.isInteger(asked) && asked >= 0 && asked <= 5 ? asked : (dayOfDate(dhakaToday()) ?? 0);
  const subject = data?.subjects.find((s) => s.id === sp.subject);
  const subjectName = new Map(data?.subjects.map((s) => [s.id, s.name]));
  const q = (d: number) => `/admin/routine/free?day=${d}${subject ? `&subject=${subject.id}` : ''}`;

  const chip = (t: Teacher, strong: boolean) => (
    <li key={t.id}>
      <Link
        href={`/admin/routine/teachers/${t.id}`}
        className={cn('flex flex-col rounded-lg border px-3 py-1.5 no-underline hover:border-input', strong ? 'bg-white text-foreground' : 'bg-muted/40 text-muted-foreground')}
      >
        <span className="text-sm font-medium">
          {t.shortName}
          <span className="font-normal text-muted-foreground"> · এ দিনে {bn(periodsOnDay(data!.assignments, t.id, day))}টি ক্লাস</span>
        </span>
        <span className="text-[12px] text-muted-foreground">{t.subjectIds.map((id) => subjectName.get(id)).filter(Boolean).join(', ') || 'বিষয় দেওয়া নেই'}</span>
      </Link>
    </li>
  );

  return (
    <>
      <PageTop crumbs={[{ label: 'রুটিন', href: '/admin/routine' }, { label: 'ফ্রি শিক্ষক' }]} round={false} />
      <PageBody>
        <PageTitle sub={data ? routineSub(data.routine, 'প্রতিটি পিরিয়ডে যাঁদের ক্লাস নেই, আর তাঁরা কী পড়ান') : undefined}>ফ্রি শিক্ষক · {DAY_NAMES[day]}</PageTitle>
        {!data ? (
          <NoRoutine>কোনো রুটিন চালু নেই।</NoRoutine>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav aria-label="দিন" className="inline-flex flex-wrap gap-0.5 rounded-lg bg-muted p-[3px]">
                {DAYS.map((d) => (
                  <Link
                    key={d}
                    href={q(d)}
                    aria-current={d === day ? 'page' : undefined}
                    className={cn('inline-flex h-[30px] items-center rounded-md px-3 text-sm font-medium no-underline', d === day ? 'bg-white text-foreground shadow-[0_1px_2px_rgba(23,23,23,0.08)]' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {DAY_SHORT[d]}
                  </Link>
                ))}
              </nav>
              <ParamSelect name="subject" value={subject?.id ?? ''} label="বিষয়" options={[{ value: '', label: 'সব বিষয়' }, ...data.subjects.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))]} />
            </div>
            <div className="flex flex-col gap-3">
              {data.periods.map((p) => {
                const free = freeTeachers(data.teachers, data.assignments, day, p.id);
                const can = subject ? free.filter((t) => t.subjectIds.includes(subject.id)) : free;
                const rest = subject ? free.filter((t) => !t.subjectIds.includes(subject.id)) : [];
                return (
                  <section key={p.id} className="rounded-xl border bg-card p-4">
                    <h2 className="m-0 mb-3 flex flex-wrap items-baseline gap-2 text-[15px] font-semibold">
                      {periodText(p)}
                      <span className="text-[13px] font-normal text-muted-foreground">{bn(free.length)} জন ফ্রি</span>
                    </h2>
                    {free.length === 0 ? (
                      <p className="m-0 text-sm text-muted-foreground">এই পিরিয়ডে কেউ ফ্রি নেই।</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {subject && <p className="m-0 text-[13px] text-muted-foreground">{can.length ? `${subject.name} পড়াতে পারেন` : `${subject.name} পড়ান এমন কেউ ফ্রি নেই`}</p>}
                        {can.length > 0 && <ul className="m-0 flex list-none flex-wrap gap-2 p-0">{can.map((t) => chip(t, true))}</ul>}
                        {rest.length > 0 && (
                          <>
                            <p className="m-0 text-[13px] text-muted-foreground">অন্যরা</p>
                            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">{rest.map((t) => chip(t, false))}</ul>
                          </>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </PageBody>
    </>
  );
}
