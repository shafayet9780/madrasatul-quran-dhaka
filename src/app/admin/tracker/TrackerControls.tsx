'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/shadcn/button';
import { formatDateTime } from '@/lib/survey/dates';
import { resolveDuplicateAction } from './actions';

/** Keep one batch of a duplicate class + subject, or keep all (R6 "কোনটি রাখবেন ঠিক করুন"). */
export function DuplicateResolver({
  roundId,
  title,
  batches,
}: {
  roundId: string;
  title: string;
  batches: { id: string; teacherName: string; submittedAt: string }[];
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ids = batches.map((b) => b.id);

  function apply() {
    if (!choice) return;
    startTransition(async () => {
      const result = await resolveDuplicateAction(roundId, ids, choice === 'all' ? null : choice);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <fieldset className="m-0 flex flex-col gap-2 rounded-lg border bg-card p-3.5">
      <legend className="sv-visually-hidden">{title}</legend>
      <div className="flex justify-between gap-2 font-semibold">
        <span>{title}</span>
        <span className="text-[13.5px] tabular-nums">{batches.length.toLocaleString('bn-BD')}টি জমা</span>
      </div>
      {batches.map((b) => (
        <label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="radio" className="size-4 accent-[var(--primary)]" name={`dup-${ids[0]}`} checked={choice === b.id} onChange={() => setChoice(b.id)} />
          <span>
            <b className="font-semibold">{b.teacherName}</b>-এরটি রাখুন <span className="text-muted-foreground">· {formatDateTime(new Date(b.submittedAt))}</span>
          </span>
        </label>
      ))}
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="radio" className="size-4 accent-[var(--primary)]" name={`dup-${ids[0]}`} checked={choice === 'all'} onChange={() => setChoice('all')} />
        <span>সবগুলো রাখুন (দুজনই পড়ান)</span>
      </label>
      {error && (
        <div role="alert" className="text-[13.5px] text-destructive">
          {error}
        </div>
      )}
      <div>
        <Button type="button" className="h-9" disabled={!choice || pending} onClick={apply}>
          {pending ? 'অপেক্ষা করুন…' : 'সিদ্ধান্ত সংরক্ষণ করুন'}
        </Button>
      </div>
    </fieldset>
  );
}

/** Copies one guardian's reminder (never a group list); the admin sends it on WhatsApp. */
export function CopyReminder({ text, child }: { text: string; child: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt('বার্তাটি কপি করুন', text);
    }
  }
  return (
    <Button type="button" variant="outline" className="h-8 bg-white shadow-none" aria-label={`${child}: বার্তা কপি`} onClick={() => void copy()}>
      <span aria-live="polite">{copied ? 'কপি হয়েছে' : 'বার্তা কপি'}</span>
    </Button>
  );
}
