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
          <Field label="পুরো নাম" hint="ERP বা প্রোফাইলে যেমন আছে।">
            <input className={INPUT} value={d.fullName} onChange={(e) => set({ fullName: e.target.value })} required maxLength={120} />
          </Field>
          <Field label="ছোট নাম" hint={'রুটিনে এই নামটা দেখায়, যেমন "Mueen"।'}>
            <input className={INPUT} value={d.shortName} onChange={(e) => set({ shortName: e.target.value })} required maxLength={40} />
          </Field>
          <Field label="জেন্ডার" hint="যে গ্রুপে শুধু পুরুষ বা শুধু মহিলা টিচার পড়ান, তার জন্য।">
            <select className={SELECT} value={d.gender ?? ''} onChange={(e) => set({ gender: (e.target.value || null) as Draft['gender'] })}>
              {(d.isVacancy || !d.gender) && <option value="">এখনো জানা নেই (খালি পোস্ট)</option>}
              <option value="female">মহিলা</option>
              <option value="male">পুরুষ</option>
            </select>
          </Field>
          <Field label="মোবাইল">
            <input className={INPUT} value={d.phone} onChange={(e) => set({ phone: e.target.value })} maxLength={40} inputMode="tel" />
          </Field>
          <Field label="পদবি" hint="যেমন সহকারী শিক্ষক, সিনিয়র টিচার">
            <input className={INPUT} value={d.designation} onChange={(e) => set({ designation: e.target.value })} maxLength={80} />
          </Field>
          <Field label="ডিপার্টমেন্ট" hint="যেমন কুরআন, আরবি, জেনারেল">
            <input className={INPUT} value={d.department} onChange={(e) => set({ department: e.target.value })} maxLength={80} />
          </Field>
          <Field label="শিক্ষাগত যোগ্যতা" className="md:col-span-2">
            <input className={INPUT} value={d.qualification} onChange={(e) => set({ qualification: e.target.value })} maxLength={300} />
          </Field>
          <Field label="অভিজ্ঞতা (বছর)">
            <input className={INPUT} value={d.experienceYears} onChange={(e) => set({ experienceYears: e.target.value })} inputMode="decimal" />
          </Field>
          <Field label="ERP আইডি" hint="না দিলেও চলবে; জরিপের রিপোর্টের সাথে মেলাতে কাজে লাগে।">
            <input className={INPUT} value={d.erpId} onChange={(e) => set({ erpId: e.target.value })} maxLength={40} />
          </Field>
          <Field label="ছোট পরিচিতি" className="md:col-span-2">
            <textarea className={cn(INPUT, 'h-auto min-h-[88px] py-2')} value={d.bio} onChange={(e) => set({ bio: e.target.value })} maxLength={2000} />
          </Field>
        </div>
      </Card>

      <Card title="যে সাবজেক্টগুলো পড়াতে পারেন">
        {shownSubjects.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">আগে সেটআপ পেজে সাবজেক্ট যোগ করুন।</p>
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
          <Field label="সপ্তাহে কয়টা পিরিয়ড নেওয়ার কথা (টার্গেট)" hint="টিএ-র পিরিয়ড অর্ধেক ধরা হয়। দিনে ৩+১ (মেইন+টিএ) হলে সপ্তাহে (৩ + ½) × ৬ = ২১। টার্গেটের ৮০%-এর কম হলে ‘কম’, ১০০%-এর বেশি হলে ‘বেশি’।">
            <input className={INPUT} value={d.targetPeriods} onChange={(e) => set({ targetPeriods: e.target.value })} inputMode="numeric" />
          </Field>
          <Field label="মাসিক বেতন (টাকা)" hint="শুধু অ্যাডমিন পেজে দেখায়, প্রিন্টে আসে না।">
            <input className={INPUT} value={d.salary} onChange={(e) => set({ salary: e.target.value })} inputMode="numeric" />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={d.isVacancy} onChange={(e) => set({ isVacancy: e.target.checked })} />
            <span>
              <span className="font-medium">খালি পোস্ট</span>
              <span className="block text-[12.5px] text-muted-foreground">এখনো কাউকে নেওয়া হয়নি (যেমন &quot;Science-1&quot;)। রুটিনে বসানো যায়, প্রক্সিতে আসে না। নতুন টিচার এলে নাম বদলে এই টিক তুলে দিন।</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={d.active} onChange={(e) => set({ active: e.target.checked })} />
            <span>
              <span className="font-medium">চালু</span>
              <span className="block text-[12.5px] text-muted-foreground">বন্ধ থাকলে নতুন ক্লাস বা প্রক্সি দেওয়া যায় না (যেমন কেউ চলে গেলে)।</span>
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
        {badNumber && <span className="text-[13px] text-destructive">সংখ্যার ঘরে শুধু সংখ্যা দিন।</span>}
        {line}
        {teacher && (
          <span className="ml-auto">
            <ConfirmButton confirm="হ্যাঁ, টিচার ডিলিট করুন" disabled={pending} onConfirm={() => run(() => deleteTeacherAction(teacher.id), () => router.push('/admin/routine/teachers'))}>
              ডিলিট
            </ConfirmButton>
          </span>
        )}
      </div>
    </form>
  );
}
