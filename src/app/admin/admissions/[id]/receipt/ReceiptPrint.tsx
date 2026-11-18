'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Printer } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { receiptPrintAction } from '../../actions';

// The receipt's first print is the original; every later one (the button, Ctrl+P or a reload) is
// marked ডুপ্লিকেট. Each print is recorded before the print dialog opens.

const Duplicate = createContext<{ duplicate: boolean; print: () => void; busy: boolean; error: string }>({ duplicate: false, print: () => {}, busy: false, error: '' });

export function ReceiptPrint({ id, duplicate: printedBefore, children }: { id: string; duplicate: boolean; children: ReactNode }) {
  const [duplicate, setDuplicate] = useState(printedBefore);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Set when the button has already recorded this print, so beforeprint does not record it again.
  const recorded = useRef(false);

  useEffect(() => {
    const before = () => {
      if (!recorded.current) void receiptPrintAction(id).catch(() => undefined);
      recorded.current = false;
    };
    const after = () => setDuplicate(true);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [id]);

  const print = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await receiptPrintAction(id);
      if (!result.ok) return setError(result.error);
      flushSync(() => setDuplicate(result.duplicate));
      recorded.current = true;
      window.print();
    } catch {
      setError('প্রিন্ট শুরু করা যায়নি। পেজটি আবার লোড করে চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  return <Duplicate.Provider value={{ duplicate, print, busy, error }}>{children}</Duplicate.Provider>;
}

export function PrintReceiptButton() {
  const { print, busy, error } = useContext(Duplicate);
  return (
    <span className="flex items-center gap-3">
      {error && (
        <span role="alert" className="text-[13px] text-destructive">
          {error}
        </span>
      )}
      <Button className="h-9" disabled={busy} onClick={print}>
        <Printer aria-hidden />
        রসিদ প্রিন্ট করুন
      </Button>
    </span>
  );
}

/** "ডুপ্লিকেট কপি" on a reprint (nothing on the original). */
export function DuplicateMark({ on }: { on: string }) {
  const { duplicate } = useContext(Duplicate);
  if (!duplicate) return null;
  return <span className="adm-receipt-dup">ডুপ্লিকেট কপি · প্রিন্ট {on}</span>;
}
