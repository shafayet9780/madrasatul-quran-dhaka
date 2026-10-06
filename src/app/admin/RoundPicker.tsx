'use client';

import { useRouter } from 'next/navigation';

/** Round select for tracker and report pages; keeps other query parameters (class, section). */
export function RoundPicker({ rounds, value, basePath, params = {} }: { rounds: { id: string; label: string }[]; value: string; basePath: string; params?: Record<string, string> }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-1.5" style={{ fontSize: 13, color: 'var(--sv-text-muted)', maxWidth: '100%', minWidth: 0 }}>
      রাউন্ড
      <select
        className="sv-input"
        style={{ height: 36, width: 'auto', maxWidth: '100%', minWidth: 0, fontSize: 14 }}
        value={value}
        onChange={(e) => router.push(`${basePath}?${new URLSearchParams({ ...params, round: e.target.value })}`)}
      >
        {rounds.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
    </label>
  );
}
