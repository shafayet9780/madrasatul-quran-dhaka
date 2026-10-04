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
};

type SortKey = 'roll' | 'name' | 'mean' | 'teachers' | 'flags';

/** Student list from teacher marks (R3), sortable by column. */
export function ClassTable({ rows, roundId, showTrend }: { rows: Row[]; roundId: string; showTrend: boolean }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'roll', dir: 1 });
  const value = (row: Row, key: SortKey): number | string => {
    if (key === 'roll') return row.roll ?? Number.MAX_SAFE_INTEGER;
    if (key === 'name') return row.name;
    if (key === 'mean') return row.mean ?? -1;
    if (key === 'teachers') return row.teachers;
    return row.flags.length;
  };
  const sorted = [...rows].sort((a, b) => {
    const x = value(a, sort.key);
    const y = value(b, sort.key);
    return (typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number)) * sort.dir;
  });

  const header = (key: SortKey, label: string) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'mean' || key === 'flags' ? -1 : 1 }))}
        style={{ border: 0, background: 'transparent', font: 'inherit', color: 'inherit', padding: 0, cursor: 'pointer' }}
      >
        {label}
        {sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="sv-table is-stackable" style={{ minWidth: 720 }}>
        <thead>
          <tr>
            {header('roll', 'রোল')}
            {header('name', 'নাম')}
            {header('mean', 'শিক্ষকদের গড় (/১০)')}
            {header('teachers', 'শিক্ষক')}
            {showTrend && <th scope="col">প্রবণতা</th>}
            {header('flags', 'ফ্ল্যাগ')}
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
              <td data-label="গড়" className="sv-num">
                {row.mean === null ? <span style={{ color: 'var(--sv-text-muted)' }}>রিভিউ নেই</span> : bn(row.mean.toFixed(1))}
              </td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
