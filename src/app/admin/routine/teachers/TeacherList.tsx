'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import type { Load } from '@/lib/routine/load';
import type { ClassType, Subject, Teacher } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { LINK } from '../../ui';
import { deleteTeacherAction, teacherFootprintAction } from '../actions';
import { INPUT, OUTLINE, RoutineDialog, Segmented, useAction, useUndo } from '../controls';
import { LoadBadge } from '../ui';
import { TeacherPanel } from './TeacherForm';

// The teacher list (docs/class-routine.md §4): search by name or subject, filter by load, edit in
// the side panel, delete with a confirm that lists the classes it takes with it. A teacher with
// absences or proxies on record is hidden instead ("সরান"), so the register keeps their name.

type Filter = 'all' | 'over' | 'under' | 'vacancy';
type Confirm = { teacher: Teacher; lessons: number; taLessons: number; history: boolean };

export function TeacherList({ teachers, subjects, types, loads, lessonsOf, showAll, start }: { teachers: Teacher[]; subjects: Subject[]; types: ClassType[]; loads: Record<string, Load> | null; lessonsOf: Record<string, string[]>; showAll: boolean; start: string | null }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [panel, setPanel] = useState<{ teacher: Teacher | null } | null>(() => {
    const asked = start && start !== 'new' ? teachers.find((t) => t.id === start) : undefined;
    return start === 'new' ? { teacher: null } : asked ? { teacher: asked } : null;
  });
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const { pending, run, line } = useAction();
  const { show, node: toast } = useUndo();
  // A name in two types (Islam) says which.
  const twice = new Set(subjects.filter((s, i) => subjects.findIndex((x) => x.name === s.name) !== i).map((s) => s.name));
  const subjectName = new Map(subjects.map((s) => [s.id, twice.has(s.name) ? `${s.name} (${types.find((t) => t.id === s.typeId)?.name ?? ''})` : s.name]));
  const needle = q.trim().toLowerCase();
  const shown = teachers.filter((t) => {
    if (!showAll && !t.active) return false;
    const load = loads?.[t.id];
    if (filter === 'vacancy' && !t.isVacancy) return false;
    if (filter === 'over' && load?.status !== 'over') return false;
    if (filter === 'under' && load?.status !== 'under') return false;
    return !needle || t.shortName.toLowerCase().includes(needle) || t.fullName.toLowerCase().includes(needle) || t.subjectIds.some((id) => subjectName.get(id)?.toLowerCase().startsWith(needle));
  });
  const hidden = teachers.filter((t) => !t.active).length;
  const vacancies = teachers.filter((t) => t.active && t.isVacancy).length;
  const closePanel = () => {
    setPanel(null);
    if (start) router.replace(`/admin/routine/teachers${showAll ? '?show=all' : ''}`);
  };
  const ask = (t: Teacher) =>
    run(async () => {
      const footprint = await teacherFootprintAction(t.id);
      if (!footprint) return { ok: false, error: 'টিচার পাওয়া যায়নি। পেজটা রিলোড করুন।' };
      setConfirm({ teacher: t, ...footprint });
      return { ok: true };
    });
  const remove = (c: Confirm) =>
    run(
      () => deleteTeacherAction(c.teacher.id),
      () => {
        setConfirm(null);
        show(c.history ? `${c.teacher.shortName}-কে সরানো হয়েছে` : `${c.teacher.shortName}${c.lessons ? ` আর ${bn(c.lessons)}টা ক্লাস` : ''} ডিলিট হয়েছে`);
      },
    );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-2xl font-semibold tracking-[-0.01em]">টিচার</h1>
          <p className="m-0 text-sm text-muted-foreground">
            {bn(teachers.filter((t) => t.active && !t.isVacancy).length)} জন টিচার{vacancies > 0 && ` · ${bn(vacancies)}টা খালি পোস্ট`}
          </p>
        </div>
        <Button type="button" className="h-9" onClick={() => setPanel({ teacher: null })}>
          <Plus aria-hidden /> নতুন টিচার
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex items-center">
          <Search aria-hidden className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
          <input className={cn(INPUT, 'w-64 pl-8')} value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম বা সাবজেক্ট খুঁজুন" aria-label="নাম বা সাবজেক্ট খুঁজুন" />
        </label>
        <Segmented
          label="ফিল্টার"
          value={filter}
          options={[
            ['all', 'সবাই'],
            ['over', 'বেশি'],
            ['under', 'কম'],
            ['vacancy', 'খালি পোস্ট'],
          ]}
          onChange={setFilter}
        />
        {line}
      </div>

      {shown.length === 0 ? (
        <p className="m-0 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {teachers.length === 0 ? 'এখনো কোনো টিচার যোগ করা হয়নি।' : 'এই খোঁজে কোনো টিচার নেই।'}{' '}
          {(q || filter !== 'all') && (
            <button type="button" className="text-foreground underline underline-offset-4" onClick={() => (setQ(''), setFilter('all'))}>
              খোঁজ মুছুন
            </button>
          )}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b">
                {['নাম', 'সাবজেক্ট', 'সপ্তাহে ক্লাস', 'ওয়ার্কলোড', ''].map((h, i) => (
                  <th key={i} className={cn('px-3 py-2.5 text-left text-[12.5px] font-medium text-muted-foreground', i === 4 && 'text-right')}>
                    {h || <span className="sr-only">অ্যাকশন</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((t) => {
                const load = loads?.[t.id];
                return (
                  <tr key={t.id} className={cn('border-b last:border-0', !t.active && 'text-muted-foreground')}>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-[#57534e]', t.isVacancy ? 'border border-dashed border-[#a8a29e] bg-white' : 'bg-[#efe9e3]')}>
                          {t.shortName.charAt(0)}
                        </span>
                        <span className="flex flex-col">
                          <Link href={`/admin/routine/teachers/${t.id}`} className={cn(LINK, 'font-medium')}>
                            {t.shortName}
                          </Link>
                          <span className="text-[12.5px] text-muted-foreground">
                            {t.fullName !== t.shortName && t.fullName}
                            {t.isVacancy && ' · খালি পোস্ট'}
                            {!t.active && ' · সরানো'}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex flex-wrap gap-1">
                        {t.subjectIds.map((id) => subjectName.get(id)).filter(Boolean).map((s, i) => (
                          <span key={i} className="rounded bg-muted px-1.5 py-px text-[12px]">
                            {s}
                          </span>
                        ))}
                        {!t.subjectIds.length && '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {load ? `মেইন ${bn(load.main)}${load.ta ? ` · টিএ ${bn(load.ta)}` : ''}${load.target != null ? ` / ${bn(load.target)}` : ''}` : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {load ? (
                        <span className="inline-flex items-center gap-1.5">
                          <LoadBadge status={load.status} />
                          {load.percent != null && <span className="text-[12.5px] tabular-nums text-muted-foreground">{bn(Math.round(load.percent * 100))}%</span>}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <Button type="button" variant="outline" className={cn(OUTLINE, 'h-8')} onClick={() => setPanel({ teacher: t })} aria-label={`${t.shortName} এডিট`}>
                          <Pencil aria-hidden /> এডিট
                        </Button>
                        {t.active && (
                          <button type="button" disabled={pending} onClick={() => ask(t)} aria-label={`${t.shortName} ডিলিট`} className="inline-flex size-8 items-center justify-center rounded-md border bg-white text-destructive hover:bg-destructive/5 disabled:opacity-50">
                            <Trash2 aria-hidden className="size-4" />
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {(hidden > 0 || showAll) && (
        <Link href={showAll ? '/admin/routine/teachers' : '/admin/routine/teachers?show=all'} className={cn(LINK, 'self-start text-sm')}>
          {showAll ? 'শুধু চালু টিচারদের দেখুন' : `সরানো ${bn(hidden)} জনকেও দেখুন`}
        </Link>
      )}

      <Dialog open={!!panel} onOpenChange={(o) => !o && closePanel()}>
        {panel && (
          <TeacherPanel
            teacher={panel.teacher}
            subjects={subjects}
            types={types}
            onDone={(text) => {
              closePanel();
              show(text);
            }}
          />
        )}
      </Dialog>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        {confirm && <ConfirmDelete c={confirm} lessons={lessonsOf[confirm.teacher.id] ?? []} pending={pending} onConfirm={() => remove(confirm)} onCancel={() => setConfirm(null)} />}
      </Dialog>
      {toast}
    </>
  );
}

function ConfirmDelete({ c, lessons, pending, onConfirm, onCancel }: { c: Confirm; lessons: string[]; pending: boolean; onConfirm: () => void; onCancel: () => void }) {
  const name = c.teacher.shortName;
  const n = c.lessons;
  // Lessons in other versions than the active one count too (they are deleted as well).
  const elsewhere = Math.max(0, n - lessons.length);
  return (
    <RoutineDialog className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{c.history ? `${name}-কে লিস্ট থেকে সরাবেন?` : `${name}-কে ডিলিট করবেন?`}</DialogTitle>
        <DialogDescription>
          {c.history
            ? `${name}-এর অ্যাবসেন্ট বা প্রক্সির হিসাব আছে, তাই পুরো ডিলিট হবে না: লিস্ট আর রুটিন থেকে লুকানো হবে, পুরোনো হিসাব থাকবে।${n ? ` রুটিনের এই ${bn(n)}টা ক্লাস ডিলিট হবে:` : ''}`
            : n
              ? `রুটিন থেকে ওনার এই ${bn(n)}টা ক্লাসও ডিলিট হবে:`
              : 'রুটিনে ওনার কোনো ক্লাস নেই।'}
        </DialogDescription>
      </DialogHeader>
      {n > 0 && (
        <ul className="m-0 flex max-h-56 list-none flex-col gap-1 overflow-y-auto rounded-lg border bg-muted/40 p-3 text-[13px]">
          {lessons.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
          {elsewhere > 0 && <li className="text-muted-foreground">অন্য ভার্সনে আরও {bn(elsewhere)}টা</li>}
        </ul>
      )}
      {c.taLessons > 0 && <p className="m-0 text-[13px] text-muted-foreground">যে {bn(c.taLessons)}টা ক্লাসে টিএ, সেগুলো থাকবে, শুধু টিএ খালি হবে।</p>}
      <DialogFooter>
        <Button type="button" variant="outline" className={OUTLINE} onClick={onCancel}>
          বাতিল
        </Button>
        <Button type="button" variant="destructive" className="h-9" disabled={pending} onClick={onConfirm}>
          {c.history ? 'সরান' : n ? `টিচার আর ${bn(n)}টা ক্লাস ডিলিট` : 'ডিলিট'}
        </Button>
      </DialogFooter>
    </RoutineDialog>
  );
}
