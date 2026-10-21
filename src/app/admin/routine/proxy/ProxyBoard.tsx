'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, MessageCircle } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { proxyChoices } from '@/lib/routine/availability';
import { lookup } from '@/lib/routine/clash';
import type { ProxyDay } from '@/lib/routine/data';
import { dateText, dayOfDate, dhakaToday, overlaps, sameTime, spanText } from '@/lib/routine/days';
import { needsFor, proxyDayText, type Need } from '@/lib/routine/proxy';
import type { RoutineData, TimeSpan } from '@/lib/routine/types';
import { normaliseMobile, toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { ReportTools } from '../../reports/ReportTools';
import { Card, EmptyState } from '../../ui';
import { deleteAbsenceAction, saveAbsenceAction, setProxyAction } from '../actions';
import { ConfirmButton, DatePicker, INPUT, OUTLINE, SELECT, useAction, useUndo } from '../controls';
import { TeacherPicker } from '../TeacherPicker';

// The proxy screen (docs/class-routine.md §6): pick who is absent, their classes that day come up,
// tap a class and pick a proxy from the free teachers (green; the rest red with the reason).

type Day = ProxyDay & { data: RoutineData };
type Chosen = (n: Need) => { proxyTeacherId: string } | undefined;

export function ProxyBoard({ date, day }: { date: string; day: Day }) {
  const { data, absences, proxies } = day;
  const names = useMemo(() => lookup(data), [data]);
  const weekday = dayOfDate(date);
  const needs = weekday === null ? [] : needsFor(weekday, absences, data.assignments).sort((a, b) => byTime(a.assignment, b.assignment));
  const chosen: Chosen = (n) => proxies.find((p) => p.assignmentId === n.assignment.id && p.role === n.role);
  const lines = needs.map((n) => ({
    time: spanText(n.assignment),
    group: names.groups.get(n.assignment.groupId)?.name ?? '',
    subject: names.subjects.get(n.assignment.subjectId)?.name ?? '',
    absent: names.teachers.get(n.absentId)?.shortName ?? '',
    proxy: names.teachers.get(chosen(n)?.proxyTeacherId ?? '')?.shortName ?? null,
    role: n.role,
  }));
  // The undo toast lives here: covering a teacher's last class moves on to the next teacher.
  const undo = useUndo();
  const [selected, setSelected] = useState<string | null>(null);
  // The teacher on screen: the one picked, else the first absent teacher with a class still uncovered.
  const absentIds = absences.map((a) => a.teacherId);
  const current = selected && absentIds.includes(selected) ? selected : (needs.find((n) => !chosen(n))?.absentId ?? absentIds[0] ?? null);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 sv-no-print">
        <DatePicker date={date} />
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
          <Card title="কে আসেননি?" className="sv-no-print">
            <AbsentList date={date} day={day} needs={needs} chosen={chosen} current={current} onSelect={setSelected} />
          </Card>

          {current && <TeacherDay key={`${date}:${current}`} date={date} day={day} weekday={weekday} teacherId={current} needs={needs.filter((n) => n.absentId === current)} chosen={chosen} names={names} undo={undo} />}

          <Card title={`এ দিনের প্রক্সি · ${bn(lines.filter((l) => l.proxy).length)}/${bn(lines.length)} ঠিক হয়েছে`}>
            {lines.length === 0 ? (
              <p className="m-0 text-sm text-muted-foreground">এখনো কোনো প্রক্সি লাগবে না।</p>
            ) : (
              <ul className="m-0 flex list-none flex-col divide-y p-0 text-sm">
                {lines.map((l, i) => (
                  <li key={i} className="grid gap-1 py-2 sm:grid-cols-[150px_1fr_1fr] sm:gap-3 print:grid-cols-[150px_1fr_1fr] print:gap-3">
                    <span className="text-muted-foreground">{l.time}</span>
                    <span>
                      <span className="font-medium">{l.group}</span> · {l.subject}
                      {l.role === 'ta' && <span className="text-muted-foreground"> (টিএ)</span>}
                    </span>
                    <span>
                      {l.absent} → {l.proxy ? <span className="font-medium text-success">{l.proxy}</span> : <span className="text-warning">এখনো কেউ নেই</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <MonthCounts day={day} />
          {undo.node}
        </>
      )}
    </>
  );
}

/** The absent teachers as chips (with what is still uncovered), and adding one. */
function AbsentList({ date, day, needs, chosen, current, onSelect }: { date: string; day: Day; needs: Need[]; chosen: Chosen; current: string | null; onSelect: (id: string) => void }) {
  const { pending, run, line } = useAction();
  const { data, absences } = day;
  const away = new Set(absences.map((a) => a.teacherId));
  const choices = data.teachers.filter((t) => t.active && !t.isVacancy && !away.has(t.id));
  return (
    <div className="flex flex-col gap-3">
      {absences.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {absences.map((a) => {
            const mine = needs.filter((n) => n.absentId === a.teacherId);
            const left = mine.filter((n) => !chosen(n)).length;
            const on = a.teacherId === current;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSelect(a.teacherId)}
                  className={cn('flex min-h-11 flex-col items-start rounded-lg border bg-white px-3 py-1.5 text-left', on ? 'border-primary ring-2 ring-primary/25' : 'hover:border-input')}
                >
                  <span className="text-sm font-medium">{data.teachers.find((t) => t.id === a.teacherId)?.shortName}</span>
                  <span className={cn('text-[12px]', left ? 'text-warning' : 'text-success')}>
                    {!mine.length ? 'এ দিন কোনো ক্লাস নেই' : left ? `${bn(left)}টা ক্লাসে প্রক্সি লাগবে` : 'সব ক্লাসে প্রক্সি আছে'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
        {absences.length ? 'আর কেউ আসেননি?' : 'যিনি আসেননি তাঁকে সিলেক্ট করুন'}
        <select
          className={cn(SELECT, 'h-11 max-w-xs')}
          value=""
          disabled={pending}
          onChange={(e) => {
            const id = e.target.value;
            if (id) run(() => saveAbsenceAction(date, id, null, ''), () => onSelect(id));
          }}
        >
          <option value="">টিচার সিলেক্ট করুন</option>
          {choices.map((t) => (
            <option key={t.id} value={t.id}>
              {t.shortName}
            </option>
          ))}
        </select>
      </label>
      {line}
    </div>
  );
}

/** One absent teacher's classes that day: each opens the picker; a class they are in can be given back. */
function TeacherDay({ date, day, weekday, teacherId, needs, chosen, names, undo }: { date: string; day: Day; weekday: number; teacherId: string; needs: Need[]; chosen: Chosen; names: ReturnType<typeof lookup>; undo: ReturnType<typeof useUndo> }) {
  const { data, absences } = day;
  const absence = absences.find((a) => a.teacherId === teacherId)!;
  const teacher = names.teachers.get(teacherId);
  const { pending, run, line } = useAction();
  const [reason, setReason] = useState(absence.reason);
  useEffect(() => setReason(absence.reason), [absence.reason]);
  // Their classes that day, absent or not (a partial absence leaves some in).
  const theirs = data.assignments.filter((a) => a.days.includes(weekday) && (a.teacherId === teacherId || a.taId === teacherId)).sort(byTime);
  const keyOf = (n: Need) => `${n.assignment.id}:${n.role}`;
  const [open, setOpen] = useState<string | null>(() => {
    const first = needs.find((n) => !chosen(n));
    return first ? keyOf(first) : null;
  });
  const saveAbsence = (times: TimeSpan[] | null) => run(() => saveAbsenceAction(date, teacherId, times && unique(times), reason));

  // In for one class after all: the absence keeps the other times (none left: no absence).
  const present = (span: TimeSpan) => {
    const rest = (absence.times ?? theirs).filter((t) => !overlaps(t, span)).map(({ startsAt, endsAt }) => ({ startsAt, endsAt }));
    if (rest.length) saveAbsence(rest);
    else run(() => deleteAbsenceAction(absence.id));
  };

  const assign = (n: Need, next: string | null) => {
    const before = chosen(n)?.proxyTeacherId ?? null;
    run(
      () => setProxyAction(date, n.assignment.id, n.role, next),
      () => {
        undo.show(next ? `${names.teachers.get(next)?.shortName} প্রক্সি নেবেন` : 'প্রক্সি সরানো হয়েছে', () => run(() => setProxyAction(date, n.assignment.id, n.role, before)));
        // On to the next class that still needs someone.
        const rest = needs.filter((x) => keyOf(x) !== keyOf(n) && !chosen(x));
        setOpen(next ? (rest[0] ? keyOf(rest[0]) : null) : keyOf(n));
      },
    );
  };

  return (
    <Card
      title={`${teacher?.shortName ?? ''} ${date === dhakaToday() ? 'আজ' : 'এ দিন'} আসেননি`}
      className="sv-no-print"
      action={
        <ConfirmButton confirm="হ্যাঁ, তিনি এসেছেন" disabled={pending} onConfirm={() => run(() => deleteAbsenceAction(absence.id))}>
          অ্যাবসেন্ট বাতিল
        </ConfirmButton>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex max-w-sm flex-col gap-1 text-[13px] text-muted-foreground">
          কারণ (না দিলেও চলবে)
          <input className={INPUT} value={reason} maxLength={200} placeholder="যেমন ছুটি, অসুস্থ" onChange={(e) => setReason(e.target.value)} onBlur={() => reason !== absence.reason && saveAbsence(absence.times)} />
        </label>

        {theirs.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">এ দিন তাঁর কোনো ক্লাস নেই, প্রক্সি লাগবে না।</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {theirs.map((a) => {
              const role = a.teacherId === teacherId ? ('main' as const) : ('ta' as const);
              const n = needs.find((x) => x.assignment.id === a.id && x.role === role);
              const group = names.groups.get(a.groupId)?.name ?? '';
              const subject = names.subjects.get(a.subjectId)?.name ?? '';
              const head = (
                <span className="flex flex-col">
                  <span className="text-[12.5px] text-muted-foreground">{spanText(a)}</span>
                  <span className="text-[15px]">
                    <span className="font-semibold">{group}</span> · {subject}
                    {role === 'ta' && <span className="text-muted-foreground"> (টিএ হিসেবে)</span>}
                  </span>
                </span>
              );
              if (!n) {
                // A class of a partial absence that they are in.
                return (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed bg-white px-4 py-3">
                    {head}
                    <span className="flex items-center gap-3 text-[13px] text-muted-foreground">
                      এ ক্লাসে আছেন
                      <button type="button" disabled={pending} className="font-medium text-foreground underline underline-offset-4" onClick={() => saveAbsence([...(absence.times ?? []), { startsAt: a.startsAt, endsAt: a.endsAt }])}>
                        এ ক্লাসেও নেই
                      </button>
                    </span>
                  </li>
                );
              }
              const proxy = names.teachers.get(chosen(n)?.proxyTeacherId ?? '');
              const isOpen = open === keyOf(n);
              return (
                <li key={a.id} className={cn('rounded-xl border bg-white', isOpen ? 'border-primary/40 shadow-sm' : proxy ? 'border-success/35' : 'border-warning/40')}>
                  <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : keyOf(n))} className="flex min-h-14 w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left">
                    {head}
                    {proxy ? (
                      <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">প্রক্সি: {proxy.shortName}</span>
                    ) : (
                      <span className="rounded-full bg-warning/10 px-3 py-1 text-sm font-medium text-warning">প্রক্সি লাগবে</span>
                    )}
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-3 border-t px-4 py-3">
                      <TeacherPicker
                        choices={proxyChoices(n, {
                          teachers: data.teachers,
                          assignments: data.assignments,
                          day: weekday,
                          absences: day.absences,
                          proxies: day.proxies,
                          monthCounts: new Map(Object.entries(day.monthCounts)),
                          groups: names.groups,
                          today: date === dhakaToday(),
                        })}
                        subjectName={subject}
                        selected={proxy?.id}
                        disabled={pending}
                        onPick={(id) => assign(n, id === proxy?.id ? null : id)}
                      />
                      <div className="flex flex-wrap items-center gap-4 text-[13px]">
                        {proxy ? (
                          <>
                            <a href={whatsApp(proxy.phone, proxyMessage(date, a, group, subject, teacher?.shortName ?? ''))} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-success underline-offset-4 hover:underline">
                              <MessageCircle aria-hidden className="size-4" />
                              {proxy.shortName}-কে WhatsApp করুন
                            </a>
                            <button type="button" disabled={pending} className="text-destructive underline-offset-4 hover:underline" onClick={() => assign(n, null)}>
                              প্রক্সি সরান
                            </button>
                          </>
                        ) : (
                          <button type="button" disabled={pending} className="text-muted-foreground underline-offset-4 hover:underline" onClick={() => present(a)}>
                            এ ক্লাসে আছেন (প্রক্সি লাগবে না)
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {line}
      </div>
    </Card>
  );
}

/** A WhatsApp link: to the teacher's number when there is one, else WhatsApp asks whom to send it to. */
function whatsApp(phone: string, text: string) {
  return `https://wa.me/${normaliseMobile(phone) ?? ''}?text=${encodeURIComponent(text)}`;
}

const byTime = (a: TimeSpan, b: TimeSpan) => a.startsAt - b.startsAt || a.endsAt - b.endsAt;
const unique = (times: TimeSpan[]) => times.filter((t, i) => times.findIndex((x) => sameTime(x, t)) === i);

function proxyMessage(date: string, time: TimeSpan, group: string, subject: string, absent: string) {
  const when = date === dhakaToday() ? 'আজ' : dateText(date);
  return `আসসালামু আলাইকুম। ${when} ${spanText(time)} ${group}-এ ${absent}-এর ${subject} ক্লাসটা আপনি নেবেন, ইনশাআল্লাহ। জাযাকাল্লাহু খাইরান।`;
}

function MonthCounts({ day }: { day: Day }) {
  const rows = Object.entries(day.monthCounts)
    .map(([id, n]) => ({ teacher: day.data.teachers.find((t) => t.id === id), n }))
    .filter((r) => r.teacher)
    .sort((a, b) => b.n - a.n || a.teacher!.shortName.localeCompare(b.teacher!.shortName));
  return (
    <Card title="এ মাসে কে কয়টা প্রক্সি নিয়েছেন" className="sv-no-print">
      {rows.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">এ মাসে এখনো কোনো প্রক্সি হয়নি।</p>
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

export function CopyText({ text, label = 'পুরো লিস্ট WhatsApp-এর জন্য কপি' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <Button type="button" variant="outline" className={OUTLINE} onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}>
      <Copy aria-hidden />
      {copied ? 'কপি হয়েছে ✓' : label}
    </Button>
  );
}
