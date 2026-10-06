import { score100 } from '@/lib/survey/guardian-report-math';
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

export const GUARDIAN = '#B86A2E';
export const TEACHING = '#3A6B5D';
/** A teaching-quality (G1) mean below this is marked ▲ (R1/R2). */
export const LOW_TEACHING = 6.5;

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
    { key: 'guardian' as const, color: GUARDIAN, name: 'G2 অভিভাবকের চোখে' },
    { key: 'teacher' as const, color: TEACHER, name: 'T1 শিক্ষকের চোখে' },
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

// Guardian ↔ teacher comparisons use the 0–100 score (spec §7): (mark − ৪) ÷ ৬ × ১০০.
const score = (mark: number) => Math.max(0, Math.min(100, score100(mark)));
/** The R3 frame marks an area when guardian and teachers are this many points apart. */
export const AREA_GAP_POINTS = 15;

/** One area: guardian dot, teacher dot, the span between them and an optional class-average tick. */
export function PairBar({
  guardian,
  teacher,
  reference,
  muted = {},
  label,
}: {
  guardian: number | null;
  teacher: number | null;
  reference?: number | null;
  /** A side with fewer than 3 children: drawn faint (spec §7 greys n < 3). */
  muted?: { guardian?: boolean; teacher?: boolean };
  label: string;
}) {
  const dot = (mark: number, color: string, faint?: boolean) => (
    <div
      style={{ position: 'absolute', top: 3, left: `${score(mark)}%`, width: 14, height: 14, marginLeft: -7, borderRadius: '50%', background: color, boxShadow: '0 0 0 2px #fff', opacity: faint ? 0.35 : 1 }}
    />
  );
  return (
    <div style={{ position: 'relative', height: 20 }} title={label} role="img" aria-label={label}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 2, background: 'var(--sv-hairline-soft)' }} />
      {guardian !== null && teacher !== null && (
        <div style={{ position: 'absolute', top: 8, height: 4, background: 'var(--sv-hairline)', left: `${score(Math.min(guardian, teacher))}%`, width: `${Math.abs(score(guardian) - score(teacher))}%` }} />
      )}
      {reference != null && <div style={{ position: 'absolute', top: 1, left: `${score(reference)}%`, width: 3, height: 18, marginLeft: -1, background: 'var(--sv-text-body)' }} />}
      {guardian !== null && dot(guardian, GUARDIAN, muted.guardian)}
      {teacher !== null && dot(teacher, TEACHER, muted.teacher)}
    </div>
  );
}

export function ScoreAxis() {
  return (
    <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }} aria-hidden="true">
      <span>০</span>
      <span>৫০</span>
      <span>১০০</span>
    </div>
  );
}

/** R3 scatter: each child's guardian score (x) against the teachers' (y); lines at mark ৮. */
export function GapScatter({ points }: { points: { erpId: string; name: string; guardian: number; teacher: number; flagged: boolean }[] }) {
  const left = 50;
  const right = 480;
  const top = 40;
  const bottom = 360;
  const x = (mark: number) => left + (score(mark) / 100) * (right - left);
  const y = (mark: number) => bottom - (score(mark) / 100) * (bottom - top);
  const ticks = [0, 50, 100];
  // Names of flagged children beside their dots, kept inside the plot: right-aligned near the right
  // edge; below the dot, else above, else further out, skipping places another name already took.
  const labels: { erpId: string; name: string; x: number; y: number; end: boolean; width: number }[] = [];
  for (const p of [...points].filter((q) => q.flagged).sort((a, b) => a.guardian - b.guardian)) {
    // Rough text width at 12px bold; Bengali letters run wider than Latin.
    const width = p.name.length * (/[\u0980-\u09FF]/.test(p.name) ? 9 : 7);
    const end = x(p.guardian) + width > right - 4;
    const lx = end ? x(p.guardian) + 10 : x(p.guardian) - 10;
    const span = (l: { x: number; end: boolean; width: number }) => (l.end ? [l.x - l.width, l.x] : [l.x, l.x + l.width]);
    const [a0, a1] = span({ x: lx, end, width });
    const free = (ly: number) => ly > top + 12 && ly < bottom - 4 && !labels.some((l) => Math.abs(l.y - ly) < 15 && span(l)[0] < a1 && a0 < span(l)[1]);
    const dy = y(p.teacher);
    const ly = [22, -12, 37, -27, 52, -42].map((d) => dy + d).find(free) ?? Math.min(Math.max(dy + 22, top + 14), bottom - 6);
    labels.push({ erpId: p.erpId, name: p.name, x: lx, y: ly, end, width });
  }
  return (
    <svg viewBox="0 0 500 410" width="100%" style={{ maxWidth: 560 }} role="img" aria-label={`${bn(points.length)} জন শিক্ষার্থীর অভিভাবক ও শিক্ষকের স্কোর; বিস্তারিত নিচের তালিকায়`}>
      <rect x={left} y={top} width={right - left} height={bottom - top} fill="#fff" />
      <g stroke="var(--sv-icon-muted)" strokeDasharray="4 4">
        <line x1={x(8)} y1={top} x2={x(8)} y2={bottom} />
        <line x1={left} y1={y(8)} x2={right} y2={y(8)} />
      </g>
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="var(--sv-hairline)" />
      <line x1={left} y1={top} x2={left} y2={bottom} stroke="var(--sv-hairline)" />
      <g fill="var(--sv-text-muted)" fontSize="12">
        {ticks.map((t) => (
          <text key={`x${t}`} x={left + (t / 100) * (right - left)} y={bottom + 18} textAnchor="middle">
            {bn(t)}
          </text>
        ))}
        {ticks.map((t) => (
          <text key={`y${t}`} x={left - 8} y={bottom - (t / 100) * (bottom - top) + 4} textAnchor="end">
            {bn(t)}
          </text>
        ))}
      </g>
      <text x={(left + right) / 2} y={bottom + 40} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--sv-text-body)">
        অভিভাবকের স্কোর (G2) →
      </text>
      <text x={14} y={(top + bottom) / 2} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--sv-text-body)" transform={`rotate(-90 14 ${(top + bottom) / 2})`}>
        শিক্ষকের স্কোর (T1) →
      </text>
      <g fontSize="12.5" fill="var(--sv-text-muted)" textAnchor="end">
        <text x={right - 8} y={top + 18}>দুই দিকেই ভালো</text>
        <text x={right - 8} y={y(8) + 20}>অভিভাবক বেশি দেখছেন</text>
        <text x={x(8) - 8} y={top + 18}>শিক্ষক বেশি দেখছেন</text>
        <text x={x(8) - 8} y={y(8) + 20}>দুই দিকেই দুর্বল</text>
      </g>
      <text x={x(8)} y={top - 7} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--sv-text-muted)">
        মার্ক ৮
      </text>
      {points.map((p) => (
        <circle key={p.erpId} cx={x(p.guardian)} cy={y(p.teacher)} r={p.flagged ? 7 : 5} fill={p.flagged ? '#8A4416' : TEACHER} stroke="#fff" strokeWidth="2">
          <title>{`${p.name}: অভিভাবক ${bn(Math.round(score(p.guardian)))}, শিক্ষক ${bn(Math.round(score(p.teacher)))}`}</title>
        </circle>
      ))}
      {labels.map((l) => (
        <text key={`n${l.erpId}`} x={l.x} y={l.y} textAnchor={l.end ? 'end' : 'start'} fontSize="12" fontWeight="600" fill="var(--sv-text)">
          {l.name}
        </text>
      ))}
    </svg>
  );
}
