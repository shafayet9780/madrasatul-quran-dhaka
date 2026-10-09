'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { FLAGS } from '@/lib/survey/report-math';
import { cn } from '@/lib/utils';
import { Sparkline } from '../charts';
import { LINK, TONE_TEXT } from '../../ui';

type Row = {
  erpId: string;
  name: string;
  roll: number | null;
  mean: number | null;
  teachers: number;
  trend: { label: string; mean: number }[];
  flags: { kind: string; label: string }[];
  guardian: number | null;
  gap: number | null;
  form: 'verified' | 'unverified' | 'none';
};

type SortKey = 'roll' | 'name' | 'mean' | 'flags' | 'guardian' | 'gap';

const FORM = {
  verified: { label: 'যাচাইকৃত', tone: 'ok' },
  unverified: { label: 'অযাচাইকৃত', tone: 'warn' },
  none: { label: 'সাড়া নেই', tone: 'muted' },
} as const;

/** Guardian − teachers in marks: "+১.৩" = the guardian gave more. */
const signed = (d: number) => {
  const r = Math.round(d * 10) / 10;
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${bn(Math.abs(r).toFixed(1))}`;
};
const wide = (gap: number | null) => gap !== null && Math.round(Math.abs(gap) * 10) / 10 >= FLAGS.guardianTeacherGap;

/**
 * Student list: teacher marks, and with a G2 round the guardian's average and the difference
 * (⚠ from FLAGS.guardianTeacherGap marks, so the gap flag is not repeated among the others);
 * sortable. Phones get one short row per student instead of the table.
 */
export function ClassTable({ rows, roundId, showTrend, showGuardian }: { rows: Row[]; roundId: string; showTrend: boolean; showGuardian: boolean }) {
  // Children with flags first (then by roll), so the ones needing attention are on top.
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'flags', dir: -1 });
  const value = (row: Row, key: SortKey): number | string => {
    if (key === 'roll') return row.roll ?? Number.MAX_SAFE_INTEGER;
    if (key === 'name') return row.name;
    if (key === 'mean') return row.mean ?? -1;
    if (key === 'guardian') return row.guardian ?? -1;
    if (key === 'gap') return row.gap === null ? -1 : Math.abs(row.gap);
    return row.flags.length;
  };
  const sorted = [...rows].sort((a, b) => {
    // Students without a roll or without marks stay at the bottom in both directions.
    const missing = (row: Row) => (sort.key === 'roll' || sort.key === 'mean' || sort.key === 'guardian' || sort.key === 'gap') && row[sort.key] === null;
    if (missing(a) !== missing(b)) return missing(a) ? 1 : -1;
    const x = value(a, sort.key);
    const y = value(b, sort.key);
    return (typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number)) * sort.dir;
  });
  const shownFlags = (row: Row) => (showGuardian ? row.flags.filter((f) => f.kind !== 'gap') : row.flags);
  const href = (row: Row) => `/admin/reports/student/${encodeURIComponent(row.erpId)}?round=${roundId}`;

  const header = (key: SortKey, label: string, right = false) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={right ? 'text-right' : 'text-left'}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'roll' || key === 'name' ? 1 : -1 }))}
        className="cursor-pointer whitespace-nowrap border-0 bg-transparent p-0 font-medium text-inherit hover:text-foreground"
      >
        {label}
        {sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );

  return (
    <>
      <div className="hidden overflow-x-auto md:block print:block">
        <table className="w-full border-collapse text-sm" aria-label="শিক্ষার্থী তালিকা">
          <thead>
            <tr className="text-[13px] text-muted-foreground [&>th]:border-b [&>th]:px-2.5 [&>th]:py-2">
              {header('roll', 'রোল')}
              {header('name', 'নাম')}
              {header('mean', 'শিক্ষকদের গড় (/১০)', true)}
              {showGuardian && header('guardian', 'অভিভাবক (/১০)', true)}
              {showGuardian && header('gap', 'পার্থক্য', true)}
              {showTrend && (
                <th scope="col" className="text-left font-medium">
                  প্রবণতা
                </th>
              )}
              {header('flags', 'মনোযোগ')}
              {showGuardian && (
                <th scope="col" className="text-left font-medium">
                  অভিভাবকের ফর্ম
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.erpId} className="[&>td]:border-b [&>td]:px-2.5 [&>td]:py-2.5 [&>td]:align-top last:[&>td]:border-b-0">
                <td className="tabular-nums text-muted-foreground">{row.roll !== null ? bn(row.roll) : '–'}</td>
                <td>
                  <Link href={href(row)} className={cn(LINK, 'whitespace-nowrap font-medium')}>
                    {row.name}
                  </Link>
                  {row.roll === null && <span className="block text-[12.5px] text-muted-foreground">আইডি {bn(row.erpId)}</span>}
                </td>
                <td className="text-right">
                  {row.mean === null ? (
                    <span className="text-muted-foreground">রিভিউ নেই</span>
                  ) : (
                    <>
                      <span className="font-semibold tabular-nums">{bn(row.mean.toFixed(1))}</span>
                      <span className="block whitespace-nowrap text-[12px] text-muted-foreground">{bn(row.teachers)} জন শিক্ষক</span>
                    </>
                  )}
                </td>
                {showGuardian && <td className="text-right font-semibold tabular-nums">{row.guardian === null ? <span className="font-normal text-muted-foreground">—</span> : bn(row.guardian.toFixed(1))}</td>}
                {showGuardian && (
                  <td className={cn('whitespace-nowrap text-right tabular-nums', wide(row.gap) && 'font-semibold text-warning')}>
                    {row.gap === null ? <span className="text-muted-foreground">—</span> : `${wide(row.gap) ? '⚠ ' : ''}${signed(row.gap)}`}
                  </td>
                )}
                {showTrend && (
                  <td>
                    <Sparkline points={row.trend} label={`${row.name}: ${row.trend.map((p) => `${p.label} ${bn(p.mean.toFixed(1))}`).join(', ')}`} />
                  </td>
                )}
                <td className="text-[13px] leading-snug text-warning">
                  {shownFlags(row).map((f) => (
                    <span key={f.kind} className="block">
                      ⚠ {f.label}
                    </span>
                  ))}
                  {!shownFlags(row).length && <span className="text-muted-foreground">—</span>}
                </td>
                {showGuardian && (
                  <td>
                    <span className={cn('inline-flex h-[22px] items-center whitespace-nowrap rounded-md border px-2 text-xs font-medium', TONE_TEXT[FORM[row.form].tone])}>{FORM[row.form].label}</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: one short row per student, in the same order; the profile has the rest. */}
      <ul className="m-0 flex list-none flex-col p-0 md:hidden print:hidden" aria-label="শিক্ষার্থী তালিকা">
        {sorted.map((row) => {
          const attention = row.flags.length > 0;
          return (
            <li key={row.erpId} className="border-b last:border-b-0">
              <Link href={href(row)} className="flex items-center gap-3 py-2.5 text-foreground no-underline">
                <span className="w-6 shrink-0 text-[13px] tabular-nums text-muted-foreground">{row.roll !== null ? bn(row.roll) : '–'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{row.name}</span>
                  <span className="block text-[12.5px] text-muted-foreground">
                    শিক্ষক {row.mean === null ? '—' : bn(row.mean.toFixed(1))}
                    {showGuardian && ` · অভিভাবক ${row.guardian === null ? '—' : bn(row.guardian.toFixed(1))}`}
                  </span>
                </span>
                {attention && (
                  <span className="shrink-0 text-[13px] font-medium text-warning">
                    ⚠ {bn(row.flags.length)}
                    <span className="sv-visually-hidden">: {row.flags.map((f) => f.label).join(', ')}</span>
                  </span>
                )}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
