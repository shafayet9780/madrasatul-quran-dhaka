'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { lookup } from '@/lib/routine/clash';
import type { ProxyDay } from '@/lib/routine/data';
import { dayOfDate, periodText } from '@/lib/routine/days';
import { needsFor, proxyDayText, rankCandidates, type Need } from '@/lib/routine/proxy';
import type { RoutineData } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { ReportTools } from '../../reports/ReportTools';
import { Card, EmptyState, LINK } from '../../ui';
import { deleteAbsenceAction, saveAbsenceAction, setProxyAction } from '../actions';
import { ConfirmButton, INPUT, OUTLINE, SELECT, useAction, useParam } from '../controls';

type Day = ProxyDay & { data: RoutineData };

export function ProxyBoard({ date, day }: { date: string; day: Day }) {
  const set = useParam();
  const { data, absences, proxies } = day;
  const names = useMemo(() => lookup(data), [data]);
  const weekday = dayOfDate(date);
  const monthCounts = useMemo(() => new Map(Object.entries(day.monthCounts)), [day.monthCounts]);
  const periodOrder = new Map(data.periods.map((p, i) => [p.id, i]));
  const needs = weekday === null ? [] : needsFor(weekday, absences, data.assignments).sort(
    (a, b) => periodOrder.get(a.assignment.periodId)! - periodOrder.get(b.assignment.periodId)! || (names.groups.get(a.assignment.groupId)?.sort ?? 0) - (names.groups.get(b.assignment.groupId)?.sort ?? 0),
  );
  const chosen = (n: Need) => proxies.find((p) => p.assignmentId === n.assignment.id && p.role === n.role);
  const lines = needs.map((n) => ({
    period: periodText(data.periods.find((p) => p.id === n.assignment.periodId)!),
    group: names.groups.get(n.assignment.groupId)?.name ?? '',
    subject: names.subjects.get(n.assignment.subjectId)?.name ?? '',
    absent: names.teachers.get(n.absentId)?.shortName ?? '',
    proxy: (() => {
      const c = chosen(n);
      return c ? (names.teachers.get(c.proxyTeacherId)?.shortName ?? null) : null;
    })(),
    role: n.role,
  }));
  const covered = lines.filter((l) => l.proxy).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 sv-no-print">
        <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
          তারিখ
          <input type="date" className={INPUT} value={date} onChange={(e) => e.target.value && set('date', e.target.value)} />
        </label>
        {needs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <CopyText text={proxyDayText(date, lines)} />
            <ReportTools printLabel="প্রিন্ট (A4)" />
          </div>
        )}
      </div>

      {weekday === null ? (
        <EmptyState>শুক্রবার ক্লাস নেই।</EmptyState>
      ) : (
        <>
          <Card title="অনুপস্থিত শিক্ষক" className="sv-no-print">
            <Absences date={date} day={day} />
          </Card>

          <Card title={needs.length ? `যে ক্লাসগুলোতে প্রক্সি লাগবে · ${bn(covered)}/${bn(needs.length)} ঠিক হয়েছে` : 'যে ক্লাসগুলোতে প্রক্সি লাগবে'}>
            {needs.length === 0 ? (
              <p className="m-0 text-sm text-muted-foreground">{absences.length ? 'অনুপস্থিত শিক্ষকদের এই দিনে কোনো ক্লাস নেই।' : 'উপরে অনুপস্থিত শিক্ষক যোগ করলে তাঁদের ক্লাসগুলো এখানে আসবে।'}</p>
            ) : (
              // A table on wide screens and paper; stacked rows on phones, so the picker stays in view.
              <div className="text-sm">
                <div className="hidden grid-cols-[150px_1fr_130px_minmax(240px,340px)] gap-3 border-b px-2 py-2 text-[12.5px] text-muted-foreground md:grid print:grid print:grid-cols-[120px_1fr_120px_120px]">
                  <span>পিরিয়ড</span>
                  <span>গ্রুপ · বিষয়</span>
                  <span>অনুপস্থিত</span>
                  <span>প্রক্সি</span>
                </div>
                <ul className="m-0 list-none p-0">
                  {needs.map((n, i) => (
                    <li key={`${n.assignment.id}:${n.role}`} className="grid gap-1 border-b px-2 py-2.5 last:border-0 md:grid-cols-[150px_1fr_130px_minmax(240px,340px)] md:gap-3 print:grid-cols-[120px_1fr_120px_120px] print:gap-3">
                      <span className="whitespace-nowrap text-muted-foreground md:text-foreground print:text-foreground">{lines[i].period}</span>
                      <span>
                        <span className="font-medium">{lines[i].group}</span> · {lines[i].subject}
                      </span>
                      <span>
                        <span className="text-muted-foreground md:hidden print:hidden">অনুপস্থিত: </span>
                        {lines[i].absent}
                        {n.role === 'ta' && <span className="text-muted-foreground"> (সহকারী)</span>}
                      </span>
                      <span>
                        <span className="sv-print-only">{lines[i].proxy ?? '—'}</span>
                        <ProxyPicker date={date} need={n} day={day} weekday={weekday} names={names} monthCounts={monthCounts} current={chosen(n)?.proxyTeacherId ?? ''} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <MonthCounts day={day} />
        </>
      )}
    </>
  );
}

function ProxyPicker({ date, need, day, weekday, names, monthCounts, current }: { date: string; need: Need; day: Day; weekday: number; names: ReturnType<typeof lookup>; monthCounts: Map<string, number>; current: string }) {
  const { pending, run, line } = useAction();
  const [value, setValue] = useState(current);
  useEffect(() => setValue(current), [current]);
  const candidates = rankCandidates(need, { teachers: day.data.teachers, assignments: day.data.assignments, periods: day.data.periods, day: weekday, absences: day.absences, proxies: day.proxies, monthCounts, group: names.groups.get(need.assignment.groupId) });
  const label = (c: (typeof candidates)[number]) => `${c.teacher.shortName} — এ দিনে ${bn(c.today)}টি ক্লাস, এ মাসে ${bn(c.month)}টি প্রক্সি${c.atSchool ? '' : ' · এ বেলায় ক্লাস নেই'}`;
  const can = candidates.filter((c) => c.canTeach);
  const other = candidates.filter((c) => !c.canTeach);
  // A saved proxy who is no longer a candidate (their own routine changed) still shows.
  const stale = current && !candidates.some((c) => c.teacher.id === current) ? names.teachers.get(current) : undefined;
  return (
    <div className="flex flex-col gap-1 sv-no-print">
      <select
        className={cn(SELECT, 'w-full', !value && 'text-muted-foreground')}
        value={value}
        disabled={pending}
        aria-label="প্রক্সি শিক্ষক"
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          run(async () => {
            const result = await setProxyAction(date, need.assignment.id, need.role, next || null);
            // A refused choice goes back to the saved one.
            if (!result.ok) setValue(current);
            return result;
          });
        }}
      >
        <option value="">{candidates.length ? 'বাছাই করুন' : 'কেউ ফ্রি নেই'}</option>
        {stale && <option value={stale.id}>{stale.shortName}</option>}
        {can.length > 0 && (
          <optgroup label="এই বিষয় পড়ান">
            {can.map((c) => (
              <option key={c.teacher.id} value={c.teacher.id}>
                {label(c)}
              </option>
            ))}
          </optgroup>
        )}
        {other.length > 0 && (
          <optgroup label="বিষয়ের শিক্ষক নন">
            {other.map((c) => (
              <option key={c.teacher.id} value={c.teacher.id}>
                {label(c)}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      {line}
    </div>
  );
}

function Absences({ date, day }: { date: string; day: Day }) {
  const { data, absences } = day;
  const { pending, run, line } = useAction();
  const [teacherId, setTeacherId] = useState('');
  const [wholeDay, setWholeDay] = useState(true);
  const [periodIds, setPeriodIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const teacher = (id: string) => data.teachers.find((t) => t.id === id);
  const away = new Set(absences.map((a) => a.teacherId));
  const choices = data.teachers.filter((t) => t.active && !t.isVacancy && !away.has(t.id));
  return (
    <div className="flex flex-col gap-4">
      {absences.length > 0 && (
        <ul className="m-0 flex list-none flex-col divide-y rounded-lg border p-0 text-sm">
          {absences.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span>
                <Link href={`/admin/routine/teachers/${a.teacherId}`} className={cn(LINK, 'font-medium')}>
                  {teacher(a.teacherId)?.shortName}
                </Link>
                <span className="text-muted-foreground">
                  {' · '}
                  {a.periodIds
                    ? data.periods
                        .filter((p) => a.periodIds!.includes(p.id))
                        .map(periodText)
                        .join(', ')
                    : 'সারা দিন'}
                  {a.reason && ` · ${a.reason}`}
                </span>
              </span>
              <ConfirmButton confirm="তালিকা থেকে সরান" disabled={pending} onConfirm={() => run(() => deleteAbsenceAction(a.id))}>
                সরান
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () => saveAbsenceAction(date, teacherId, wholeDay ? null : periodIds, reason),
            () => {
              setTeacherId('');
              setPeriodIds([]);
              setReason('');
              setWholeDay(true);
            },
          );
        }}
      >
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
            শিক্ষক
            <select className={SELECT} value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
              <option value="">বাছাই করুন</option>
              {choices.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.shortName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
            কারণ (ঐচ্ছিক)
            <input className={INPUT} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="যেমন ছুটি" />
          </label>
          <label className="flex h-9 items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={wholeDay} onChange={(e) => setWholeDay(e.target.checked)} />
            সারা দিন
          </label>
          <Button type="submit" className="h-9" disabled={pending || !teacherId || (!wholeDay && !periodIds.length)}>
            যোগ করুন
          </Button>
        </div>
        {!wholeDay && (
          <fieldset className="m-0 flex flex-wrap gap-1.5 border-0 p-0">
            <legend className="mb-1.5 text-[13px] text-muted-foreground">যে পিরিয়ডগুলোতে থাকবেন না</legend>
            {data.periods.map((p) => (
              <label key={p.id} className={cn('flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-sm', periodIds.includes(p.id) ? 'border-primary bg-primary/5' : 'bg-white')}>
                <input type="checkbox" className="size-3.5 accent-primary" checked={periodIds.includes(p.id)} onChange={(e) => setPeriodIds(e.target.checked ? [...periodIds, p.id] : periodIds.filter((x) => x !== p.id))} />
                {periodText(p)}
              </label>
            ))}
          </fieldset>
        )}
        {line}
      </form>
    </div>
  );
}

function MonthCounts({ day }: { day: Day }) {
  const rows = Object.entries(day.monthCounts)
    .map(([id, n]) => ({ teacher: day.data.teachers.find((t) => t.id === id), n }))
    .filter((r) => r.teacher)
    .sort((a, b) => b.n - a.n || a.teacher!.shortName.localeCompare(b.teacher!.shortName));
  return (
    <Card title="এ মাসের প্রক্সি" className="sv-no-print">
      {rows.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">এ মাসে এখনো কোনো প্রক্সি নেই।</p>
      ) : (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-sm">
          {rows.map((r) => (
            <li key={r.teacher!.id} className="rounded-lg border bg-white px-3 py-1.5">
              {r.teacher!.shortName} <span className="tabular-nums text-muted-foreground">{bn(r.n)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <Button type="button" variant="outline" className={OUTLINE} onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}>
      <Copy aria-hidden />
      {copied ? 'কপি হয়েছে ✓' : 'WhatsApp-এর জন্য কপি'}
    </Button>
  );
}
