'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Load } from '@/lib/routine/load';
import { subjectLabels, subjectsByType } from '@/lib/routine/subjects';
import type { RoutineData } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { Avatar, LoadBadge, LoadLine } from './ui';

/**
 * "সাবজেক্টের টিচার" beside the routine (docs/class-routine.md §5): the active subjects of a type,
 * each with its teachers and their week; tapping a teacher shows their lessons in the routine.
 */
export function SubjectTeachers({ data, loads, picked, onPick, onClose }: { data: RoutineData; loads: Map<string, Load>; picked: string; onPick: (teacherId: string) => void; onClose: () => void }) {
  const grouped = useMemo(() => subjectsByType(data), [data]);
  const labels = useMemo(() => subjectLabels(data.subjects, data.types), [data.subjects, data.types]);
  const [typeId, setTypeId] = useState('');
  const [q, setQ] = useState('');
  // undefined: the first subject shown is open.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);
  const needle = q.trim().toLowerCase();
  const shown = grouped
    .filter((g) => !typeId || g.type.id === typeId)
    .flatMap((g) => g.subjects)
    .flatMap((s) => {
      if (!needle || labels.get(s.subject.id)!.toLowerCase().includes(needle)) return [s];
      const teachers = s.teachers.filter((t) => t.shortName.toLowerCase().includes(needle) || t.fullName.toLowerCase().includes(needle));
      return teachers.length ? [{ ...s, teachers }] : [];
    });
  const open = openId === undefined ? shown[0]?.subject.id : openId;
  const PILL = 'rounded-full border px-2.5 py-1 text-[12.5px]';

  return (
    <aside aria-label="সাবজেক্টের টিচার" className="sv-no-print fixed inset-0 z-40 flex flex-col gap-3.5 overflow-y-auto bg-[#fcfbfa] p-5 lg:sticky lg:inset-auto lg:top-4 lg:z-auto lg:max-h-[calc(100dvh-2rem)] lg:w-[340px] lg:shrink-0 lg:rounded-xl lg:border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-semibold">সাবজেক্টের টিচার</h2>
          <p className="m-0 mt-1 text-[12.5px] text-muted-foreground">নামে চাপ দিলে রুটিনে ওনার ক্লাসগুলো দেখাবে।</p>
        </div>
        <button type="button" aria-label="বন্ধ করুন" onClick={onClose} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <label className="flex h-9 items-center gap-2 rounded-lg border bg-white px-2.5 text-sm text-muted-foreground">
        <Search aria-hidden className="size-4 shrink-0" />
        <input
          type="search"
          value={q}
          onChange={(e) => (setQ(e.target.value), setOpenId(undefined))}
          placeholder="সাবজেক্ট বা টিচার খুঁজুন"
          aria-label="সাবজেক্ট বা টিচার খুঁজুন"
          className="min-w-0 flex-1 bg-transparent text-foreground outline-none"
        />
      </label>
      <div role="group" aria-label="ধরন" className="flex flex-wrap gap-1.5">
        {[{ id: '', name: 'সব' }, ...grouped.map((g) => g.type)].map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={typeId === t.id}
            onClick={() => (setTypeId(t.id), setOpenId(undefined))}
            className={cn(PILL, typeId === t.id ? 'border-foreground bg-foreground font-semibold text-background' : 'bg-white text-[#44403c] hover:border-input')}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="flex flex-col border-b">
        {shown.map((s) => {
          const expanded = open === s.subject.id;
          return (
            <div key={s.subject.id} className="border-t">
              <button type="button" aria-expanded={expanded} onClick={() => setOpenId(expanded ? null : s.subject.id)} className="flex w-full items-baseline justify-between gap-3 py-2.5 text-left text-sm font-semibold">
                <span>
                  <span aria-hidden>{expanded ? '▾ ' : '▸ '}</span>
                  {typeId ? s.subject.name : labels.get(s.subject.id)}
                </span>
                {s.teachers.length ? (
                  <span className="whitespace-nowrap text-[12.5px] font-normal text-muted-foreground">
                    {bn(s.teachers.length)} জন · সপ্তাহে {bn(s.lessons)}টা ক্লাস
                  </span>
                ) : (
                  <span className="whitespace-nowrap text-[12.5px] text-[#9a3412]">কোনো টিচার নেই</span>
                )}
              </button>
              {expanded && s.teachers.length > 0 && (
                <div className="flex flex-col gap-1.5 pb-3">
                  {s.teachers.map((t) => {
                    const load = loads.get(t.id)!;
                    const on = picked === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onPick(t.id)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-[10px] border bg-white px-2.5 py-2 text-left hover:border-input',
                          t.isVacancy && 'border-dashed border-[#a8a29e]',
                          on && 'border-foreground shadow-[inset_0_0_0_1px_var(--foreground)] hover:border-foreground',
                        )}
                      >
                        <Avatar name={t.shortName} vacancy={t.isVacancy} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-1.5 text-[13.5px] font-semibold">
                            <span className="truncate">{t.shortName}</span>
                            {t.isVacancy && <span className="whitespace-nowrap text-[12px] font-normal text-muted-foreground">খালি পোস্ট</span>}
                          </span>
                          <span className="mt-1 block">
                            <LoadLine load={load} />
                          </span>
                        </span>
                        {!t.isVacancy && <LoadBadge status={load.status} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {!shown.length && <p className="m-0 border-t py-3 text-sm text-muted-foreground">কিছু পাওয়া যায়নি।</p>}
      </div>
      <Link href="/admin/routine/teachers" className="mt-auto text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        টিচার পেজে সবাইকে দেখুন →
      </Link>
    </aside>
  );
}
