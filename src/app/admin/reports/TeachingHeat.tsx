import Link from 'next/link';
import type { teachingQuality } from '@/lib/survey/guardian-reports';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { LOW_TEACHING, teachingCell as cellColour } from './charts';

type Report = Awaited<ReturnType<typeof teachingQuality>>;
type Row = Report['rows'][number];

/** Class × subject heatmap of G1 means (R1, R2): each cell links on; n < 3 shows "—". */
export function TeachingHeat({
  report,
  href,
  selected,
}: {
  report: Report;
  href: (row: Row, subjectKey: string) => string;
  selected?: { classKey: string; sectionKey: string; subjectKey: string } | null;
}) {
  const subjectName = (key: string) => report.subjects.find((s) => s.key === key)?.name ?? key;
  return (
    <div role="region" aria-label="শ্রেণি ও বিষয়ভিত্তিক গড় মার্কের টেবিল" tabIndex={0} style={{ overflowX: 'auto' }}>
      <table className="sv-heat">
        <caption className="sv-visually-hidden">প্রতিটি শ্রেণি ও বিষয়ে অভিভাবকদের গড় মার্ক (১০-এর মধ্যে) ও উত্তরদাতা অভিভাবকের সংখ্যা</caption>
        <thead>
          <tr>
            <td />
            {report.subjects.map((s) => (
              <th key={s.key} scope="col">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr key={`${row.classKey}|${row.sectionKey}`}>
              <th scope="row">{row.label}</th>
              {row.cells.map((cell, i) => {
                if (!cell)
                  return (
                    <td key={report.subjects[i].key}>
                      <span className="sv-visually-hidden">নেই</span>
                    </td>
                  );
                const hidden = !cell.reliable;
                const colour = cellColour(cell.mean, hidden);
                const low = !hidden && cell.mean !== null && cell.mean < LOW_TEACHING;
                const label = hidden
                  ? `${row.label} · ${subjectName(cell.subjectKey)}: ${bn(cell.respondents)} জন উত্তরদাতা, ফলাফল লুকানো`
                  : `${row.label} · ${subjectName(cell.subjectKey)}: গড় ${formatMark(cell.mean, bn)}, ${bn(cell.respondents)} জন উত্তরদাতা${low ? ', ৬.৫-এর নিচে' : ''}`;
                const current = selected && selected.classKey === row.classKey && selected.sectionKey === row.sectionKey && selected.subjectKey === cell.subjectKey;
                return (
                  <td key={cell.subjectKey}>
                    <Link
                      href={href(row, cell.subjectKey)}
                      aria-label={label}
                      aria-current={current ? 'true' : undefined}
                      className="sv-heat-cell"
                      style={{ background: colour.bg, color: colour.fg, outline: current ? '3px solid var(--sv-bronze)' : undefined }}
                    >
                      <span className="sv-num" style={{ fontSize: 15 }}>
                        {low && '▲ '}
                        {hidden ? '—' : formatMark(cell.mean, bn)}
                      </span>
                      <span style={{ fontSize: 11.5 }}>n={bn(cell.respondents)}</span>
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
