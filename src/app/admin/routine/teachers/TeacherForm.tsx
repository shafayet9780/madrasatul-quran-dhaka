'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/shadcn/button';
import type { ClassType, Subject, Teacher } from '@/lib/routine/types';
import { toAsciiDigits } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { saveTeacherAction } from '../actions';
import { Chips, INPUT, SidePanel, useAction } from '../controls';

// A teacher's details in the side panel (new or edit): what the routine needs first, the rest folded.

type Draft = Omit<Teacher, 'id' | 'experienceYears' | 'salary' | 'targetPeriods' | 'erpId'> & { experienceYears: string; salary: string; targetPeriods: string; erpId: string };

const num = (value: string) => {
  const v = toAsciiDigits(value).replace(/[,\s৳]/g, '');
  return v === '' ? null : Number(v);
};

function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-[13px]', className)}>
      <span className="font-semibold">{label}</span>
      {children}
      {hint && <span className="text-[12.5px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TeacherPanel({ teacher, subjects, types, onDone }: { teacher: Teacher | null; subjects: Subject[]; types: ClassType[]; onDone: (text: string, id?: string) => void }) {
  const [d, setD] = useState<Draft>({
    fullName: teacher?.fullName ?? '',
    shortName: teacher?.shortName ?? '',
    // A new teacher's gender is chosen, not assumed (the gender rules depend on it).
    gender: teacher ? teacher.gender : null,
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
  // The same limits the server checks.
  const LIMITS = { experienceYears: [80, 'অভিজ্ঞতা'], salary: [10_000_000, 'বেতন'], targetPeriods: [80, 'টার্গেট'] } as const;
  const bad = (Object.keys(numbers) as (keyof typeof numbers)[]).find((k) => {
    const n = numbers[k];
    return n !== null && (!Number.isFinite(n) || n < 0 || n > LIMITS[k][0]);
  });
  const badNumber = !!bad;
  const noGender = !d.gender && !d.isVacancy;
  const byType = types.map((t) => ({ type: t, list: subjects.filter((s) => s.typeId === t.id && (s.active || d.subjectIds.includes(s.id))) })).filter((g) => g.list.length);

  const save = () =>
    run(
      () =>
        saveTeacherAction({
          ...d,
          ...numbers,
          fullName: d.fullName.trim() || d.shortName.trim(),
          salary: numbers.salary === null ? null : Math.round(numbers.salary),
          targetPeriods: numbers.targetPeriods === null ? null : Math.round(numbers.targetPeriods),
          erpId: d.erpId.trim() || null,
          id: teacher?.id,
        }),
      (r) => onDone(`${d.shortName.trim()} সেভ হয়েছে`, r.id),
    );

  return (
    <SidePanel
      title={teacher ? `${teacher.shortName} · এডিট` : 'নতুন টিচার'}
      footer={
        <>
          {bad && <span className="text-[13px] text-destructive">{LIMITS[bad][1]}-এর ঘরে ০ থেকে {LIMITS[bad][0] === 80 ? '৮০' : '১,০০,০০,০০০'}-এর মধ্যে সংখ্যা দিন।</span>}
          {!bad && noGender && <span className="text-[13px] text-muted-foreground">জেন্ডার সিলেক্ট করুন।</span>}
          <span className="flex-1" />
          {line}
          <Button type="button" className="h-9 px-5" disabled={pending || badNumber || noGender || !d.shortName.trim()} onClick={save}>
            সেভ
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="ছোট নাম" hint="রুটিনে এই নামটা দেখায়।">
          <input className={INPUT} value={d.shortName} onChange={(e) => set({ shortName: e.target.value })} maxLength={40} placeholder="যেমন Mueen" autoFocus />
        </Field>
        <div className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">জেন্ডার</span>
          <Chips
            label="জেন্ডার"
            options={[{ value: 'female', label: 'মহিলা' }, { value: 'male', label: 'পুরুষ' }, ...(d.isVacancy ? [{ value: '', label: 'জানা নেই' }] : [])]}
            isOn={(v) => v === (d.gender ?? '')}
            onToggle={(v) => set({ gender: (v || null) as Draft['gender'] })}
          />
        </div>
      </div>
      <Field label="পুরো নাম">
        <input className={INPUT} value={d.fullName} onChange={(e) => set({ fullName: e.target.value })} maxLength={120} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="পদবি">
          <input className={INPUT} value={d.designation} onChange={(e) => set({ designation: e.target.value })} maxLength={80} placeholder="যেমন সহকারী শিক্ষক" />
        </Field>
        <Field label="মোবাইল">
          <input className={INPUT} value={d.phone} onChange={(e) => set({ phone: e.target.value })} maxLength={40} inputMode="tel" />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <p className="m-0 text-[13px] font-semibold">যে সাবজেক্ট পড়ান</p>
        {byType.length === 0 ? (
          <p className="m-0 text-[13px] text-muted-foreground">আগে সেটআপে সাবজেক্ট যোগ করুন।</p>
        ) : (
          byType.map(({ type, list }) => (
            <div key={type.id} className="flex flex-col gap-1.5">
              <span className="text-[12px] text-muted-foreground">{type.name}</span>
              <Chips
                label={type.name}
                options={list.map((s) => ({ value: s.id, label: s.name }))}
                isOn={(v) => d.subjectIds.includes(v)}
                onToggle={(v) => set({ subjectIds: d.subjectIds.includes(v) ? d.subjectIds.filter((x) => x !== v) : [...d.subjectIds, v] })}
              />
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="সপ্তাহে টার্গেট" hint="কয়টা ক্লাস; টিএ অর্ধেক ধরা হয়।">
          <input className={INPUT} value={d.targetPeriods} onChange={(e) => set({ targetPeriods: e.target.value })} inputMode="numeric" />
        </Field>
        <Field label="মাসিক বেতন" hint="শুধু অ্যাডমিনে, প্রিন্টে আসে না।">
          <input className={INPUT} value={d.salary} onChange={(e) => set({ salary: e.target.value })} inputMode="numeric" />
        </Field>
      </div>

      <details className="text-[13px]" open={!!(d.qualification || d.experienceYears || d.erpId || d.bio || d.department)}>
        <summary className="cursor-pointer font-medium text-muted-foreground">আরও তথ্য (ডিপার্টমেন্ট, যোগ্যতা, অভিজ্ঞতা, ERP আইডি, পরিচিতি)</summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="ডিপার্টমেন্ট">
            <input className={INPUT} value={d.department} onChange={(e) => set({ department: e.target.value })} maxLength={80} />
          </Field>
          <Field label="অভিজ্ঞতা (বছর)">
            <input className={INPUT} value={d.experienceYears} onChange={(e) => set({ experienceYears: e.target.value })} inputMode="decimal" />
          </Field>
          <Field label="শিক্ষাগত যোগ্যতা" className="col-span-2">
            <input className={INPUT} value={d.qualification} onChange={(e) => set({ qualification: e.target.value })} maxLength={300} />
          </Field>
          <Field label="ERP আইডি" hint="জরিপের রিপোর্টের সাথে মেলাতে।" className="col-span-2">
            <input className={INPUT} value={d.erpId} onChange={(e) => set({ erpId: e.target.value })} maxLength={40} />
          </Field>
          <Field label="ছোট পরিচিতি" className="col-span-2">
            <textarea className={cn(INPUT, 'h-auto min-h-[80px] py-2')} value={d.bio} onChange={(e) => set({ bio: e.target.value })} maxLength={2000} />
          </Field>
        </div>
      </details>

      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={d.isVacancy} onChange={(e) => set({ isVacancy: e.target.checked })} />
        <span className="flex flex-col">
          খালি পোস্ট (এখনো কাউকে নেওয়া হয়নি)
          <span className="text-[12.5px] text-muted-foreground">রুটিনে বসানো যায়, প্রক্সিতে আসে না। নতুন টিচার এলে নাম বদলে টিক তুলে দিন।</span>
        </span>
      </label>
      {teacher && !teacher.active && (
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={d.active} onChange={(e) => set({ active: e.target.checked })} />
          <span className="flex flex-col">
            আবার চালু করুন
            <span className="text-[12.5px] text-muted-foreground">লিস্ট থেকে সরানো আছে; টিক দিলে আবার রুটিনে বসানো যাবে।</span>
          </span>
        </label>
      )}
    </SidePanel>
  );
}
