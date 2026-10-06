'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { Sparkline } from '../charts';

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

type SortKey = 'roll' | 'name' | 'mean' | 'teachers' | 'flags' | 'guardian' | 'gap';

const FORM = {
  verified: { label: 'যাচাইকৃত', bg: 'var(--sv-ok-bg)', fg: 'var(--sv-ok)' },
  unverified: { label: 'অযাচাইকৃত', bg: 'var(--sv-warn-bg)', fg: 'var(--sv-warn)' },
  none: { label: 'সাড়া নেই', bg: 'var(--sv-neutral-bg)', fg: 'var(--sv-text-body)' },
} as const;

/** Guardian − teachers in marks: "+১.৩" = the guardian gave more. */
const signed = (d: number) => {
  const r = Math.round(d * 10) / 10;
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${bn(Math.abs(r).toFixed(1))}`;
};

/** Student list (R3): teacher marks, and with a G2 round the guardian's average and the gap; sortable. */
export function ClassTable({ rows, roundId, showTrend, showGuardian }: { rows: Row[]; roundId: string; showTrend: boolean; showGuardian: boolean }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'roll', dir: 1 });
  const value = (row: Row, key: SortKey): number | string => {
    if (key === 'roll') return row.roll ?? Number.MAX_SAFE_INTEGER;
    if (key === 'name') return row.name;
    if (key === 'mean') return row.mean ?? -1;
    if (key === 'teachers') return row.teachers;
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

  const header = (key: SortKey, label: string) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'roll' || key === 'name' ? 1 : -1 }))}
        style={{ border: 0, background: 'transparent', font: 'inherit', color: 'inherit', padding: 0, cursor: 'pointer' }}
      >
        {label}
        {sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="sv-table is-stackable" style={{ minWidth: showGuardian ? 900 : 720 }}>
        <thead>
          <tr>
            {header('roll', 'রোল')}
            {header('name', 'নাম')}
            {showGuardian && header('guardian', 'অভিভাবক (/১০)')}
            {header('mean', 'শিক্ষকদের গড় (/১০)')}
            {showGuardian && header('gap', 'অভিভাবক − শিক্ষক')}
            {header('teachers', 'কতজন শিক্ষক')}
            {showTrend && <th scope="col">প্রবণতা</th>}
            {header('flags', 'ফ্ল্যাগ')}
            {showGuardian && <th scope="col">অভিভাবকের ফর্ম</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.erpId}>
              <td data-label="রোল" className="sv-num" style={{ color: 'var(--sv-text-muted)' }}>
                {row.roll !== null ? bn(row.roll) : '–'}
              </td>
              <td data-label="নাম">
                <Link href={`/admin/reports/student/${encodeURIComponent(row.erpId)}?round=${roundId}`} style={{ fontWeight: 600, color: 'var(--sv-text)' }}>
                  {row.name}
                </Link>
                {row.roll === null && <div style={{ fontSize: 12.5, color: 'var(--sv-text-muted)' }}>আইডি {bn(row.erpId)}</div>}
              </td>
              {showGuardian && (
                <td data-label="অভিভাবক" className="sv-num">
                  {row.guardian === null ? <span style={{ color: 'var(--sv-text-muted)' }}>—</span> : bn(row.guardian.toFixed(1))}
                </td>
              )}
              <td data-label="গড়" className="sv-num">
                {row.mean === null ? <span style={{ color: 'var(--sv-text-muted)' }}>রিভিউ নেই</span> : bn(row.mean.toFixed(1))}
              </td>
              {showGuardian && (
                <td data-label="পার্থক্য" className="sv-num">
                  {row.gap === null ? <span style={{ color: 'var(--sv-text-muted)' }}>—</span> : signed(row.gap)}
                </td>
              )}
              <td data-label="শিক্ষক" className="sv-num">
                {bn(row.teachers)}
              </td>
              {showTrend && (
                <td data-label="প্রবণতা">
                  <Sparkline points={row.trend} label={`${row.name}: ${row.trend.map((p) => `${p.label} ${bn(p.mean.toFixed(1))}`).join(', ')}`} />
                </td>
              )}
              <td data-label="ফ্ল্যাগ">
                <div className="flex flex-wrap gap-1">
                  {row.flags.map((f) => (
                    <span key={f.kind} className="sv-flag">
                      ⚠ {f.label}
                    </span>
                  ))}
                  {!row.flags.length && <span style={{ color: 'var(--sv-text-muted)' }}>—</span>}
                </div>
              </td>
              {showGuardian && (
                <td data-label="অভিভাবকের ফর্ম">
                  <span style={{ background: FORM[row.form].bg, color: FORM[row.form].fg, borderRadius: 6, padding: '2px 8px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {FORM[row.form].label}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
