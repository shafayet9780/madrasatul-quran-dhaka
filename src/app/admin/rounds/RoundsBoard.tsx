'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/shadcn/dropdown-menu';
import { Input } from '@/components/shadcn/input';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { LINK } from '../ui';
import { closeRoundAction, extendRoundAction, openRoundAction, refreshListsAction } from './actions';
import type { ActionResult, BoardRow, OpenedRow, RowStatus, UnopenedRow } from './types';

const STATUS: Record<RowStatus, { label: string; tone: string }> = {
  open: { label: 'চলমান', tone: 'text-success' },
  scheduled: { label: 'খোলার অপেক্ষায়', tone: 'text-[#1d4ed8]' },
  draft: { label: 'খসড়া', tone: 'text-[#1d4ed8]' },
  closed: { label: 'বন্ধ', tone: 'text-muted-foreground' },
};

type PanelType = 'extend' | 'close' | 'refresh';
type Panel = { type: PanelType; row: OpenedRow } | null;
type Message = { ok: boolean; lines: string[] } | null;

const OUTLINE = 'adm h-8 bg-white shadow-none';

function rowName(row: BoardRow) {
  return `${row.kind} · ${row.label}`;
}

function CopyLinkButton({ row }: { row: OpenedRow }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <Button type="button" variant="outline" className={OUTLINE} aria-label={`${rowName(row)}: লিংক কপি`} onClick={() => navigator.clipboard.writeText(row.url).then(() => setCopied(true))}>
      {copied ? 'কপি হয়েছে ✓' : 'লিংক কপি'}
    </Button>
  );
}

/** A round's actions: one button (copy the link, or open / extend) and the rest in a ⋯ menu. */
function RowActions({ row, selected, onSelect, onPanel }: { row: BoardRow; selected: boolean; onSelect: (id: string) => void; onPanel: (type: PanelType, row: OpenedRow) => void }) {
  if (row.type === 'unopened') {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" className="h-8" aria-pressed={selected} aria-label={`${rowName(row)}: রাউন্ড খুলুন`} onClick={() => onSelect(row.sanityRoundId)}>
          রাউন্ড খুলুন
        </Button>
        <Button asChild variant="outline" className={OUTLINE}>
          <Link href={row.studioHref} target="_blank" rel="noreferrer">
            Studio-তে সম্পাদনা
          </Link>
        </Button>
      </div>
    );
  }
  // A closed round has one thing to do: extend it, which opens it again.
  if (row.status === 'closed') {
    return (
      <Button type="button" variant="outline" className={OUTLINE} aria-label={`${rowName(row)}: মেয়াদ বাড়ান`} onClick={() => onPanel('extend', row)}>
        মেয়াদ বাড়ান
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <CopyLinkButton row={row} />
      {/* Not modal: its focus trap would pull focus back from the panel an item opens. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="icon" className="adm size-8 bg-white shadow-none" aria-label={`${rowName(row)}: আরও কাজ`}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="adm min-w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuItem onSelect={() => onPanel('extend', row)}>মেয়াদ বাড়ান</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onPanel('refresh', row)}>তালিকা হালনাগাদ</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onPanel('close', row)} className="text-destructive focus:text-destructive">
            এখনই বন্ধ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function OpenPanel({ row, pending, run }: { row: UnopenedRow; pending: boolean; run: (action: () => Promise<ActionResult>) => void }) {
  const [opensAt, setOpensAt] = useState(row.opensAtInput);
  const [closesAt, setClosesAt] = useState(row.closesAtInput);
  const { check } = row;
  const t1 = row.kind === 'T1';

  return (
    <section className="flex min-w-0 flex-col gap-3.5 rounded-xl border-2 border-primary bg-card p-5" aria-labelledby="open-round-title">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] text-muted-foreground">খসড়া রাউন্ড খুলুন</span>
        <h2 id="open-round-title" className="m-0 text-lg font-semibold">
          {rowName(row)}
        </h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          খোলার সময়
          <Input type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          বন্ধের সময়
          <Input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
        </label>
      </div>
      {check.ok ? (
        <div className="flex flex-col gap-2 rounded-lg bg-muted/60 px-3.5 py-3">
          <span className="text-sm font-semibold">খোলার সময় যা স্থির হবে</span>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
            <li>· {bn(check.summary.questions)}টি প্রশ্ন{t1 ? '' : ', অপশন ও লুকানো মার্ক'}</li>
            <li>
              · {bn(check.summary.classSections)}টি শ্রেণি-শাখা ও বিষয় তালিকা
              {t1 ? ` (${bn(check.summary.t1Pairs)}টি ক্লাস-বিষয়)` : ''}
            </li>
            {t1 && <li>· {bn(check.summary.teachers)} জন শিক্ষকের তালিকা</li>}
            <li>· {bn(check.summary.areas)}টি ক্ষেত্র (এরিয়া) ট্যাগ</li>
          </ul>
          <span className="text-[13px] text-muted-foreground">পরে Studio-তে প্রশ্ন বদলালেও এই রাউন্ডের ফলাফল বদলাবে না।</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1 rounded-lg bg-[var(--sv-error-bg)] px-3.5 py-3 text-sm text-[var(--sv-error)]" role="alert">
          <strong>এখনো খোলা যাবে না:</strong>
          {check.errors.map((error) => (
            <span key={error}>· {error}</span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium">শেয়ার লিংক (খোলার পর সক্রিয়)</span>
        <span className="rounded-lg border border-dashed px-3 py-2.5 text-[13.5px] [overflow-wrap:anywhere]">{row.linkPreview}</span>
      </div>
      <Button type="button" className="h-10" disabled={!check.ok || pending} onClick={() => run(() => openRoundAction(row.sanityRoundId, opensAt, closesAt))}>
        {pending ? 'খোলা হচ্ছে…' : 'রাউন্ড খুলুন'}
      </Button>
    </section>
  );
}

function ActionPanel({ panel, pending, onCancel, run }: { panel: NonNullable<Panel>; pending: boolean; onCancel: () => void; run: (action: () => Promise<ActionResult>) => void }) {
  const { row } = panel;
  const [closesAt, setClosesAt] = useState(row.closesAtInput);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelRef.current?.focus(), [panel]);

  const copy = {
    close: {
      title: `${rowName(row)} এখনই বন্ধ করবেন?`,
      body: `${row.progress} বন্ধের পর ${row.respondents} আর জমা দিতে পারবেন না, তবে পরে মেয়াদ বাড়ানো যাবে।`,
      cancel: 'না, খোলা রাখুন',
      confirm: 'হ্যাঁ, বন্ধ করুন',
      action: () => closeRoundAction(row.roundId),
    },
    refresh: {
      title: `${rowName(row)}: তালিকা হালনাগাদ করবেন?`,
      body: 'Studio থেকে শ্রেণি, শাখা, বিষয় ও শিক্ষক তালিকা আবার নেওয়া হবে। প্রশ্ন ও আগের জমা বদলাবে না।',
      cancel: 'বাতিল',
      confirm: 'হালনাগাদ করুন',
      action: () => refreshListsAction(row.roundId),
    },
    extend: {
      title: `${rowName(row)}: নতুন বন্ধের সময়`,
      body: row.status === 'closed' ? 'মেয়াদ বাড়ালে রাউন্ডটি আবার খুলবে এবং রেখে দেওয়া খসড়া জমা দেওয়া যাবে।' : 'লিংক একই থাকবে।',
      cancel: 'বাতিল',
      confirm: 'সংরক্ষণ করুন',
      action: () => extendRoundAction(row.roundId, closesAt),
    },
  }[panel.type];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/60 px-4 py-3.5" role="group" aria-labelledby="round-panel-title">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-0.5">
        <span id="round-panel-title" className="font-semibold">
          {copy.title}
        </span>
        <span className="text-[13.5px] text-muted-foreground">{copy.body}</span>
      </div>
      {panel.type === 'extend' && (
        <label className="flex-[0_1_240px]">
          <span className="sv-visually-hidden">নতুন বন্ধের সময়</span>
          <Input type="datetime-local" className="bg-white" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
        </label>
      )}
      <Button ref={cancelRef} type="button" variant="outline" className="adm h-10 bg-white shadow-none" onClick={onCancel}>
        {copy.cancel}
      </Button>
      <Button type="button" variant={panel.type === 'close' ? 'destructive' : 'default'} className="h-10" disabled={pending} onClick={() => run(copy.action)}>
        {pending ? 'অপেক্ষা করুন…' : copy.confirm}
      </Button>
    </div>
  );
}

function StatusText({ status }: { status: RowStatus }) {
  return (
    <span className={cn('whitespace-nowrap text-[13px] font-medium', STATUS[status].tone)}>
      <span aria-hidden>● </span>
      <span>{STATUS[status].label}</span>
    </span>
  );
}

function Count({ row }: { row: BoardRow }) {
  if (row.type !== 'opened') return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex flex-col">
      <span className="whitespace-nowrap font-medium tabular-nums">{row.count}</span>
      {row.drafts > 0 && <span className="text-[12.5px] text-muted-foreground">{bn(row.drafts)}টি খসড়া</span>}
    </span>
  );
}

export function RoundsBoard({ rows }: { rows: BoardRow[] }) {
  const unopened = rows.filter((r): r is UnopenedRow => r.type === 'unopened');
  const [selectedId, setSelectedId] = useState(unopened[0]?.sanityRoundId);
  const selected = unopened.find((r) => r.sanityRoundId === selectedId) ?? unopened[0];
  const [panel, setPanel] = useState<Panel>(null);
  const [message, setMessage] = useState<Message>(null);
  const [pending, startTransition] = useTransition();
  const statusRef = useRef<HTMLDivElement>(null);
  const active = rows.filter((r) => r.type === 'unopened' || r.status !== 'closed');
  const closed = rows.filter((r): r is OpenedRow => r.type === 'opened' && r.status === 'closed');

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      try {
        const result = await action();
        setMessage(result.ok ? { ok: true, lines: [result.message] } : { ok: false, lines: result.errors });
        if (result.ok) setPanel(null);
        // The panel that had focus may be gone; keep keyboard users at the result.
        requestAnimationFrame(() => statusRef.current?.focus());
      } catch {
        setMessage({ ok: false, lines: ['কাজটি সম্পন্ন হয়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।'] });
        requestAnimationFrame(() => statusRef.current?.focus());
      }
    });
  }

  function openPanel(type: PanelType, row: OpenedRow) {
    setMessage(null);
    setPanel({ type, row });
  }

  const actions = (row: BoardRow) => (
    <RowActions row={row} selected={row.type === 'unopened' && selected?.sanityRoundId === row.sanityRoundId} onSelect={setSelectedId} onPanel={openPanel} />
  );

  const table = (list: BoardRow[], label: string) => (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-sm" aria-label={label}>
        <thead>
          <tr className="text-left text-[13px] text-muted-foreground [&>th]:border-b [&>th]:px-2.5 [&>th]:py-2 [&>th]:font-medium">
            <th scope="col">জরিপ</th>
            <th scope="col">রাউন্ড</th>
            <th scope="col">অবস্থা</th>
            <th scope="col">সময়</th>
            <th scope="col">জমা</th>
            <th scope="col">কাজ</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row) => {
            const status = row.type === 'unopened' ? 'draft' : row.status;
            return (
              <tr key={row.type === 'unopened' ? row.sanityRoundId : row.roundId} className={cn('[&>td]:border-b [&>td]:px-2.5 [&>td]:py-2.5 last:[&>td]:border-b-0', status === 'draft' && 'bg-muted/50')}>
                <td>
                  <span className="inline-flex h-[22px] items-center rounded-md border px-2 text-xs font-medium">{row.kind}</span>
                </td>
                <td className="font-medium">{row.label}</td>
                <td>
                  <StatusText status={status} />
                </td>
                <td className="text-[13px] text-muted-foreground" title={row.type === 'opened' ? row.whenTitle : undefined}>
                  {row.when}
                </td>
                <td>
                  <Count row={row} />
                </td>
                <td>{actions(row)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Phones: one short row per round, its actions underneath.
  const list = (items: BoardRow[], label: string) => (
    <ul className="m-0 flex list-none flex-col p-0 md:hidden" aria-label={label}>
      {items.map((row) => (
        <li key={row.type === 'unopened' ? row.sanityRoundId : row.roundId} className="flex flex-col gap-2 border-b py-3 last:border-b-0">
          <span className="flex items-start justify-between gap-3">
            <span className="flex flex-col">
              <span className="font-medium">
                <span className="mr-1.5 text-[12px] text-muted-foreground">{row.kind}</span>
                {row.label}
              </span>
              <span className="text-[12.5px] text-muted-foreground">{row.when}</span>
            </span>
            <StatusText status={row.type === 'unopened' ? 'draft' : row.status} />
          </span>
          <span className="flex items-center justify-between gap-3 text-[13px]">
            <Count row={row} />
            {actions(row)}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    // The second column only when a round is waiting to be opened.
    <div className={cn('grid grid-cols-1 items-start gap-4', selected && 'xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]')}>
      <section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-5" aria-labelledby="all-rounds">
        <h2 id="all-rounds" className="m-0 text-[15px] font-semibold">
          সব রাউন্ড
        </h2>
        <div role="status" aria-live="polite" ref={statusRef} tabIndex={-1} className="outline-none">
          {message && (
            <div className={cn('flex flex-col gap-0.5 rounded-lg px-3.5 py-2.5 text-sm', message.ok ? 'bg-[var(--sv-ok-bg)] text-success' : 'bg-[var(--sv-error-bg)] text-[var(--sv-error)]')} role={message.ok ? undefined : 'alert'}>
              {message.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          )}
        </div>
        {rows.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center">
            <span className="font-semibold">এখনো কোনো রাউন্ড নেই</span>
            <span className="text-sm text-muted-foreground">Studio → Surveys → Rounds-এ একটি রাউন্ড তৈরি করে প্রকাশ (Publish) করুন; তারপর এখান থেকে খুলুন।</span>
            <Link href="/studio/structure/surveys;surveyRound" className={cn(LINK, 'text-sm font-semibold')}>
              Studio খুলুন
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 ? (
              <>
                {table(active, 'চলমান ও খসড়া রাউন্ড')}
                {list(active, 'চলমান ও খসড়া রাউন্ড')}
              </>
            ) : (
              <p className="m-0 text-sm text-muted-foreground">এখন কোনো রাউন্ড চলছে না।</p>
            )}
            {closed.length > 0 && (
              <details className="group border-t pt-2">
                <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  <ChevronRight aria-hidden className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  বন্ধ রাউন্ড ({bn(closed.length)})
                </summary>
                {table(closed, 'বন্ধ রাউন্ড')}
                {list(closed, 'বন্ধ রাউন্ড')}
              </details>
            )}
          </>
        )}
        {panel && <ActionPanel key={`${panel.type}-${panel.row.roundId}`} panel={panel} pending={pending} onCancel={() => setPanel(null)} run={run} />}
      </section>

      {selected && <OpenPanel key={selected.sanityRoundId} row={selected} pending={pending} run={run} />}
    </div>
  );
}
