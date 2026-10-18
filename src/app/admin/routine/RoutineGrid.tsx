'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { Button } from '@/components/shadcn/button';
import { clashText, effectiveRoomId, findClashes, lookup, type Draft, type Lookup } from '@/lib/routine/clash';
import { DAY_SHORT, DAYS, daysText, periodText, periodTime } from '@/lib/routine/days';
import type { Assignment, Group, Period, RoutineData } from '@/lib/routine/types';
import { cn } from '@/lib/utils';
import { ReportTools } from '../reports/ReportTools';
import { deleteAssignmentAction, saveAssignmentAction } from './actions';
import { ConfirmButton, INPUT, OUTLINE, RoutineDialog, SELECT, StatusLine, useAction } from './controls';

// The school grid (docs/class-routine.md §5): one table per heading (জেনারেল, কুরআন, …), groups
// down, periods across. A heading shows only the periods its groups use, unless "সব পিরিয়ড" is on.

type Day = 'all' | number;

const byDays = (a: Assignment, b: Assignment) => Math.min(...a.days) - Math.min(...b.days);

export function RoutineGrid({ data }: { data: RoutineData }) {
  const [day, setDay] = useState<Day>('all');
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<{ groupId: string; periodId: string } | null>(null);
  const names = useMemo(() => lookup(data), [data]);

  const sections = useMemo(() => {
    const used = new Set(data.assignments.map((a) => a.groupId));
    const groups = data.groups.filter((g) => g.active || used.has(g.id));
    const headings = [...new Set(groups.map((g) => g.section))];
    return headings.map((heading) => {
      const rows = groups.filter((g) => g.section === heading);
      const ids = new Set(rows.map((g) => g.id));
      const usedPeriods = data.periods.filter((p) => data.assignments.some((a) => a.periodId === p.id && ids.has(a.groupId)));
      return { heading, rows, periods: showAll || !usedPeriods.length ? data.periods : usedPeriods };
    });
  }, [data, showAll]);

  const openGroup = open && names.groups.get(open.groupId);
  const openPeriod = open && data.periods.find((p) => p.id === open.periodId);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 sv-no-print">
        <div role="radiogroup" aria-label="দিন" className="inline-flex flex-wrap gap-0.5 rounded-lg bg-muted p-[3px]">
          {(['all', ...DAYS] as Day[]).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={day === d}
              onClick={() => setDay(d)}
              className={cn('h-[30px] rounded-md px-3 text-sm font-medium', day === d ? 'bg-white text-foreground shadow-[0_1px_2px_rgba(23,23,23,0.08)]' : 'text-muted-foreground hover:text-foreground')}
            >
              {d === 'all' ? 'সব দিন' : DAY_SHORT[d]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            সব পিরিয়ড দেখান
          </label>
          <ReportTools printLabel="প্রিন্ট (A3)" />
        </div>
      </div>
      <p className="sv-print-only m-0 text-sm">{day === 'all' ? 'সব দিন' : DAY_SHORT[day]}</p>

      {sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-2">
          {s.heading && <h2 className="m-0 text-[15px] font-semibold">{s.heading}</h2>}
          <div className="rt-scroll overflow-x-auto rounded-xl border bg-card">
            <table className="rt-grid w-full">
              <thead>
                <tr>
                  <th scope="col" className="text-left">
                    গ্রুপ
                  </th>
                  {s.periods.map((p) => (
                    <th key={p.id} scope="col" className="text-left">
                      {periodTime(p)}
                      {p.label && <div className="text-[11.5px] font-normal text-muted-foreground">{p.label}</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.rows.map((g) => (
                  <tr key={g.id}>
                    <th scope="row">
                      <Link href={`/admin/routine/groups/${g.id}${data.routine.status === 'active' ? '' : `?r=${data.routine.id}`}`} className="no-underline hover:underline">
                        {g.name}
                      </Link>
                      {g.defaultRoomId && <div className="text-[11.5px] font-normal text-muted-foreground">রুম {names.rooms.get(g.defaultRoomId)?.name}</div>}
                    </th>
                    {s.periods.map((p) => {
                      const cell = data.assignments.filter((a) => a.groupId === g.id && a.periodId === p.id && (day === 'all' || a.days.includes(day))).sort(byDays);
                      return (
                        <td key={p.id}>
                          <button type="button" className="rt-cell" onClick={() => setOpen({ groupId: g.id, periodId: p.id })} aria-label={`${g.name}, ${periodText(p)}: ${cell.length ? 'এডিট' : 'ক্লাস যোগ করুন'}`}>
                            {cell.length ? cell.map((a) => <Entry key={a.id} a={a} names={names} group={g} showDays={day === 'all'} />) : <span className="rt-add">+</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {openGroup && openPeriod && <CellEditor key={`${openGroup.id}:${openPeriod.id}`} data={data} names={names} group={openGroup} period={openPeriod} />}
      </Dialog>
    </>
  );
}

function Entry({ a, names, group, showDays }: { a: Assignment; names: Lookup; group: Group; showDays: boolean }) {
  const room = effectiveRoomId(a, names.groups);
  return (
    <span className="rt-entry">
      {showDays && a.days.length < DAYS.length && <span className="rt-days">{daysText(a.days)}</span>}
      <span className="font-medium">{names.subjects.get(a.subjectId)?.name}</span>
      <span>
        {names.teachers.get(a.teacherId)?.shortName}
        {a.taId && ` + ${names.teachers.get(a.taId)?.shortName}`}
      </span>
      {room && room !== group.defaultRoomId && <span className="rt-days">রুম {names.rooms.get(room)?.name}</span>}
      {a.note && <span className="rt-days">{a.note}</span>}
    </span>
  );
}

type Form = { id?: string; days: number[]; subjectId: string; teacherId: string; taId: string; roomId: string; note: string };

/** One cell: its classes (a cell may change by day) and the add / edit form. */
function CellEditor({ data, names, group, period }: { data: RoutineData; names: Lookup; group: Group; period: Period }) {
  const cell = data.assignments.filter((a) => a.groupId === group.id && a.periodId === period.id).sort(byDays);
  const freeDays = () => DAYS.filter((d) => !cell.some((a) => a.days.includes(d)));
  const blank = (): Form => ({ days: freeDays(), subjectId: '', teacherId: '', taId: '', roomId: '', note: '' });
  const [form, setForm] = useState<Form>(blank);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const { pending, run, line, warnings, clear } = useAction();
  const editing = form.id ? cell.find((a) => a.id === form.id) : undefined;

  const draft: Draft = { id: form.id, groupId: group.id, periodId: period.id, days: form.days, subjectId: form.subjectId, teacherId: form.teacherId, taId: form.taId || null, roomId: form.roomId || null, note: form.note };
  const clashes = form.teacherId && form.days.length ? findClashes(draft, data.assignments, names.groups, names.rooms) : [];

  /** Days (of those chosen) a teacher already has something in this period. */
  const busyDays = (teacherId: string) =>
    form.days.filter((d) => data.assignments.some((a) => a.id !== form.id && a.periodId === period.id && a.days.includes(d) && (a.teacherId === teacherId || a.taId === teacherId)));
  const usable = data.teachers.filter((t) => t.active || t.id === editing?.teacherId || t.id === editing?.taId);
  const teaches = usable.filter((t) => t.subjectIds.includes(form.subjectId));
  const others = usable.filter((t) => !t.subjectIds.includes(form.subjectId));
  const option = (t: (typeof usable)[number]) => {
    const busy = busyDays(t.id);
    return (
      <option key={t.id} value={t.id}>
        {t.shortName}
        {t.isVacancy ? ' (শূন্য পদ)' : ''}
        {busy.length ? ` — ব্যস্ত: ${daysText(busy)}` : ''}
      </option>
    );
  };
  const subjects = data.subjects.filter((s) => s.active || s.id === editing?.subjectId);
  const defaultRoom = group.defaultRoomId ? names.rooms.get(group.defaultRoomId)?.name : null;

  const save = (confirm: boolean) =>
    run(
      () => saveAssignmentAction(data.routine.id, { ...draft, id: form.id }, confirm),
      () => setForm({ days: DAYS.filter((d) => !cell.some((a) => a.id !== form.id && a.days.includes(d)) && !form.days.includes(d)), subjectId: '', teacherId: '', taId: '', roomId: '', note: '' }),
      'সেভ হয়েছে।',
    );

  return (
    <RoutineDialog>
      <DialogHeader>
        <DialogTitle className="text-lg">
          {group.name} · {periodText(period)}
        </DialogTitle>
        <DialogDescription>দিন অনুযায়ী বিষয় বা শিক্ষক বদলালে প্রতিটির জন্য আলাদা সারি যোগ করুন (যেমন রবি–মঙ্গল RA-1, বুধ–বৃহঃ Islam)।</DialogDescription>
      </DialogHeader>

      {cell.length > 0 && (
        <ul className="m-0 flex list-none flex-col divide-y rounded-lg border p-0">
          {cell.map((a) => (
            <li key={a.id} className={cn('flex flex-wrap items-center justify-between gap-2 px-3 py-2', a.id === form.id && 'bg-muted/60')}>
              <span className="flex flex-col">
                <span className="text-[12.5px] text-muted-foreground">{daysText(a.days)}</span>
                <span>
                  <span className="font-medium">{names.subjects.get(a.subjectId)?.name}</span> · {names.teachers.get(a.teacherId)?.shortName}
                  {a.taId && ` + ${names.teachers.get(a.taId)?.shortName} (সহকারী)`}
                </span>
              </span>
              <span className="inline-flex items-center gap-3">
                <button
                  type="button"
                  className="text-[13px] underline-offset-4 hover:underline"
                  onClick={() => {
                    clear();
                    setForm({ id: a.id, days: a.days, subjectId: a.subjectId, teacherId: a.teacherId, taId: a.taId ?? '', roomId: a.roomId ?? '', note: a.note });
                  }}
                >
                  এডিট
                </button>
                <ConfirmButton confirm="মুছুন" disabled={pending} onConfirm={() => run(() => deleteAssignmentAction(a.id), () => a.id === form.id && setForm(blank()))}>
                  মুছুন
                </ConfirmButton>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
      >
        <h3 className="m-0 text-[15px] font-semibold">{form.id ? 'সারি এডিট' : cell.length ? 'আরেকটি সারি যোগ করুন' : 'ক্লাস যোগ করুন'}</h3>
        <fieldset className="m-0 flex flex-wrap gap-1.5 border-0 p-0">
          <legend className="mb-1.5 text-[13px] text-muted-foreground">দিন</legend>
          {DAYS.map((d) => (
            <label key={d} className={cn('flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-sm', form.days.includes(d) ? 'border-primary bg-primary/5' : 'bg-white')}>
              <input type="checkbox" className="size-3.5 accent-primary" checked={form.days.includes(d)} onChange={(e) => set({ days: e.target.checked ? [...form.days, d].sort() : form.days.filter((x) => x !== d) })} />
              {DAY_SHORT[d]}
            </label>
          ))}
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
            বিষয়
            <select className={SELECT} value={form.subjectId} onChange={(e) => set({ subjectId: e.target.value })} required>
              <option value="">বাছাই করুন</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
            শিক্ষক
            <select className={SELECT} value={form.teacherId} onChange={(e) => set({ teacherId: e.target.value })} required>
              <option value="">বাছাই করুন</option>
              {form.subjectId ? (
                <>
                  <optgroup label="এই বিষয় পড়ান">{teaches.map(option)}</optgroup>
                  <optgroup label="অন্যরা">{others.map(option)}</optgroup>
                </>
              ) : (
                usable.map(option)
              )}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
            সহকারী (ঐচ্ছিক)
            <select className={SELECT} value={form.taId} onChange={(e) => set({ taId: e.target.value })}>
              <option value="">নেই</option>
              {usable.filter((t) => t.id !== form.teacherId).map(option)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
            রুম
            <select className={SELECT} value={form.roomId} onChange={(e) => set({ roomId: e.target.value })}>
              <option value="">{defaultRoom ? `গ্রুপের রুম (${defaultRoom})` : 'রুম নেই'}</option>
              {data.rooms
                .filter((r) => r.id !== group.defaultRoomId)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.shared ? ' (শেয়ার করা)' : ''}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-muted-foreground sm:col-span-2">
            নোট (ঐচ্ছিক)
            <input className={INPUT} value={form.note} onChange={(e) => set({ note: e.target.value })} maxLength={200} placeholder="যেমন Extra support" />
          </label>
        </div>

        {clashes.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
            {clashes.map((c, i) => (
              <li key={i}>{clashText(c, names)}</li>
            ))}
          </ul>
        )}
        {warnings.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-[13px] text-warning">
            {warnings.map((w, i) => (
              <p key={i} className="m-0">
                {w}
              </p>
            ))}
            <Button type="button" variant="outline" className={cn(OUTLINE, 'self-start text-foreground')} disabled={pending} onClick={() => save(true)}>
              তবুও সেভ করুন
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" className="h-9" disabled={pending || clashes.length > 0 || !form.days.length || !form.subjectId || !form.teacherId}>
            {form.id ? 'সেভ করুন' : 'যোগ করুন'}
          </Button>
          {form.id && (
            <Button
              type="button"
              variant="outline"
              className={OUTLINE}
              onClick={() => {
                clear();
                setForm(blank());
              }}
            >
              নতুন সারি
            </Button>
          )}
          {line}
          {!line && form.days.length === 0 && !form.id && <StatusLine message={{ ok: true, text: 'এই ঘরের সব দিন ভরা।' }} />}
        </div>
      </form>
    </RoutineDialog>
  );
}
