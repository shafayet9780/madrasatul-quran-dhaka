'use client';

import { useState, useTransition, type ComponentProps, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DialogContent } from '@/components/shadcn/dialog';
import { cn } from '@/lib/utils';
import type { Result } from './actions';

// Client pieces the routine pages share.

export const SELECT = 'h-9 min-w-0 rounded-lg border bg-white px-2 text-sm';
export const INPUT = 'h-9 min-w-0 rounded-lg border bg-white px-2.5 text-sm';
export const OUTLINE = 'h-9 bg-white shadow-none';

export type Message = { ok: boolean; text: string } | null;

/** Runs an action and keeps its outcome for a status line; warnings come back for a confirm step. */
export function useAction() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<Message>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const run = (action: () => Promise<Result>, after?: (result: Result & { ok: true }) => void, success?: string) =>
    start(async () => {
      setWarnings([]);
      try {
        const result = await action();
        if (result.ok) {
          setMessage(success ? { ok: true, text: success } : null);
          after?.(result);
        } else if (result.warnings?.length) {
          setMessage(null);
          setWarnings(result.warnings);
        } else {
          setMessage({ ok: false, text: result.error });
        }
      } catch {
        setMessage({ ok: false, text: 'কাজটি করা যায়নি। পেজটি আবার লোড করে চেষ্টা করুন।' });
      }
    });
  const line = message && <StatusLine message={message} />;
  return { pending, run, line, warnings, clear: () => (setMessage(null), setWarnings([])) };
}

export function StatusLine({ message }: { message: NonNullable<Message> }) {
  return (
    <p role="status" className={cn('m-0 text-[13px]', message.ok ? 'text-success' : 'text-destructive')}>
      {message.text}
    </p>
  );
}

/** A dialog inside the admin's look (it is portalled outside the page's `.adm` scope). */
export function RoutineDialog({ className, ...props }: ComponentProps<typeof DialogContent>) {
  return <DialogContent className={cn('adm max-h-[92dvh] overflow-y-auto bg-white text-[14px] sm:max-w-xl', className)} style={{ fontFamily: 'var(--font-english), var(--font-bengali), system-ui, sans-serif' }} {...props} />;
}

/** Sets one search parameter (or removes it with null), keeping the rest. */
export function useParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null) next.delete(key);
    else next.set(key, value);
    router.push(`${pathname}${next.size ? `?${next}` : ''}`);
  };
}

/** Which routine a page shows (?r=): the active one unless a draft is chosen. */
export function RoutinePicker({ routines, current }: { routines: { id: string; name: string; status: string }[]; current: string }) {
  const set = useParam();
  if (routines.length < 2) return null;
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground sv-no-print">
      রুটিন
      <select className={SELECT} value={current} onChange={(e) => set('r', e.target.value)}>
        {routines.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
            {r.status === 'active' ? ' (চালু)' : ' (খসড়া)'}
          </option>
        ))}
      </select>
    </label>
  );
}

/** A button that asks once more before it acts (no browser confirm dialogs). */
export function ConfirmButton({ children, confirm, onConfirm, disabled, className }: { children: ReactNode; confirm: ReactNode; onConfirm: () => void; disabled?: boolean; className?: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" disabled={disabled} className={cn('text-[13px] text-destructive underline-offset-4 hover:underline disabled:opacity-50', className)} onClick={() => setAsking(true)}>
        {children}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-[13px]">
      <button type="button" disabled={disabled} className="rounded-md bg-destructive px-2 py-1 font-medium text-white disabled:opacity-50" onClick={() => (setAsking(false), onConfirm())}>
        {confirm}
      </button>
      <button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={() => setAsking(false)}>
        বাতিল
      </button>
    </span>
  );
}

/** A select that sets one search parameter ('' removes it). */
export function ParamSelect({ name, value, label, options }: { name: string; value: string; label: string; options: { value: string; label: string }[] }) {
  const set = useParam();
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      {label}
      <select className={SELECT} value={value} onChange={(e) => set(name, e.target.value || null)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
