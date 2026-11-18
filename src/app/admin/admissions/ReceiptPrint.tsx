'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Printer } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { receiptPrintAction } from './actions';

// The receipt's first print is the original; every later one (the button, Ctrl+P, a reload, or the
// same application in another bulk print) is marked ডুপ্লিকেট. Each print is recorded before the
// print dialog opens.

type State = { duplicates: Set<string>; print: () => void; busy: boolean; error: string };
const Duplicates = createContext<State>({ duplicates: new Set(), print: () => {}, busy: false, error: '' });

export function ReceiptPrint({ ids, printed, children }: { ids: string[]; printed: string[]; children: ReactNode }) {
  const [duplicates, setDuplicates] = useState(() => new Set(printed));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Set when the button has already recorded this print, so beforeprint does not record it again.
  const recorded = useRef(false);

  useEffect(() => {
    const before = () => {
      if (!recorded.current) void receiptPrintAction(ids).catch(() => undefined);
      recorded.current = false;
    };
    const after = () => setDuplicates(new Set(ids));
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [ids]);

  const print = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await receiptPrintAction(ids);
      if (!result.ok) return setError(result.error);
      flushSync(() => setDuplicates(new Set(result.duplicates)));
      recorded.current = true;
      window.print();
    } catch {
      setError('প্রিন্ট শুরু করা যায়নি। পেজটি আবার লোড করে চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  return <Duplicates.Provider value={{ duplicates, print, busy, error }}>{children}</Duplicates.Provider>;
}

export function PrintReceiptButton({ label = 'রসিদ প্রিন্ট করুন' }: { label?: string }) {
  const { print, busy, error } = useContext(Duplicates);
  return (
    <span className="flex items-center gap-3">
      {error && (
        <span role="alert" className="text-[13px] text-destructive">
          {error}
        </span>
      )}
      <Button className="h-9" disabled={busy} onClick={print}>
        <Printer aria-hidden />
        {label}
      </Button>
    </span>
  );
}

/** "ডুপ্লিকেট কপি" on a reprint (nothing on the original). */
export function DuplicateMark({ id, on }: { id: string; on: string }) {
  const { duplicates } = useContext(Duplicates);
  if (!duplicates.has(id)) return null;
  return <span className="adm-receipt-dup">ডুপ্লিকেট কপি · প্রিন্ট {on}</span>;
}
