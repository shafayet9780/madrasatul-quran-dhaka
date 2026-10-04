'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { closeRoundAction, extendRoundAction, openRoundAction, refreshListsAction } from './actions';
import type { ActionResult, BoardRow, OpenedRow, RowStatus, UnopenedRow } from './types';

const STATUS: Record<RowStatus, { label: string; bg: string; fg: string }> = {
  open: { label: 'চলমান', bg: 'var(--sv-ok-bg)', fg: 'var(--sv-ok)' },
  scheduled: { label: 'খোলার অপেক্ষায়', bg: 'var(--sv-info-bg)', fg: 'var(--sv-info)' },
  draft: { label: 'খসড়া', bg: 'var(--sv-info-bg)', fg: 'var(--sv-info)' },
  closed: { label: 'বন্ধ', bg: 'var(--sv-neutral-bg)', fg: 'var(--sv-text-body)' },
};

type Panel = { type: 'extend' | 'close' | 'refresh'; row: OpenedRow } | null;
type Message = { ok: boolean; lines: string[] } | null;

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
    <button
      type="button"
      className="sv-sbtn"
      aria-label={`${rowName(row)}: লিংক কপি`}
      onClick={() => navigator.clipboard.writeText(row.url).then(() => setCopied(true))}
    >
      {copied ? 'কপি হয়েছে ✓' : 'লিংক কপি'}
    </button>
  );
}

function OpenPanel({
  row,
  pending,
  run,
}: {
  row: UnopenedRow;
  pending: boolean;
  run: (action: () => Promise<ActionResult>) => void;
}) {
  const [opensAt, setOpensAt] = useState(row.opensAtInput);
  const [closesAt, setClosesAt] = useState(row.closesAtInput);
  const { check } = row;
  const t1 = row.kind === 'T1';

  return (
    <section
      className="sv-card flex flex-col gap-3.5 min-w-0"
      style={{ flex: '1 1 360px', border: '2px solid var(--sv-bronze)' }}
      aria-labelledby="open-round-title"
    >
      <div className="flex flex-col gap-0.5">
        <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>খসড়া রাউন্ড খুলুন</div>
        <h2 id="open-round-title" className="sv-head sv-h2" style={{ fontSize: 21 }}>
          {rowName(row)}
        </h2>
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <label className="flex flex-col gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
          খোলার সময়
          <input className="sv-input" type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
          বন্ধের সময়
          <input className="sv-input" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
        </label>
      </div>
      {check.ok ? (
        <div className="flex flex-col gap-2" style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--sv-stone-soft)' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>খোলার সময় যা স্থির হবে</div>
          <ul className="flex flex-col gap-1" style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 14, color: 'var(--sv-text-body)' }}>
            <li>· {bn(check.summary.questions)}টি প্রশ্ন{t1 ? '' : ', অপশন ও লুকানো মার্ক'}</li>
            <li>
              · {bn(check.summary.classSections)}টি শ্রেণি-শাখা ও বিষয় তালিকা
              {t1 ? ` (${bn(check.summary.t1Pairs)}টি ক্লাস-বিষয়)` : ''}
            </li>
            {t1 && <li>· {bn(check.summary.teachers)} জন শিক্ষকের তালিকা</li>}
            <li>· {bn(check.summary.areas)}টি ক্ষেত্র (এরিয়া) ট্যাগ</li>
          </ul>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>পরে Studio-তে প্রশ্ন বদলালেও এই রাউন্ডের ফলাফল বদলাবে না।</div>
        </div>
      ) : (
        <div className="sv-note is-error flex flex-col gap-1" role="alert">
          <strong>এখনো খোলা যাবে না:</strong>
          {check.errors.map((error) => (
            <span key={error}>· {error}</span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <div style={{ fontSize: 13, fontWeight: 600 }}>শেয়ার লিংক (খোলার পর সক্রিয়)</div>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px dashed var(--sv-dashed)',
            fontSize: 13.5,
            color: 'var(--sv-text-body)',
            overflowWrap: 'anywhere',
          }}
        >
          {row.linkPreview}
        </div>
      </div>
      <button
        type="button"
        className="sv-pbtn"
        disabled={!check.ok || pending}
        onClick={() => run(() => openRoundAction(row.sanityRoundId, opensAt, closesAt))}
      >
        {pending ? 'খোলা হচ্ছে…' : 'রাউন্ড খুলুন'}
      </button>
    </section>
  );
}

function ActionPanel({
  panel,
  pending,
  onCancel,
  run,
}: {
  panel: NonNullable<Panel>;
  pending: boolean;
  onCancel: () => void;
  run: (action: () => Promise<ActionResult>) => void;
}) {
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
    <div className="sv-confirm" role="group" aria-labelledby="round-panel-title">
      <div className="flex flex-col gap-0.5" style={{ flex: '1 1 320px' }}>
        <div id="round-panel-title" style={{ fontWeight: 600 }}>
          {copy.title}
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>{copy.body}</div>
      </div>
      {panel.type === 'extend' && (
        <label style={{ flex: '0 1 240px', fontSize: 13, fontWeight: 600 }}>
          <span className="sv-visually-hidden">নতুন বন্ধের সময়</span>
          <input className="sv-input" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
        </label>
      )}
      <button ref={cancelRef} type="button" className="sv-sbtn is-stone is-tall" onClick={onCancel}>
        {copy.cancel}
      </button>
      <button type="button" className="sv-sbtn is-primary is-tall" disabled={pending} onClick={() => run(copy.action)}>
        {pending ? 'অপেক্ষা করুন…' : copy.confirm}
      </button>
    </div>
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

  function openPanel(type: NonNullable<Panel>['type'], row: OpenedRow) {
    setMessage(null);
    setPanel({ type, row });
  }

  return (
    <div className="flex flex-wrap gap-4 items-start">
      <section className="sv-card flex flex-col gap-3 min-w-0" style={{ flex: '999 1 620px' }} aria-labelledby="all-rounds">
        <h2 id="all-rounds" className="sv-head sv-h2">
          সব রাউন্ড
        </h2>
        <div role="status" aria-live="polite" ref={statusRef} tabIndex={-1} style={{ outline: 'none' }}>
          {message && (
            <div className={`sv-note ${message.ok ? 'is-ok' : 'is-error'} flex flex-col gap-0.5`} role={message.ok ? undefined : 'alert'}>
              {message.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          )}
        </div>
        {rows.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-2 text-center"
            style={{ minHeight: 180, borderRadius: 12, border: '1.5px dashed var(--sv-dashed)', padding: 16 }}
          >
            <div style={{ fontWeight: 600 }}>এখনো কোনো রাউন্ড নেই</div>
            <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>
              Studio → Surveys → Rounds-এ একটি রাউন্ড তৈরি করে প্রকাশ (Publish) করুন; তারপর এখান থেকে খুলুন।
            </div>
            <Link href="/studio/structure/surveys;surveyRound" style={{ fontSize: 14, fontWeight: 600 }}>
              Studio খুলুন
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="sv-table is-stackable" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th scope="col">জরিপ</th>
                  <th scope="col">রাউন্ড</th>
                  <th scope="col">অবস্থা</th>
                  <th scope="col">সময়</th>
                  <th scope="col">জমা</th>
                  <th scope="col">কাজ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const status = row.type === 'unopened' ? 'draft' : row.status;
                  const chip = STATUS[status];
                  const key = row.type === 'unopened' ? row.sanityRoundId : row.roundId;
                  return (
                    <tr key={key} style={{ background: status === 'draft' ? 'var(--sv-tint)' : undefined }}>
                      <td data-label="জরিপ">
                        <span className="sv-tag">{row.kind}</span>
                      </td>
                      <td data-label="রাউন্ড" style={{ fontWeight: 600 }}>{row.label}</td>
                      <td data-label="অবস্থা">
                        <span className="sv-chip" style={{ background: chip.bg, color: chip.fg }}>
                          {chip.label}
                        </span>
                      </td>
                      <td data-label="সময়" style={{ color: 'var(--sv-text-muted)', fontSize: 13 }} title={row.type === 'opened' ? row.whenTitle : undefined}>
                        {row.when}
                      </td>
                      <td data-label="জমা">
                        {row.type === 'opened' ? (
                          <span className="flex flex-col">
                            <span className="sv-num" style={{ whiteSpace: 'nowrap' }}>{row.count}</span>
                            {row.drafts > 0 && (
                              <span style={{ fontSize: 12.5, color: 'var(--sv-text-muted)' }}>{bn(row.drafts)}টি খসড়া</span>
                            )}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {row.type === 'unopened' ? (
                            <>
                              <button
                                type="button"
                                className="sv-sbtn is-primary"
                                aria-pressed={selected?.sanityRoundId === row.sanityRoundId}
                                aria-label={`${rowName(row)}: রাউন্ড খুলুন`}
                                onClick={() => setSelectedId(row.sanityRoundId)}
                              >
                                রাউন্ড খুলুন
                              </button>
                              <Link className="sv-sbtn" href={row.studioHref} target="_blank" rel="noreferrer">
                                Studio-তে সম্পাদনা
                              </Link>
                            </>
                          ) : (
                            <>
                              {row.status !== 'closed' && <CopyLinkButton row={row} />}
                              <button
                                type="button"
                                className="sv-sbtn"
                                aria-label={`${rowName(row)}: মেয়াদ বাড়ান`}
                                onClick={() => openPanel('extend', row)}
                              >
                                মেয়াদ বাড়ান
                              </button>
                              {row.status !== 'closed' && (
                                <>
                                  <button
                                    type="button"
                                    className="sv-sbtn"
                                    aria-label={`${rowName(row)}: এখনই বন্ধ`}
                                    onClick={() => openPanel('close', row)}
                                  >
                                    এখনই বন্ধ
                                  </button>
                                  <button
                                    type="button"
                                    className="sv-sbtn"
                                    aria-label={`${rowName(row)}: তালিকা হালনাগাদ`}
                                    onClick={() => openPanel('refresh', row)}
                                  >
                                    তালিকা হালনাগাদ
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {panel && (
          <ActionPanel key={`${panel.type}-${panel.row.roundId}`} panel={panel} pending={pending} onCancel={() => setPanel(null)} run={run} />
        )}
      </section>

      {selected && <OpenPanel key={selected.sanityRoundId} row={selected} pending={pending} run={run} />}
    </div>
  );
}
