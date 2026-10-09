'use client';

import { useEffect, useState, useTransition } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Switch } from '@/components/shadcn/switch';
import { Textarea } from '@/components/shadcn/textarea';
import { OFFICE_STATUSES, STATUS_LABEL, type ApplicationStatus } from '@/lib/admissions/admin-labels';
import { cn } from '@/lib/utils';
import { acceptHeldAction, addNoteAction, changeStatusAction, evaluationDayAction, resendEmailAction, testPassAction } from './actions';

type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Runs an action and keeps its message for a status line. */
function useAction() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (action: () => Promise<Result>, after?: () => void, failed?: () => void) =>
    start(async () => {
      try {
        const result = await action();
        setMessage(result.ok ? (result.message ? { ok: true, text: result.message } : null) : { ok: false, text: result.error });
        if (result.ok) after?.();
        else failed?.();
      } catch {
        setMessage({ ok: false, text: 'কাজটি করা যায়নি। পাতাটি আবার লোড করে চেষ্টা করুন।' });
        failed?.();
      }
    });
  const line = message && (
    <p role="status" className={cn('m-0 mt-2 text-[13px]', message.ok ? 'text-success' : 'text-destructive')}>
      {message.text}
    </p>
  );
  return { pending, run, line };
}

export function StatusForm({ id, status }: { id: string; status: ApplicationStatus }) {
  const [value, setValue] = useState<string>(status);
  const { pending, run, line } = useAction();
  return (
    <>
      <div className="flex gap-2">
        <select aria-label="অবস্থা" value={value} onChange={(e) => setValue(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border bg-white px-2 text-sm">
          {OFFICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <Button className="h-9" disabled={pending || value === status} onClick={() => run(() => changeStatusAction([id], value))}>
          সংরক্ষণ
        </Button>
      </div>
      {line}
    </>
  );
}

/** Evaluation day: attendance and the cash evaluation fee (with its receipt number). */
export function EvaluationSwitches({ id, attended, evalFee, attendedNote, feeNote, fee }: { id: string; attended: boolean; evalFee: boolean; attendedNote: string; feeNote: string; fee: string }) {
  const { pending, run, line } = useAction();
  const [receipt, setReceipt] = useState('');
  // The switches move at once; a failed save puts them back.
  const [att, setAtt] = useState(attended);
  const [paid, setPaid] = useState(evalFee);
  useEffect(() => setAtt(attended), [attended]);
  useEffect(() => setPaid(evalFee), [evalFee]);
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b py-2.5">
        <span className="flex flex-col">
          <span id={`att-${id}`} className="text-sm font-medium">
            উপস্থিত
          </span>
          <span className="text-[12.5px] text-muted-foreground">{attendedNote}</span>
        </span>
        <Switch
          aria-labelledby={`att-${id}`}
          checked={att}
          disabled={pending}
          onCheckedChange={(on) => {
            setAtt(on);
            run(() => evaluationDayAction(id, 'attended', on), undefined, () => setAtt(!on));
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 py-2.5">
        <span className="flex flex-col">
          <span id={`fee-${id}`} className="text-sm font-medium">
            মূল্যায়ন ফি {fee} গৃহীত
          </span>
          <span className="text-[12.5px] text-muted-foreground">{feeNote}</span>
        </span>
        <Switch
          aria-labelledby={`fee-${id}`}
          checked={paid}
          disabled={pending}
          onCheckedChange={(on) => {
            setPaid(on);
            run(() => evaluationDayAction(id, 'evalFee', on, on ? receipt : undefined), () => setReceipt(''), () => setPaid(!on));
          }}
        />
      </div>
      {!paid && (
        <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
          রসিদ নং
          <input
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            maxLength={40}
            placeholder="ঐচ্ছিক"
            className="h-8 w-32 rounded-md border bg-white px-2 text-sm text-foreground [font-family:var(--font-english)]"
          />
        </label>
      )}
      {line}
    </div>
  );
}

export function NoteForm({ id }: { id: string }) {
  const [text, setText] = useState('');
  const { pending, run, line } = useAction();
  return (
    <>
      <Textarea aria-label="নতুন নোট" placeholder="অফিসের জন্য নোট লিখুন" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} className="min-h-[72px] bg-white text-sm" />
      <div className="mt-2 flex justify-end">
        <Button variant="outline" className="h-9 bg-white shadow-none" disabled={pending || !text.trim()} onClick={() => run(() => addNoteAction(id, text), () => setText(''))}>
          নোট যোগ করুন
        </Button>
      </div>
      {line}
    </>
  );
}

export function ResendEmail({ id }: { id: string }) {
  const { pending, run, line } = useAction();
  return (
    <div className="flex flex-col items-end">
      <Button variant="outline" className="h-9 bg-white shadow-none" disabled={pending} onClick={() => run(() => resendEmailAction(id))}>
        <Mail aria-hidden />
        ইমেইল আবার পাঠান
      </Button>
      {line}
    </div>
  );
}

export function AcceptHeld({ id, paymentId }: { id: string; paymentId: string }) {
  const { pending, run, line } = useAction();
  const [sure, setSure] = useState(false);
  return (
    <div className="mt-2 flex flex-col gap-2">
      <label className="flex items-start gap-2 text-[13px] leading-snug">
        <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="mt-0.5 accent-primary" />
        SSLCommerz প্যানেলে লেনদেনটি দেখেছি, টাকা ঠিকমতো এসেছে।
      </label>
      <Button className="h-9 self-start" disabled={!sure || pending} onClick={() => run(() => acceptHeldAction(id, paymentId))}>
        পেমেন্ট গ্রহণ করে আইডি দিন
      </Button>
      {line}
    </div>
  );
}

/** Overview: gives or ends the test pass for this device. */
export function TestPass({ active }: { active: boolean }) {
  const { pending, run, line } = useAction();
  return (
    <div className="flex flex-col items-start">
      <Button variant={active ? 'outline' : 'default'} className={cn('h-9', active && 'bg-white shadow-none')} disabled={pending} onClick={() => run(() => testPassAction(!active))}>
        {active ? 'পরীক্ষা শেষ করুন' : 'এই ডিভাইসে ফর্ম খুলুন'}
      </Button>
      {line}
    </div>
  );
}
