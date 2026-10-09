import { toBengaliDigits as bn } from '@/lib/survey/normalise';

// Hand-built charts for the T1 reports. Teacher marks are one series (#2F6FA3), so no legend box;
// axes start at the scale floor (৪) and the unit is the mark out of ১০.

const TEACHER = '#2F6FA3';
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

/** Mark chips for the student page's answers: ১০ sage, ৮ grey, ৬–৭ light amber, ৪–৫ strong amber (between steps goes down). */
export function markTone(mark: number | null): { bg: string; fg: string } {
  if (mark === null) return { bg: 'transparent', fg: 'var(--sv-icon-muted)' };
  if (mark >= 10) return { bg: '#E4F0E8', fg: '#24503F' };
  if (mark >= 8) return { bg: '#EFECE6', fg: '#1F2A2E' };
  if (mark >= 6) return { bg: '#FBF1E6', fg: '#8A4416' };
  return { bg: '#F0C9A4', fg: '#6B3410' };
}

/** One mark (or an average, one decimal) as a chip; null shows a dot. */
export function MarkChip({ mark, average = false }: { mark: number | null; average?: boolean }) {
  const tone = markTone(mark);
  return (
    <span className={`sv-mark${average ? ' is-avg' : ''}`} style={{ background: tone.bg, color: tone.fg }}>
      {mark === null ? (average ? '—' : '·') : bn(average ? mark.toFixed(1) : String(mark))}
    </span>
  );
}

/** Distribution colours (R5): ৪ rust → ১০ teacher blue; text stays in ink, the legend names them. */
export const DIST_COLORS: Record<number, string> = { 4: '#B0521A', 6: '#E59A5B', 8: '#8DB4DB', 10: '#2F6FA3' };

/** The key for Distribution bars: one swatch per mark. */
export function DistLegend() {
  return (
    <div className="flex gap-3 text-[12.5px] text-muted-foreground" aria-hidden="true">
      {[4, 6, 8, 10].map((m) => (
        <span key={m} className="flex items-center gap-1">
          <span className="size-2.5 rounded-[2px]" style={{ background: DIST_COLORS[m] }} />
          {bn(m)}
        </span>
      ))}
    </div>
  );
}

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

export const GUARDIAN = '#B86A2E';
export const TEACHING = '#3A6B5D';
/** A heatmap cell is marked ⚠ when at least this share of its answers are low (৭ or less). */
export const MANY_LOW = 0.25;

/** Sage sequential ramp for the teaching-quality heatmap (G1); greyed when hidden (n < 3). */
export function teachingCell(mean: number | null, hidden = false): { bg: string; fg: string } {
  if (hidden || mean === null) return { bg: 'var(--sv-stone-soft)', fg: 'var(--sv-text-muted)' };
  if (mean >= 8.5) return { bg: TEACHING, fg: '#FFFFFF' };
  if (mean >= 7.5) return { bg: '#9DC4B2', fg: '#1F2A2E' };
  if (mean >= 6.5) return { bg: '#CFE2D9', fg: '#1F2A2E' };
  return { bg: '#EEF4F1', fg: '#1F2A2E' };
}

/** Guardian (G2) vs teacher (T1) average per round, both lines labelled at the end (R1). */
export function PairTrendChart({ points, width = 620 }: { points: { label: string; guardian: number | null; teacher: number | null }[]; width?: number }) {
  const w = width;
  const h = 250;
  const left = 44;
  const right = w - 60;
  const top = 20;
  const bottom = 220;
  const x = (i: number) => (points.length === 1 ? (left + right) / 2 : left + 26 + (i * (right - left - 52)) / (points.length - 1));
  const y = (mark: number) => bottom - pos(mark) * (bottom - top);
  const series = [
    { key: 'guardian' as const, color: GUARDIAN, name: 'অভিভাবকের রিভিউ' },
    { key: 'teacher' as const, color: TEACHER, name: 'শিক্ষকের রিভিউ' },
  ];
  const description = series
    .map((s) => `${s.name}: ${points.map((p) => `${p.label} ${p[s.key] === null ? '—' : bn(p[s.key]!.toFixed(1))}`).join(', ')}`)
    .join('। ');
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-4" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }} aria-hidden="true">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span style={{ width: 14, height: 3, borderRadius: 2, background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${w} ${h + 20}`} width="100%" role="img" aria-label={description}>
        <g stroke="var(--sv-hairline)">
          {[10, 8, 6, 4].map((m) => (
            <line key={m} x1={left} x2={right} y1={y(m)} y2={y(m)} />
          ))}
        </g>
        <g fill="var(--sv-text-muted)" fontSize="12" textAnchor="end">
          {[10, 8, 6, 4].map((m) => (
            <text key={m} x={left - 8} y={y(m) + 4}>
              {bn(m)}
            </text>
          ))}
        </g>
        <g fill="var(--sv-text-muted)" fontSize="12" textAnchor="middle">
          {points.map((p, i) => (
            <text key={p.label + i} x={x(i)} y={h + 12}>
              {p.label}
            </text>
          ))}
        </g>
        {series.map((s) => {
          const shown = points.map((p, i) => ({ i, v: p[s.key] })).filter((p): p is { i: number; v: number } => p.v !== null);
          if (!shown.length) return null;
          const last = shown[shown.length - 1];
          return (
            <g key={s.key}>
              <polyline fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" points={shown.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} />
              {shown.map((p) => (
                <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={p === last ? 5 : 3.5} fill={s.color} stroke="#fff" strokeWidth="2">
                  <title>{`${s.name} · ${points[p.i].label}: ${bn(p.v.toFixed(1))}`}</title>
                </circle>
              ))}
              <text x={x(last.i) + 10} y={y(last.v) + 4} fontSize="13" fontWeight="600" fill="var(--sv-text)">
                {bn(last.v.toFixed(1))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** The class page marks an area when guardian and teachers are at least this many marks apart. */
export const AREA_GAP_MARKS = 1;
