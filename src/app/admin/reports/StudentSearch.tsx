'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { normaliseStudentId, toBengaliDigits as bn } from '@/lib/survey/normalise';

type Student = { erpId: string; name: string; roll: number | null; label: string };

/** Find a student by name, ID or roll; the matches open the profile. */
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
    <div className="flex flex-col gap-2" role="search">
      <label className="flex h-11 items-center gap-2.5 rounded-lg border bg-white px-3 text-muted-foreground focus-within:ring-[3px] focus-within:ring-ring">
        <Search className="size-4" aria-hidden />
        <input
          ref={input}
          type="search"
          aria-label="নাম, আইডি বা রোল"
          placeholder="শিক্ষার্থী খুঁজুন: নাম, আইডি বা রোল"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-foreground outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </label>
      <div aria-live="polite">
        {query.trim() && (
          <ul className="m-0 list-none overflow-hidden rounded-xl border bg-card p-0">
            {matches.map((s) => (
              <li key={s.erpId} className="border-b last:border-b-0">
                <Link href={`/admin/reports/student/${encodeURIComponent(s.erpId)}?round=${roundId}`} className="flex flex-col px-4 py-2.5 text-foreground no-underline hover:bg-muted">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {s.label}
                    {s.roll !== null ? ` · রোল ${bn(s.roll)}` : ''} · আইডি {bn(s.erpId)}
                  </span>
                </Link>
              </li>
            ))}
            {!matches.length && <li className="px-4 py-2.5 text-sm text-muted-foreground">কাউকে পাওয়া যায়নি।</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
