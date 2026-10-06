import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDate } from '@/lib/survey/dates';
import { strengthsAndWork } from '@/lib/survey/guardian-report-math';
import { allReportRounds, studentGuardian } from '@/lib/survey/guardian-reports';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import { pickRound, studentReport } from '@/lib/survey/reports';
import { NoRounds } from '../../../NoRounds';
import { ReportTools } from '../../../ReportTools';
import { PageTop } from '../../../../AdminShell';

export const metadata: Metadata = { title: 'অভিভাবকের জন্য প্রতিবেদন' };
export const dynamic = 'force-dynamic';

// R4-Print-Guardian: one A4 page for the guardian meeting. Marks only; no teacher names or notes.

const ink = '#1F2A2E';

/** Last rounds in black and white: guardian solid, teachers dashed; axis from the scale floor. */
function PrintTrend({ points }: { points: { label: string; guardian: number | null; teacher: number | null }[] }) {
  const left = 40;
  const right = 580;
  const top = 14;
  const bottom = 134;
  const x = (i: number) => (points.length === 1 ? (left + right) / 2 : left + 40 + (i * (right - left - 80)) / (points.length - 1));
  const y = (mark: number) => bottom - ((mark - 4) / 6) * (bottom - top);
  const line = (key: 'guardian' | 'teacher') =>
    points
      .map((p, i) => (p[key] === null ? null : `${x(i)},${y(p[key]!)}`))
      .filter(Boolean)
      .join(' ');
  const last = (key: 'guardian' | 'teacher') => [...points].reverse().find((p) => p[key] !== null)?.[key] ?? null;
  // End labels at least 16px apart: the higher series' label goes up, the other down.
  const gl = last('guardian');
  const tl = last('teacher');
  const mid = gl !== null && tl !== null ? (y(gl) + y(tl)) / 2 : 0;
  const apart = gl !== null && tl !== null && Math.abs(y(gl) - y(tl)) < 24;
  const labelY = (key: 'guardian' | 'teacher', mark: number) => {
    if (!apart) return y(mark) + 4;
    const guardianHigher = y(gl!) <= y(tl!);
    return mid + ((key === 'guardian') === guardianHigher ? -6 : 12);
  };
  const describe = (key: 'guardian' | 'teacher', name: string) =>
    `${name}: ${points
      .filter((p) => p[key] !== null)
      .map((p) => `${p.label} ${bn(p[key]!.toFixed(1))}`)
      .join(', ')}`;
  return (
    <svg viewBox="0 0 680 170" width="100%" role="img" aria-label={`${describe('guardian', 'অভিভাবক')}। ${describe('teacher', 'শিক্ষক')}`}>
      <g stroke="#D8D2C9">
        {[10, 8, 6, 4].map((m) => (
          <line key={m} x1={left} x2={right} y1={y(m)} y2={y(m)} />
        ))}
      </g>
      <g fontSize="12" fill="#3D4A53" textAnchor="end">
        {[10, 8, 6, 4].map((m) => (
          <text key={m} x={left - 8} y={y(m) + 4}>
            {bn(m)}
          </text>
        ))}
      </g>
      <g fontSize="12" fill="#3D4A53" textAnchor="middle">
        {points.map((p, i) => (
          <text key={p.label + i} x={x(i)} y={bottom + 24}>
            {p.label}
          </text>
        ))}
      </g>
      <polyline fill="none" stroke={ink} strokeWidth="2.5" points={line('guardian')} />
      <polyline fill="none" stroke={ink} strokeWidth="2.5" strokeDasharray="6 5" points={line('teacher')} />
      {/* Markers keep a single round visible: guardian filled, teachers open. */}
      {points.map((p, i) => (
        <g key={i}>
          {p.guardian !== null && <circle cx={x(i)} cy={y(p.guardian)} r="4.5" fill={ink} />}
          {p.teacher !== null && <circle cx={x(i)} cy={y(p.teacher)} r="4.5" fill="#fff" stroke={ink} strokeWidth="2" />}
        </g>
      ))}
      <g fontSize="13" fontWeight="600" fill={ink}>
        {last('guardian') !== null && (
          <text x={right + 8} y={labelY('guardian', last('guardian')!)}>
            অভিভাবক {bn(last('guardian')!.toFixed(1))}
          </text>
        )}
        {last('teacher') !== null && (
          <text x={right + 8} y={labelY('teacher', last('teacher')!)}>
            শিক্ষক {bn(last('teacher')!.toFixed(1))}
          </text>
        )}
      </g>
    </svg>
  );
}

export default async function GuardianPrintPage({ params, searchParams }: { params: Promise<{ erpId: string }>; searchParams: Promise<{ round?: string }> }) {
  const [{ erpId }, search, all] = await Promise.all([params, searchParams, allReportRounds()]);
  const round = pickRound(
    all.filter((r) => r.kind === 'T1'),
    await chosenRoundId(search.round)
  );
  if (!round) return <NoRounds />;
  const report = await studentReport(round, erpId);
  if (!report) {
    return (
      <div className="sv-card" style={{ padding: 20 }}>
        শিক্ষার্থী পাওয়া যায়নি। <Link href={`/admin/reports?round=${round.id}`}>খুঁজুন</Link>
      </div>
    );
  }
  const { student } = report;
  const guardian = await studentGuardian(round, all, erpId, student, { verifiedOnly: false });
  const guardianAreas = new Map(guardian.areas.map((a) => [a.areaKey, a]));
  const teacherAreas = new Map(report.areas.map((a) => [a.areaKey, a]));
  const areas = [...new Set([...report.areas.map((a) => a.areaKey), ...guardian.areas.map((a) => a.areaKey)])].map((key) => {
    const g = guardianAreas.get(key);
    const t = teacherAreas.get(key);
    // Class average = the teachers' (the same raters as the teacher column).
    return { key, name: (t ?? g)!.name, guardian: g?.mean ?? null, teacher: t?.mean ?? null, classMean: t?.classMean ?? null };
  });
  const { strengths, work } = strengthsAndWork(areas);
  const teacherByRound = new Map(report.trend.map((p) => [p.roundId, p.mean]));
  const trend = guardian.trend
    .map((p) => ({ label: p.label, guardian: p.mean, teacher: teacherByRound.get(p.roundId) ?? null }))
    .filter((p) => p.guardian !== null || p.teacher !== null)
    .slice(-4);
  const subjects = new Set(report.grid.filter((g) => g.marks).map((g) => g.subject)).size;
  const cell = { padding: '8px 10px', borderBottom: '1px solid #E7E3DC', fontSize: 14.5 } as const;
  const h2 = { margin: 0, fontSize: 18 } as const;

  return (
    <>
      <PageTop crumbs={[{ label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports' }, { label: student.name, href: `/admin/reports/student/${encodeURIComponent(erpId)}?round=${round.id}` }, { label: 'অভিভাবকের প্রিন্ট' }]} actions={<ReportTools printLabel="প্রিন্ট / PDF" />} />
      <article className="sv-print-sheet flex flex-col" style={{ gap: 18, color: ink }} aria-label="অভিভাবকের জন্য প্রতিবেদন">
        <header className="flex items-center justify-between" style={{ paddingBottom: 14, borderBottom: '2px solid var(--sv-bronze)' }}>
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="sv-head flex items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--sv-bronze)', color: '#fff', fontSize: 22 }}
            >
              ম
            </div>
            <div className="flex flex-col">
              <span className="sv-head" style={{ fontSize: 20 }}>
                মাদরাসাতুল কুরআন, ঢাকা
              </span>
              <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>শিক্ষার্থীর অগ্রগতি প্রতিবেদন · অভিভাবক সভা</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--sv-text-muted)' }}>
            {round.label} রাউন্ড
            <br />
            প্রস্তুত: {formatDate(new Date())}
          </div>
        </header>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="sv-head" style={{ margin: 0, fontSize: 28, lineHeight: 1.4 }}>
              {student.name}
            </h1>
            <div style={{ fontSize: 15, color: 'var(--sv-text-body)' }}>
              আইডি {bn(student.erpId)} · {student.label}
              {student.roll !== null ? ` · রোল ${bn(student.roll)}` : ''}
              {student.fatherName ? ` · পিতা: ${student.fatherName}` : ''}
            </div>
          </div>
          <dl className="flex gap-5" style={{ margin: 0, fontSize: 14 }}>
            {[
              ['অভিভাবকের মূল্যায়ন', guardian.mean],
              ['শিক্ষকদের মূল্যায়ন', report.mean],
            ].map(([label, mean]) => (
              <div key={label as string} style={{ textAlign: 'right' }}>
                <dt style={{ color: 'var(--sv-text-muted)' }}>{label}</dt>
                <dd className="sv-head" style={{ margin: 0, fontSize: 22 }}>
                  {formatMark(mean as number | null, bn)} / ১০
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="sv-head" style={h2}>ক্ষেত্রভিত্তিক মূল্যায়ন (মার্ক, ১০-এর মধ্যে)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ক্ষেত্র', 'অভিভাবক', 'শিক্ষকদের গড়', 'ক্লাসের গড়'].map((h, i) => (
                  <th key={h} scope="col" style={{ ...cell, textAlign: i ? 'right' : 'left', fontSize: 13, color: 'var(--sv-text-muted)', borderBottom: '1.5px solid #A8A096' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.name}>
                  <th scope="row" style={{ ...cell, textAlign: 'left', fontWeight: 500 }}>
                    {a.name}
                  </th>
                  {[a.guardian, a.teacher, a.classMean].map((m, i) => (
                    <td key={i} className="sv-num" style={{ ...cell, textAlign: 'right' }}>
                      {formatMark(m, bn)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 12.5, color: 'var(--sv-text-muted)' }}>
            শিক্ষকদের মূল্যায়ন {bn(subjects)}টি বিষয়ের শিক্ষকের গড়। ক্লাসের গড় = শিক্ষকদের মূল্যায়নে পুরো ক্লাসের গড়। — = এই ক্ষেত্রে মার্ক নেই।
          </div>
        </section>

        <div className="flex flex-wrap" style={{ gap: 24 }}>
          {[
            ['শক্তির দিক', strengths],
            ['একসাথে যেখানে কাজ দরকার', work],
          ].map(([title, list]) => (
            <section key={title as string} className="flex flex-col gap-2" style={{ flex: '1 1 260px' }}>
              <h2 className="sv-head" style={h2}>{title as string}</h2>
              <div style={{ fontSize: 15, lineHeight: 1.65 }}>{(list as string[]).length ? (list as string[]).join(' · ') : '—'}</div>
            </section>
          ))}
        </div>

        {trend.length >= 2 && (
          <section className="flex flex-col gap-1.5">
            <h2 className="sv-head" style={h2}>গত {bn(trend.length)} রাউন্ড (মার্ক)</h2>
            <PrintTrend points={trend} />
            <div style={{ fontSize: 12.5, color: 'var(--sv-text-muted)' }}>অক্ষ ৪ থেকে ১০; সাদা-কালো প্রিন্টে পড়ার জন্য অভিভাবক = টানা রেখা ও ভরা বিন্দু, শিক্ষক = ভাঙা রেখা ও ফাঁকা বিন্দু।</div>
          </section>
        )}

        <section className="flex flex-col gap-1.5">
          <h2 className="sv-head" style={h2}>সভার নোট</h2>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 30, borderBottom: '1px solid #A8A096' }} />
          ))}
        </section>

        <div className="grid grid-cols-3 gap-6" style={{ marginTop: 28, fontSize: 14, color: 'var(--sv-text-body)', textAlign: 'center' }}>
          {['শ্রেণি শিক্ষক', 'প্রিন্সিপাল', 'অভিভাবক'].map((who) => (
            <div key={who} style={{ borderTop: `1px solid ${ink}`, paddingTop: 6 }}>
              {who}
            </div>
          ))}
        </div>
        <footer style={{ fontSize: 12, color: 'var(--sv-text-muted)', textAlign: 'center' }}>এই প্রতিবেদনে শিক্ষকদের নাম ও ব্যক্তিগত নোট অন্তর্ভুক্ত নয়।</footer>
      </article>
    </>
  );
}
