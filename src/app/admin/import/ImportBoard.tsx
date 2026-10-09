'use client';

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/shadcn/button';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { StatTile, StatTiles } from '../ui';
import { applyImportAction, previewImportAction } from './actions';
import type { ImportPreview } from './types';

type Stage = 'upload' | 'preview' | 'done';

const STEPS: [Stage, string][] = [
  ['upload', 'ফাইল আপলোড'],
  ['preview', 'যাচাই ও প্রিভিউ'],
  ['done', 'নিশ্চিত'],
];

function Steps({ stage }: { stage: Stage }) {
  const current = STEPS.findIndex(([s]) => s === stage);
  return (
    <ol className="m-0 flex list-none flex-wrap gap-2 p-0 text-sm">
      {STEPS.map(([key, label], i) => {
        const done = i < current || stage === 'done';
        const active = i === current && stage !== 'done';
        return (
          <li
            key={key}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-md border px-3 font-medium',
              done ? 'border-transparent bg-[var(--sv-ok-bg)] text-success' : active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
            )}
          >
            {done && '✓ '}
            {bn(i + 1)} {label}
          </li>
        );
      })}
    </ol>
  );
}

function List({ names, limit = 12 }: { names: string[]; limit?: number }) {
  if (!names.length) return <span className="text-muted-foreground">—</span>;
  const shown = names.slice(0, limit).join(' · ');
  return (
    <>
      {shown}
      {names.length > limit ? ` · ও আরও ${bn(names.length - limit)} জন` : ''}
    </>
  );
}

export function ImportBoard() {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>('upload');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDeactivations, setConfirmDeactivations] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const formWith = (f: File) => {
    const form = new FormData();
    form.set('file', f);
    return form;
  };

  function check() {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await previewImportAction(formWith(file));
        if (result.ok) {
          setPreview(result.preview);
          setStage('preview');
        } else setError(result.error);
      } catch {
        setError('যাচাই করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।');
      }
      requestAnimationFrame(() => resultRef.current?.focus());
    });
  }

  function apply() {
    if (!file || !preview) return;
    setError(null);
    const form = formWith(file);
    form.set('runId', String(preview.runId));
    if (confirmDeactivations) form.set('confirmDeactivations', 'yes');
    startTransition(async () => {
      try {
        const result = await applyImportAction(form);
        if (result.ok) {
          setDone(result.message);
          setStage('done');
        } else setError(result.error);
      } catch {
        setError('ইমপোর্ট হয়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।');
      }
      requestAnimationFrame(() => resultRef.current?.focus());
    });
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setStage('upload');
    setError(null);
    setDone(null);
    setConfirmDeactivations(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  const tiles = preview
    ? [
        ['নতুন', preview.counts.adds],
        ['হালনাগাদ', preview.counts.updates],
        ['অপরিবর্তিত', preview.counts.unchanged],
        ['নিষ্ক্রিয় হবে', preview.counts.deactivations],
        ['সমস্যা', preview.counts.problems],
      ]
    : [];

  return (
    <div className="flex flex-col gap-5">
      <Steps stage={stage} />

      <div ref={resultRef} tabIndex={-1} role="status" aria-live="polite" style={{ outline: 'none' }}>
        {error && (
          <div className="rounded-lg bg-[var(--sv-error-bg)] px-3.5 py-2.5 text-sm text-[var(--sv-error)]" role="alert">
            {error}
          </div>
        )}
        {done && <div className="rounded-lg bg-[var(--sv-ok-bg)] px-3.5 py-2.5 text-sm text-success">{done}</div>}
      </div>

      {stage === 'upload' && (
        <section className="rounded-xl border bg-card p-5 flex flex-col gap-3.5" aria-labelledby="upload-title">
          <h2 id="upload-title" className="m-0 text-[15px] font-semibold">
            ERP-র শিক্ষার্থী তালিকা দিন
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--sv-text-body)', lineHeight: 1.6 }}>
            ERP-র Student List থেকে CSV বা Excel (.xlsx) ডাউনলোড করে এখানে দিন। দরকারি কলাম: ID, Roll, Name, Class, Section, Father Name, Father Contact,
            Mother Contact (Photo উপেক্ষা করা হয়)। আগে যাচাই হবে; নিশ্চিত না করা পর্যন্ত কিছুই বদলাবে না।
          </p>
          <label className="flex flex-col gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
            ফাইল
            <input
              ref={inputRef}
              className="h-11 rounded-lg border bg-white px-3 py-2 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium"
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div>
            <Button type="button" className="h-10 px-5" disabled={!file || pending} onClick={check}>
              {pending ? 'যাচাই হচ্ছে…' : 'যাচাই করুন'}
            </Button>
          </div>
        </section>
      )}

      {preview && stage !== 'upload' && (
        <>
          <section className="rounded-xl border bg-card p-5 flex flex-wrap gap-4 items-center">
            <div
              aria-hidden="true"
              className="flex items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--sv-ok-bg)', color: 'var(--sv-ok)', fontWeight: 600 }}
            >
              ✓
            </div>
            <div className="flex flex-col gap-0.5" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{preview.fileName}</div>
              <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
                {preview.sheetName ? `শিট “${preview.sheetName}” · ` : ''}
                {bn(preview.rowCount)}টি সারি · কলাম মিলেছে: {preview.columns.join(', ')}
                {preview.ignoredColumns.length ? ` · ${preview.ignoredColumns.join(', ')} উপেক্ষিত` : ''}
              </div>
            </div>
            {stage === 'preview' && (
              <Button type="button" variant="outline" className="adm h-9 bg-white shadow-none" onClick={reset}>
                অন্য ফাইল
              </Button>
            )}
          </section>

          <StatTiles>
            {tiles.map(([label, value]) => (
              <StatTile key={label as string} label={label as string} value={bn(value as number)} />
            ))}
          </StatTiles>

          {preview.largeDeactivation && (
            <div className="flex flex-col gap-2 rounded-lg bg-[var(--sv-error-bg)] px-3.5 py-2.5 text-sm text-[var(--sv-error)]" role="alert">
              <span>{bn(preview.counts.deactivations)} জন শিক্ষার্থী নিষ্ক্রিয় হবে। ফাইলটি কি পুরো স্কুলের তালিকা? না হলে ইমপোর্ট করবেন না।</span>
              {stage === 'preview' && (
                <label className="flex items-center gap-2" style={{ fontWeight: 600 }}>
                  <input type="checkbox" checked={confirmDeactivations} onChange={(e) => setConfirmDeactivations(e.target.checked)} style={{ width: 18, height: 18 }} />
                  হ্যাঁ, এটি পুরো তালিকা; {bn(preview.counts.deactivations)} জনকে নিষ্ক্রিয় করুন
                </label>
              )}
            </div>
          )}

          {preview.problems.length > 0 && (
            <section className="rounded-xl border bg-card p-5 flex flex-col gap-3" aria-labelledby="problems-title">
              <h2 id="problems-title" className="m-0 text-[15px] font-semibold text-warning">
                ⚠ {bn(preview.problems.length)}টি সারিতে সমস্যা · {bn(preview.counts.skipped)}টি বাদ যাবে,{' '}
                {bn(preview.problems.length - preview.counts.skipped)}টি নম্বর/রোল ছাড়া ইমপোর্ট হবে
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="sv-table is-stackable" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th scope="col">সারি</th>
                      <th scope="col">ID</th>
                      <th scope="col">নাম</th>
                      <th scope="col">সমস্যা</th>
                      <th scope="col">কী হবে / করণীয়</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.problems.map((problem) => (
                      <tr key={`${problem.line}-${problem.issue}`}>
                        <td data-label="সারি" className="sv-num">
                          {bn(problem.line)}
                        </td>
                        <td data-label="ID" className="sv-num">
                          {problem.id ? bn(problem.id) : '—'}
                        </td>
                        <td data-label="নাম" style={{ color: problem.name ? undefined : 'var(--sv-text-muted)' }}>
                          {problem.name || 'ফাঁকা'}
                        </td>
                        <td data-label="সমস্যা">{problem.issue}</td>
                        <td data-label="কী হবে">{problem.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="flex flex-wrap gap-4 items-start">
            <section className="rounded-xl border bg-card p-5 flex flex-col gap-2.5 min-w-0" style={{ flex: '1 1 420px' }} aria-labelledby="mapping-title">
              <h2 id="mapping-title" className="m-0 text-[15px] font-semibold">
                শ্রেণি ম্যাপিং
              </h2>
              <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>ERP-এর Class + Section → সিস্টেমের শ্রেণি (Studio-তে সেট করা)</div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {preview.mapping.map((m) => (
                  <li
                    key={m.erp}
                    className="grid items-center gap-2"
                    style={{ gridTemplateColumns: 'minmax(0,1fr) 24px minmax(0,1fr) 48px', padding: '7px 0', borderBottom: '1px solid var(--sv-hairline-soft)', fontSize: 14 }}
                  >
                    <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13, color: 'var(--sv-text-body)' }}>{m.erp}</span>
                    <span aria-hidden="true" style={{ color: '#A8A096' }}>
                      →
                    </span>
                    <span style={{ fontWeight: 600, color: m.label ? undefined : 'var(--sv-warn)' }}>{m.label ?? 'ম্যাপ নেই'}</span>
                    <span className="sv-num" style={{ textAlign: 'right', fontSize: 13, color: 'var(--sv-text-muted)' }}>
                      {bn(m.count)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border bg-card p-5 flex flex-col gap-2.5 min-w-0" style={{ flex: '1 1 420px' }} aria-labelledby="changes-title">
              <h2 id="changes-title" className="m-0 text-[15px] font-semibold">
                পরিবর্তনের প্রিভিউ
              </h2>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--sv-ok)' }}>নতুন ({bn(preview.counts.adds)})</div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--sv-text-body)' }}>
                <List names={preview.addNames} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--sv-info)' }}>হালনাগাদ ({bn(preview.counts.updates)})</div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--sv-text-body)' }}>{preview.updateSummary ? `${preview.updateSummary} বদলেছে` : '—'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--sv-text-body)' }}>নিষ্ক্রিয় হবে ({bn(preview.counts.deactivations)})</div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--sv-text-body)' }}>
                {preview.deactivationNames.length ? (
                  <>
                    ফাইলে নেই: <List names={preview.deactivationNames} /> · আগের রিভিউ মুছে যাবে না
                  </>
                ) : (
                  '—'
                )}
              </div>
            </section>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-end">
            {preview.problems.length > 0 && (
              <Button asChild variant="outline" className="adm mr-auto h-10 bg-white shadow-none">
                <a href={`/admin/import/problems/${preview.runId}`}>সমস্যার তালিকা ডাউনলোড (Excel)</a>
              </Button>
            )}
            {stage === 'preview' && (
              <>
                <Button type="button" variant="outline" className="adm h-10 bg-white shadow-none" onClick={reset}>
                  বাতিল
                </Button>
                <Button type="button" className="h-10 px-5" disabled={pending || (preview.largeDeactivation && !confirmDeactivations)} onClick={apply}>
                  {pending ? 'ইমপোর্ট হচ্ছে…' : `ইমপোর্ট করুন${preview.counts.skipped ? ` (${bn(preview.counts.skipped)}টি সারি বাদ)` : ''}`}
                </Button>
              </>
            )}
            {stage === 'done' && (
              <Button type="button" variant="outline" className="adm h-10 bg-white shadow-none" onClick={reset}>
                আরেকটি ফাইল ইমপোর্ট করুন
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
