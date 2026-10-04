import { toBengaliDigits as bn } from '@/lib/survey/normalise';

// Hand-built charts for the T1 reports. Teacher marks are one series (#2F6FA3), so no legend box;
// axes start at the scale floor (৪) and the unit is the mark out of ১০.

export const TEACHER = '#2F6FA3';
const FLOOR = 4;
const TOP = 10;
const pos = (mark: number) => Math.max(0, Math.min(1, (mark - FLOOR) / (TOP - FLOOR)));

/** Trend sparkline for a table row (shown from the second round). */
export function Sparkline({ points, label }: { points: { label: string; mean: number }[]; label: string }) {
  if (points.length < 2) return <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>—</span>;
  const w = 96;
  const h = 26;
  const xy = points.map((p, i) => [4 + (i * (w - 12)) / (points.length - 1), h - 3 - pos(p.mean) * (h - 6)] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      <polyline fill="none" stroke={TEACHER} strokeWidth="2" strokeLinejoin="round" points={xy.map((p) => p.join(',')).join(' ')} />
      <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r="3" fill={TEACHER} />
    </svg>
  );
}

/** Round-by-round teacher average for one student (R4 "রাউন্ডভিত্তিক স্কোর", marks instead of score). */
export function TrendChart({ points }: { points: { label: string; mean: number }[] }) {
  const w = 400;
  const h = 240;
  const left = 36;
  const right = 360;
  const top = 20;
  const bottom = 200;
  const x = (i: number) => (points.length === 1 ? (left + right) / 2 : left + 20 + (i * (right - left - 40)) / (points.length - 1));
  const y = (mark: number) => bottom - pos(mark) * (bottom - top);
  const last = points[points.length - 1];
  const description = points.map((p) => `${p.label} ${bn(p.mean.toFixed(1))}`).join(', ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={`শিক্ষকদের গড় মার্ক: ${description}`}>
      <g stroke="var(--sv-hairline)">
        {[10, 7, 4].map((m) => (
          <line key={m} x1={left} x2={right} y1={y(m)} y2={y(m)} stroke={m === 4 ? 'var(--sv-dashed)' : undefined} />
        ))}
      </g>
      <g fill="var(--sv-text-muted)" fontSize="12" textAnchor="end">
        {[10, 7, 4].map((m) => (
          <text key={m} x={left - 8} y={y(m) + 4}>
            {bn(m)}
          </text>
        ))}
      </g>
      <g fill="var(--sv-text-muted)" fontSize="12" textAnchor="middle">
        {points.map((p, i) => (
          <text key={p.label} x={x(i)} y={h - 16}>
            {p.label}
          </text>
        ))}
      </g>
      <polyline fill="none" stroke={TEACHER} strokeWidth="2" points={points.map((p, i) => `${x(i)},${y(p.mean)}`).join(' ')} />
      {points.map((p, i) => (
        <circle key={p.label} cx={x(i)} cy={y(p.mean)} r={i === points.length - 1 ? 5 : 3.5} fill={TEACHER} stroke="#fff" strokeWidth="2">
          <title>{`${p.label}: ${bn(p.mean.toFixed(1))}`}</title>
        </circle>
      ))}
      <text x={x(points.length - 1) + 10} y={y(last.mean) + 4} fontSize="13" fontWeight="600" fill="var(--sv-text)">
        {bn(last.mean.toFixed(1))}
      </text>
    </svg>
  );
}

/** A mark on the ৪–১০ track, with an optional class-average tick (R3/R4 area rows). */
export function MarkBar({ value, reference, muted, label }: { value: number | null; reference?: number | null; muted?: boolean; label: string }) {
  return (
    <div style={{ position: 'relative', height: 22 }} title={label} role="img" aria-label={label}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 10, height: 2, background: 'var(--sv-hairline-soft)' }} />
      {value !== null && (
        <div style={{ position: 'absolute', left: 0, top: 9, height: 4, width: `${pos(value) * 100}%`, background: muted ? 'var(--sv-dashed)' : '#C9DCEE', borderRadius: 2 }} />
      )}
      {reference != null && (
        <div style={{ position: 'absolute', top: 2, left: `${pos(reference) * 100}%`, width: 3, height: 18, marginLeft: -1, background: 'var(--sv-text-body)' }} />
      )}
      {value !== null && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: `${pos(value) * 100}%`,
            width: 14,
            height: 14,
            marginLeft: -7,
            borderRadius: '50%',
            background: muted ? 'var(--sv-icon-muted)' : TEACHER,
            boxShadow: '0 0 0 2px #fff',
          }}
        />
      )}
    </div>
  );
}

export function MarkAxis() {
  return (
    <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }} aria-hidden="true">
      <span>৪</span>
      <span>৭</span>
      <span>১০</span>
    </div>
  );
}

/** Mark-cell colours for the subject × question grid (R4 ramp, teacher blue). */
export function markCell(mark: number | null): { bg: string; fg: string } {
  if (mark === null) return { bg: 'var(--sv-stone-soft)', fg: '#A8A096' };
  if (mark >= 10) return { bg: '#2A5F91', fg: '#FFFFFF' };
  if (mark >= 8) return { bg: '#6E9FCB', fg: '#1F2A2E' };
  if (mark >= 6) return { bg: '#C9DCEE', fg: '#1F2A2E' };
  return { bg: '#EAF1F8', fg: '#1F2A2E' };
}

/** Distribution colours (R5): ৪ rust → ১০ teacher blue; text stays in ink, the legend names them. */
export const DIST_COLORS: Record<number, string> = { 4: '#B0521A', 6: '#E59A5B', 8: '#8DB4DB', 10: '#2F6FA3' };

export function Distribution({ items, label }: { items: { mark: number; count: number }[]; label: string }) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  const shown = [...items].sort((a, b) => a.mark - b.mark);
  return (
    <div className="flex" style={{ gap: 2, height: 16 }} title={label} role="img" aria-label={label}>
      {shown.map((item, i) => (
        <div
          key={item.mark}
          style={{
            width: `${(item.count / total) * 100}%`,
            background: DIST_COLORS[item.mark] ?? 'var(--sv-dashed)',
            borderRadius: i === 0 ? '4px 0 0 4px' : i === shown.length - 1 ? '0 4px 4px 0' : undefined,
          }}
        />
      ))}
    </div>
  );
}

/** Leniency vs colleagues on a −২…+২ mark track, centre = same as colleagues. */
export function LeniencyDot({ delta, label }: { delta: number; label: string }) {
  const clamped = Math.max(-2, Math.min(2, delta));
  return (
    <div style={{ position: 'relative', flex: 1, height: 18, minWidth: 120 }} title={label} role="img" aria-label={label}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 2, background: 'var(--sv-hairline-soft)' }} />
      <div style={{ position: 'absolute', left: '50%', top: 1, width: 1, height: 16, background: '#A8A096' }} />
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: `${((clamped + 2) / 4) * 100}%`,
          width: 12,
          height: 12,
          marginLeft: -6,
          borderRadius: '50%',
          background: 'var(--sv-text-body)',
          boxShadow: '0 0 0 2px #fff',
        }}
      />
    </div>
  );
}
