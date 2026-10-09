'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { CirclePlus, Download, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { OFFICE_STATUSES, STATUS_LABEL, statusTone, type ApplicationStatus } from '@/lib/admissions/admin-labels';
import { toBengaliDigits as bn } from '@/lib/admissions/normalise';
import { cn } from '@/lib/utils';
import { changeStatusAction, deleteUnpaidAction } from './actions';
import { LAT, TONE_TEXT } from '../ui';

type Option = { value: string; label: string };

/** Search box and filter menus; each change replaces the URL (page 1), so lists are linkable. */
export function ListFilters({ filters }: { filters: { key: string; label: string; options: Option[] }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const first = useRef(true);

  const go = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete('page');
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => go({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex h-9 w-full items-center gap-2 rounded-lg border bg-white px-2.5 text-muted-foreground focus-within:ring-[3px] focus-within:ring-ring sm:w-[280px]">
        <Search className="size-3.5" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="খুঁজুন"
          placeholder="আইডি, নাম বা মোবাইল"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none"
        />
      </label>
      {filters.map((f) => {
        const value = params.get(f.key);
        const chosen = f.options.find((o) => o.value === value);
        return (
          <DropdownMenu key={f.key}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={cn('h-9 bg-white px-3 shadow-none', !chosen && 'border-dashed')}>
                <CirclePlus aria-hidden className={chosen ? 'hidden' : ''} />
                {f.label}
                {chosen && <span className="rounded-sm bg-muted px-1.5 text-[13px] font-normal">{chosen.label}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="adm min-w-48">
              <DropdownMenuRadioGroup value={value ?? ''} onValueChange={(v) => go({ [f.key]: v || null })}>
                {f.options.map((o) => (
                  <DropdownMenuRadioItem key={o.value} value={o.value}>
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {chosen && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => go({ [f.key]: null })}>
                    <X aria-hidden />
                    ফিল্টার সরান
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );
}

export type PaidRow = {
  id: string;
  publicRef: string;
  name: string;
  dob: string;
  classLabel: string;
  mobile: string;
  status: ApplicationStatus;
  paid: string;
  evalFee: boolean;
};

const MAX_PDFS = 25;

/** The paid list: select rows, then change their status or download their application PDFs. */
export function PaidTable({ rows }: { rows: PaidRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [next, setNext] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const all = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const ids = rows.filter((r) => selected.has(r.id)).map((r) => r.id);

  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const copy = new Set(s);
      if (on) copy.add(id);
      else copy.delete(id);
      return copy;
    });

  const apply = () =>
    start(async () => {
      const result = await changeStatusAction(ids, next);
      setMessage(result.ok ? { ok: true, text: result.message ?? '' } : { ok: false, text: result.error });
      if (result.ok) setSelected(new Set());
    });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border py-2 pl-3.5 pr-2">
        <span className="mr-auto text-sm" aria-live="polite">
          {ids.length ? `${bn(ids.length)}টি নির্বাচিত` : 'সারি নির্বাচন করে অবস্থা বদলান বা আবেদনপত্র নিন'}
        </span>
        <select
          aria-label="নতুন অবস্থা"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="h-9 rounded-lg border bg-white px-2 text-sm"
          disabled={!ids.length}
        >
          <option value="">অবস্থা বদলান</option>
          {OFFICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <Button className="h-9" disabled={!ids.length || !next || pending} onClick={apply}>
          প্রয়োগ করুন
        </Button>
        {ids.length > 0 && ids.length <= MAX_PDFS ? (
          <Button asChild variant="outline" className="h-9 bg-white shadow-none">
            <a href={`/admin/admissions/pdfs?ids=${ids.join(',')}`}>
              <Download aria-hidden />
              আবেদনপত্র PDF
            </a>
          </Button>
        ) : (
          <Button variant="outline" className="h-9 bg-white shadow-none" disabled title={ids.length > MAX_PDFS ? `একসাথে সর্বোচ্চ ${bn(MAX_PDFS)}টি` : undefined}>
            <Download aria-hidden />
            আবেদনপত্র PDF
          </Button>
        )}
      </div>
      {message && (
        <p role="status" className={cn('m-0 text-sm', message.ok ? 'text-success' : 'text-destructive')}>
          {message.text}
        </p>
      )}
      <div className="overflow-x-auto rounded-[10px] border">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="[&>th]:h-10 [&>th]:whitespace-nowrap [&>th]:border-b [&>th]:px-3 [&>th]:text-left [&>th]:text-[13px] [&>th]:font-medium [&>th]:text-muted-foreground">
              <th className="w-5">
                <Checkbox aria-label="সব নির্বাচন" checked={all} onCheckedChange={(v) => setSelected(v ? new Set(rows.map((r) => r.id)) : new Set())} />
              </th>
              <th>আইডি</th>
              <th>শিক্ষার্থী</th>
              <th>শ্রেণী</th>
              <th>অভিভাবকের মোবাইল</th>
              <th>অবস্থা</th>
              <th>পরিশোধ</th>
              <th>মূল্যায়ন ফি</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={cn('hover:bg-[#fafafa] [&>td]:border-b [&>td]:px-3 [&>td]:py-2.5 [&>td]:align-middle', selected.has(r.id) && 'bg-muted hover:bg-muted')}>
                <td>
                  <Checkbox aria-label={`${r.publicRef} নির্বাচন`} checked={selected.has(r.id)} onCheckedChange={(v) => toggle(r.id, v === true)} />
                </td>
                <td className={cn(LAT, 'font-medium')}>
                  <Link href={`/admin/admissions/${r.id}`} className="text-foreground no-underline hover:underline">
                    {r.publicRef}
                  </Link>
                </td>
                <td>
                  <div className="flex flex-col">
                    <span>{r.name}</span>
                    {r.dob && <span className="text-[12.5px] text-muted-foreground">জন্ম {r.dob}</span>}
                  </div>
                </td>
                <td>{r.classLabel}</td>
                <td className={cn(LAT, 'text-[13.5px]')}>{r.mobile}</td>
                <td>
                  <span className={cn('inline-flex h-[22px] items-center whitespace-nowrap rounded-md border px-2 text-xs font-medium', TONE_TEXT[statusTone(r.status)])}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap text-muted-foreground">{r.paid}</td>
                <td className={r.evalFee ? 'text-success' : 'text-muted-foreground'}>{r.evalFee ? 'গৃহীত' : 'বাকি'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Deletes an unpaid application (answers and uploaded documents) after a confirmation. */
export function DeleteUnpaid({ id, name, from }: { id: string; name: string; from: 'list' | 'detail' }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button variant="outline" className="h-9 bg-white text-destructive shadow-none hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden />
        মুছুন
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="adm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>আবেদনটি মুছে ফেলবেন?</DialogTitle>
            <DialogDescription>
              {name}: ফর্মের তথ্য ও আপলোড করা কাগজ দুটোই মুছে যাবে, ফেরত আনা যাবে না। কার্যক্রমের তালিকায় শুধু মুছে ফেলার রেকর্ড থাকবে।
            </DialogDescription>
          </DialogHeader>
          {error && <p className="m-0 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">বাতিল</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await deleteUnpaidAction(id, from === 'list' ? 'list' : undefined);
                  if (!result.ok) return setError(result.error);
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              মুছে ফেলুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
