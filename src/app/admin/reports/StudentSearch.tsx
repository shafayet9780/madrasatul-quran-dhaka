'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { normaliseStudentId, toBengaliDigits as bn } from '@/lib/survey/normalise';

type Student = { erpId: string; name: string; roll: number | null; label: string };

/** Find a student by name, ID or roll (R-States "শিক্ষার্থী প্রোফাইল · খুঁজুন"). */
export function StudentSearch({ students, roundId, focus = false }: { students: Student[]; roundId: string; focus?: boolean }) {
  const [query, setQuery] = useState('');
  // Opened from the sidebar's "শিক্ষার্থী খুঁজুন" (or ⌘K): ready to type.
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (focus) input.current?.focus();
  }, [focus]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const digits = normaliseStudentId(q);
    return students
      .filter((s) => s.name.toLowerCase().includes(q) || (digits && (s.erpId.includes(digits) || String(s.roll ?? '') === digits)))
      .slice(0, 12);
  }, [query, students]);

  return (
    <section className="sv-card flex flex-col gap-3" aria-labelledby="student-search-title">
      <h2 id="student-search-title" className="sv-head sv-h2">
        শিক্ষার্থী প্রোফাইল · খুঁজুন
      </h2>
      <label htmlFor="student-search" className="sv-visually-hidden">
        নাম, আইডি বা রোল
      </label>
      <input
        ref={input}
        id="student-search"
        className="sv-input"
        style={{ height: 50, fontSize: 16, borderColor: 'var(--sv-bronze)' }}
        placeholder="নাম, আইডি বা রোল"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      <ul className="flex flex-col" style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-live="polite">
        {matches.map((s) => (
          <li key={s.erpId}>
            <Link
              href={`/admin/reports/student/${encodeURIComponent(s.erpId)}?round=${roundId}`}
              className="flex flex-col"
              style={{ padding: '8px 12px', borderRadius: 10, textDecoration: 'none', color: 'var(--sv-text)' }}
            >
              <b>{s.name}</b>
              <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
                {s.label}
                {s.roll !== null ? ` · রোল ${bn(s.roll)}` : ''} · আইডি {bn(s.erpId)}
              </span>
            </Link>
          </li>
        ))}
        {query.trim() && !matches.length && <li style={{ padding: '8px 12px', fontSize: 14, color: 'var(--sv-text-muted)' }}>কাউকে পাওয়া যায়নি।</li>}
      </ul>
    </section>
  );
}
