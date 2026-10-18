'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/shadcn/button';
import type { Subject, Teacher } from '@/lib/routine/types';
import { toAsciiDigits } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { deleteTeacherAction, saveTeacherAction } from '../actions';
import { ConfirmButton, INPUT, SELECT, useAction } from '../controls';
import { Card } from '../../ui';

type Draft = Omit<Teacher, 'id' | 'experienceYears' | 'salary' | 'targetPeriods' | 'erpId'> & { experienceYears: string; salary: string; targetPeriods: string; erpId: string };

const num = (value: string) => {
  const v = toAsciiDigits(value).replace(/[,\s]/g, '');
  return v === '' ? null : Number(v);
};

function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-sm', className)}>
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-[12.5px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TeacherForm({ teacher, subjects }: { teacher: Teacher | null; subjects: Subject[] }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>({
    fullName: teacher?.fullName ?? '',
    shortName: teacher?.shortName ?? '',
    gender: teacher?.gender ?? 'female',
    designation: teacher?.designation ?? '',
    department: teacher?.department ?? '',
    qualification: teacher?.qualification ?? '',
    experienceYears: teacher?.experienceYears?.toString() ?? '',
    phone: teacher?.phone ?? '',
    salary: teacher?.salary?.toString() ?? '',
    targetPeriods: teacher?.targetPeriods?.toString() ?? '',
    bio: teacher?.bio ?? '',
    erpId: teacher?.erpId ?? '',
    isVacancy: teacher?.isVacancy ?? false,
    active: teacher?.active ?? true,
    subjectIds: teacher?.subjectIds ?? [],
  });
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const { pending, run, line } = useAction();
  const numbers = { experienceYears: num(d.experienceYears), salary: num(d.salary), targetPeriods: num(d.targetPeriods) };
  const badNumber = Object.values(numbers).some((n) => n !== null && (!Number.isFinite(n) || n < 0));
  const shownSubjects = subjects.filter((s) => s.active || d.subjectIds.includes(s.id));

  const save = () =>
    run(
      () => saveTeacherAction({ ...d, ...numbers, salary: numbers.salary === null ? null : Math.round(numbers.salary), targetPeriods: numbers.targetPeriods === null ? null : Math.round(numbers.targetPeriods), erpId: d.erpId.trim() || null, id: teacher?.id }),
      (r) => router.push(`/admin/routine/teachers/${r.id ?? teacher?.id}`),
    );

  return (
    <form
      className="flex flex-col gap-4 md:gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Card title="পরিচয়">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="পূর্ণ নাম" hint="প্রোফাইলের মতো, বাংলায়।">
            <input className={INPUT} value={d.fullName} onChange={(e) => set({ fullName: e.target.value })} required maxLength={120} />
          </Field>
          <Field label="ছোট নাম" hint={'রুটিনে এই নাম দেখায়, যেমন "Mueen"।'}>
            <input className={INPUT} value={d.shortName} onChange={(e) => set({ shortName: e.target.value })} required maxLength={40} />
          </Field>
          <Field label="লিঙ্গ" hint="ছেলে/মেয়েদের গ্রুপের নিয়মের জন্য।">
            <select className={SELECT} value={d.gender} onChange={(e) => set({ gender: e.target.value as Draft['gender'] })}>
              <option value="female">মহিলা</option>
              <option value="male">পুরুষ</option>
            </select>
          </Field>
          <Field label="মোবাইল">
            <input className={INPUT} value={d.phone} onChange={(e) => set({ phone: e.target.value })} maxLength={40} inputMode="tel" />
          </Field>
          <Field label="পদবী" hint="যেমন সহকারী শিক্ষক">
            <input className={INPUT} value={d.designation} onChange={(e) => set({ designation: e.target.value })} maxLength={80} />
          </Field>
          <Field label="বিভাগ" hint="যেমন কুরআন, আরবী, জেনারেল">
            <input className={INPUT} value={d.department} onChange={(e) => set({ department: e.target.value })} maxLength={80} />
          </Field>
          <Field label="শিক্ষাগত যোগ্যতা" className="md:col-span-2">
            <input className={INPUT} value={d.qualification} onChange={(e) => set({ qualification: e.target.value })} maxLength={300} />
          </Field>
          <Field label="অভিজ্ঞতা (বছর)">
            <input className={INPUT} value={d.experienceYears} onChange={(e) => set({ experienceYears: e.target.value })} inputMode="decimal" />
          </Field>
          <Field label="ERP আইডি" hint="ঐচ্ছিক; জরিপের শিক্ষকের সাথে মেলাতে।">
            <input className={INPUT} value={d.erpId} onChange={(e) => set({ erpId: e.target.value })} maxLength={40} />
          </Field>
          <Field label="সংক্ষিপ্ত পরিচিতি" className="md:col-span-2">
            <textarea className={cn(INPUT, 'h-auto min-h-[88px] py-2')} value={d.bio} onChange={(e) => set({ bio: e.target.value })} maxLength={2000} />
          </Field>
        </div>
      </Card>

      <Card title="যে বিষয়গুলো পড়াতে পারেন">
        {shownSubjects.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">আগে সেটআপ পেজে বিষয় যোগ করুন।</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {shownSubjects.map((s) => (
              <label key={s.id} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={d.subjectIds.includes(s.id)}
                  onChange={(e) => set({ subjectIds: e.target.checked ? [...d.subjectIds, s.id] : d.subjectIds.filter((x) => x !== s.id) })}
                />
                {s.name}
              </label>
            ))}
          </div>
        )}
      </Card>

      <Card title="কাজ ও বেতন">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="সপ্তাহে যত পিরিয়ড নেওয়ার কথা" hint="এর ৮০%-এর কম হলে ‘কম’, বেশি হলে ‘বেশি’। সহকারী হিসেবে একটি পিরিয়ড অর্ধেক ধরা হয়।">
            <input className={INPUT} value={d.targetPeriods} onChange={(e) => set({ targetPeriods: e.target.value })} inputMode="numeric" />
          </Field>
          <Field label="মাসিক বেতন (টাকা)" hint="শুধু অ্যাডমিন পেজে দেখায়; প্রিন্টে নয়।">
            <input className={INPUT} value={d.salary} onChange={(e) => set({ salary: e.target.value })} inputMode="numeric" />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={d.isVacancy} onChange={(e) => set({ isVacancy: e.target.checked })} />
            <span>
              <span className="font-medium">শূন্য পদ</span>
              <span className="block text-[12.5px] text-muted-foreground">এখনো নিয়োগ হয়নি (যেমন &quot;Science-1&quot;)। রুটিনে বসানো যায়, প্রক্সিতে আসে না। নিয়োগ হলে নাম বদলে এটি তুলে দিন।</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={d.active} onChange={(e) => set({ active: e.target.checked })} />
            <span>
              <span className="font-medium">সক্রিয়</span>
              <span className="block text-[12.5px] text-muted-foreground">নিষ্ক্রিয় শিক্ষককে নতুন ক্লাস বা প্রক্সি দেওয়া যায় না।</span>
            </span>
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="h-9" disabled={pending || badNumber || !d.fullName.trim() || !d.shortName.trim()}>
          সেভ করুন
        </Button>
        <Button type="button" variant="outline" className="h-9 bg-white shadow-none" onClick={() => router.back()}>
          বাতিল
        </Button>
        {badNumber && <span className="text-[13px] text-destructive">সংখ্যার ঘরে শুধু সংখ্যা লিখুন।</span>}
        {line}
        {teacher && (
          <span className="ml-auto">
            <ConfirmButton confirm="শিক্ষক মুছে ফেলুন" disabled={pending} onConfirm={() => run(() => deleteTeacherAction(teacher.id), () => router.push('/admin/routine/teachers'))}>
              মুছে ফেলুন
            </ConfirmButton>
          </span>
        )}
      </div>
    </form>
  );
}
