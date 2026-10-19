'use client';

import { useEffect, useState } from 'react';
import { toAsciiDigits, toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { setTargetAction } from '../actions';
import { INPUT, useAction } from '../controls';

// A teacher's weekly target, edited in the workload table: saved on Enter or leaving the box,
// empty clears it. Bengali or English digits.

const shown = (target: number | null) => (target == null ? '' : bn(target));

export function TargetInput({ teacherId, name, target }: { teacherId: string; name: string; target: number | null }) {
  const [value, setValue] = useState(shown(target));
  useEffect(() => setValue(shown(target)), [target]);
  const { pending, run, line } = useAction();
  const save = () => {
    const raw = toAsciiDigits(value).trim();
    const next = raw === '' ? null : Number(raw);
    if (next === target) return setValue(shown(target));
    if (next !== null && (!Number.isInteger(next) || next < 0 || next > 80)) return setValue(shown(target));
    run(() => setTargetAction(teacherId, next));
  };
  return (
    <span className="inline-flex flex-col gap-1">
      <input
        className={cn(INPUT, 'h-8 w-[4.5rem] tabular-nums')}
        inputMode="numeric"
        value={value}
        placeholder="—"
        disabled={pending}
        aria-label={`${name}: সপ্তাহে টার্গেট (পিরিয়ড)`}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            setValue(shown(target));
            e.currentTarget.blur();
          }
        }}
      />
      {line}
    </span>
  );
}
