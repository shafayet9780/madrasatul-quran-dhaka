'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { toBengaliDigits as bn } from '@/lib/admissions/normalise';
import { receiptPrintAction } from './actions';

// Receipts print only through the button: it gives the numbers, records the print and shows both
// on the page before the print dialog opens. Ctrl+P prints a note instead of the receipts (see
// admin.css), so no receipt is printed unrecorded. The first print of an application is the
// original, every later one ডুপ্লিকেট. Browsers do not say whether the dialog was cancelled, so for
// a few minutes after a print the same copy can be printed again (a jam, the wrong printer).

const AGAIN_MS = 10 * 60 * 1000;

type State = { duplicates: Set<string>; numbers: Record<string, string>; print: (again: boolean) => void; busy: boolean; error: string; againUntil: number };
const Receipts = createContext<State>({ duplicates: new Set(), numbers: {}, print: () => {}, busy: false, error: '', againUntil: 0 });

/** Marks the page ready, so the receipts print (admin.css), until the print dialog closes. */
function openPrintDialog() {
  document.documentElement.dataset.receiptPrint = 'ready';
  window.addEventListener('afterprint', () => delete document.documentElement.dataset.receiptPrint, { once: true });
  window.print();
}

export function ReceiptPrint({ ids, printed, children }: { ids: string[]; printed: string[]; children: ReactNode }) {
  const [duplicates, setDuplicates] = useState(() => new Set(printed));
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [againUntil, setAgainUntil] = useState(0);

  // Hides "print again" when its time is up.
  useEffect(() => {
    if (!againUntil) return;
    const timer = setTimeout(() => setAgainUntil(0), againUntil - Date.now());
    return () => clearTimeout(timer);
  }, [againUntil]);

  const print = async (again: boolean) => {
    setBusy(true);
    setError('');
    try {
      const result = await receiptPrintAction(ids, again);
      if (!result.ok) return setError(result.error);
      if (!again) {
        flushSync(() => {
          setDuplicates(new Set(result.duplicates));
          setNumbers(result.numbers);
          setAgainUntil(Date.now() + AGAIN_MS);
        });
      }
      openPrintDialog();
    } catch {
      setError('প্রিন্ট শুরু করা যায়নি। পেজটি আবার লোড করে চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  return <Receipts.Provider value={{ duplicates, numbers, print, busy, error, againUntil }}>{children}</Receipts.Provider>;
}

export function PrintReceiptButton({ label = 'রসিদ প্রিন্ট করুন' }: { label?: string }) {
  const { print, busy, error, againUntil } = useContext(Receipts);
  return (
    <span className="flex flex-wrap items-center gap-2">
      {error && (
        <span role="alert" className="text-[13px] text-destructive">
          {error}
        </span>
      )}
      {againUntil > 0 && (
        <Button variant="outline" className="h-9 bg-white shadow-none" disabled={busy} onClick={() => print(true)} title="প্রিন্ট না হলে বা বাতিল করলে: ডুপ্লিকেট ছাড়াই একই কপি">
          <RotateCcw aria-hidden />
          আবার প্রিন্ট (একই কপি)
        </Button>
      )}
      <Button className="h-9" disabled={busy} onClick={() => print(false)}>
        <Printer aria-hidden />
        {label}
      </Button>
    </span>
  );
}

/** "ডুপ্লিকেট কপি" on a reprint (nothing on the original). */
export function DuplicateMark({ id, on }: { id: string; on: string }) {
  const { duplicates } = useContext(Receipts);
  if (!duplicates.has(id)) return null;
  return <span className="adm-receipt-dup">ডুপ্লিকেট কপি · প্রিন্ট {on}</span>;
}

/** The receipt number: given at the first print, so a sheet not yet printed says when it comes. */
export function ReceiptNumber({ id, number, test }: { id: string; number: string | null; test: boolean }) {
  const { numbers } = useContext(Receipts);
  const value = numbers[id] ?? number;
  if (value) return <b>{bn(value)}</b>;
  return <span className="adm-receipt-muted">{test ? 'পরীক্ষামূলক আবেদন, নম্বর নেই' : 'প্রিন্ট করলে দেওয়া হবে'}</span>;
}
