'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { formatDateTime } from '@/lib/survey/dates';
import { resolveDuplicateAction } from './actions';

export function RoundPicker({ rounds, value }: { rounds: { id: string; label: string }[]; value: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-1.5" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
      রাউন্ড
      <select
        className="sv-input"
        style={{ height: 36, width: 'auto', fontSize: 14 }}
        value={value}
        onChange={(e) => router.push(`/admin/tracker?round=${e.target.value}`)}
      >
        {rounds.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PrintButton() {
  return (
    <button type="button" className="sv-sbtn" onClick={() => window.print()}>
      প্রিন্ট / PDF
    </button>
  );
}

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
    <fieldset className="flex flex-col gap-2" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--sv-tint-border)', background: 'var(--sv-tint)', margin: 0 }}>
      <legend className="sv-visually-hidden">{title}</legend>
      <div className="flex justify-between gap-2" style={{ fontWeight: 600 }}>
        <span>ডুপ্লিকেট · {title}</span>
        <span className="sv-num" style={{ fontSize: 13.5 }}>
          {batches.length.toLocaleString('bn-BD')}টি জমা
        </span>
      </div>
      {batches.map((b) => (
        <label key={b.id} className="flex items-center gap-2" style={{ fontSize: 14 }}>
          <input type="radio" name={`dup-${ids[0]}`} checked={choice === b.id} onChange={() => setChoice(b.id)} />
          <span>
            <b>{b.teacherName}</b>-এরটি রাখুন <span className="sv-muted">· {formatDateTime(new Date(b.submittedAt))}</span>
          </span>
        </label>
      ))}
      <label className="flex items-center gap-2" style={{ fontSize: 14 }}>
        <input type="radio" name={`dup-${ids[0]}`} checked={choice === 'all'} onChange={() => setChoice('all')} />
        <span>সবগুলো রাখুন (দুজনই পড়ান)</span>
      </label>
      {error && (
        <div role="alert" style={{ fontSize: 13.5, color: 'var(--sv-error)' }}>
          {error}
        </div>
      )}
      <div>
        <button type="button" className="sv-sbtn" disabled={!choice || pending} onClick={apply}>
          {pending ? 'অপেক্ষা করুন…' : 'সিদ্ধান্ত সংরক্ষণ করুন'}
        </button>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--sv-text-muted)' }}>যেটি রাখবেন না সেটি রিপোর্টে গণ্য হবে না, তবে মুছে যাবে না।</div>
    </fieldset>
  );
}
