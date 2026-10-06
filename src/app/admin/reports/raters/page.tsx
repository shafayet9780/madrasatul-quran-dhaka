import type { Metadata } from 'next';
import { MARK_FLOOR } from '@/lib/survey/scoring';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { pickRound, raterReport, t1Rounds } from '@/lib/survey/reports';
import { MIN_N } from '@/lib/survey/stats';
import { RoundPicker } from '../../RoundPicker';
import { DIST_COLORS, Distribution, LeniencyDot } from '../charts';
import { NoRounds } from '../NoRounds';
import { ReportTools } from '../ReportTools';

export const metadata: Metadata = { title: 'শিক্ষকদের রেটিং প্যাটার্ন' };
export const dynamic = 'force-dynamic';

const signed = (delta: number) => `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${bn(Math.abs(delta).toFixed(1))}`;

/** How far from colleagues (marks) still reads as "like colleagues" in the summary sentence. */
const LIKE_COLLEAGUES = 0.5;

/** One plain sentence per teacher: generosity against colleagues on the same students, ৪s, same-mark batches. */
function verdict(r: { leniency: { delta: number; pairedStudents: number } | null; distribution: { mark: number; count: number }[]; n: number; flatBatches: unknown[] }) {
  const parts: string[] = [];
  // The rounded number decides, as the "সহকর্মীদের তুলনায়" column shows it.
  const delta = r.leniency ? Math.round(r.leniency.delta * 10) / 10 : 0;
  if (!r.leniency || r.leniency.pairedStudents < MIN_N) parts.push('তুলনার মতো যথেষ্ট সহকর্মী নেই');
  else if (delta >= LIKE_COLLEAGUES) parts.push(`সহকর্মীদের চেয়ে গড়ে ${bn(delta.toFixed(1))} মার্ক বেশি দেন`);
  else if (delta <= -LIKE_COLLEAGUES) parts.push(`সহকর্মীদের চেয়ে গড়ে ${bn(Math.abs(delta).toFixed(1))} মার্ক কম দেন`);
  else parts.push('সহকর্মীদের মতোই মার্ক দেন');
  const lowest = r.distribution.find((d) => d.mark === MARK_FLOOR)?.count ?? 0;
  if (r.n) parts.push(`${bn(Math.round((lowest / r.n) * 100))}% উত্তরে ৪ দিয়েছেন`);
  if (r.flatBatches.length) parts.push('কোনো ক্লাসে প্রায় সবাইকে একই মার্ক — দেখে নিন');
  return parts.join(' · ');
}

export default async function RatersPage({ searchParams }: { searchParams: Promise<{ round?: string }> }) {
  const [search, rounds] = await Promise.all([searchParams, t1Rounds()]);
  const round = pickRound(rounds, search.round);
  if (!round) return <NoRounds />;
  const rows = await raterReport(round);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
            শিক্ষকদের রেটিং প্যাটার্ন
          </h1>
          <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>শিক্ষকের রিভিউ · {round.label} · কে কেমন মার্ক দেন, যাতে তুলনা ন্যায্য হয়</div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="sv-no-print">
            <RoundPicker rounds={[...rounds].reverse().map((r) => ({ id: r.id, label: r.label }))} value={round.id} basePath="/admin/reports/raters" />
          </span>
          <ReportTools exportHref={`/admin/reports/export?${new URLSearchParams({ kind: 'raters', round: round.id })}`} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="sv-card flex gap-3 items-start" style={{ flex: '1 1 260px', padding: '14px 16px', fontSize: 14, lineHeight: 1.55 }}>
          <span aria-hidden="true" className="flex items-center justify-center" style={{ flex: 'none', width: 34, height: 34, borderRadius: 10, background: 'var(--sv-info-bg)', color: 'var(--sv-info)', fontWeight: 600 }}>
            ±
          </span>
          <div>
            <b>সহকর্মীদের তুলনায়</b>: একই শিক্ষার্থীদের অন্য শিক্ষকেরা যে মার্ক দিয়েছেন, তার সাথে গড় পার্থক্য। + মানে বেশি উদার।
          </div>
        </div>
        <div className="sv-card flex gap-3 items-start" style={{ flex: '1 1 260px', padding: '14px 16px', fontSize: 14, lineHeight: 1.55 }}>
          <span aria-hidden="true" className="flex items-center justify-center" style={{ flex: 'none', width: 34, height: 34, borderRadius: 10, background: 'var(--sv-warn-bg)', color: 'var(--sv-warn)', fontWeight: 600 }}>
            ⚠
          </span>
          <div>
            <b>একই মার্ক</b>: কোনো ক্লাস-বিষয়ে ১০+ শিক্ষার্থীর ৯০% বা বেশি উত্তরে একই মার্ক হলে চিহ্নিত হয়। ভালো ক্লাসে এটা স্বাভাবিকও হতে পারে — অভিযোগ নয়, দেখে নেওয়ার বিষয়।
          </div>
        </div>
      </div>

      <section className="sv-card flex flex-col gap-3" aria-labelledby="raters-title">
        <div className="flex flex-wrap justify-between gap-2.5 items-center">
          <h2 id="raters-title" className="sv-head sv-h2">
            শিক্ষকভিত্তিক সারাংশ
          </h2>
          <div className="flex gap-2.5" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }} aria-label="মার্কের রং">
            {Object.entries(DIST_COLORS).map(([mark, color]) => (
              <span key={mark} className="flex items-center gap-1">
                <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                {bn(mark)}
              </span>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--sv-text-muted)' }}>এই রাউন্ডে এখনো কোনো জমা নেই।</p>
        ) : (
          <div role="region" aria-label="শিক্ষকভিত্তিক সারাংশের টেবিল" tabIndex={0} style={{ overflowX: 'auto' }}>
            <table className="sv-table is-stackable" style={{ minWidth: 980 }}>
              <thead>
                <tr>
                  <th scope="col">শিক্ষক</th>
                  <th scope="col" style={{ width: 260 }}>
                    সারকথা
                  </th>
                  <th scope="col">ক্লাস-বিষয়</th>
                  <th scope="col">শিক্ষার্থী</th>
                  <th scope="col">গড় মার্ক</th>
                  <th scope="col" style={{ width: 240 }}>
                    মার্কের বণ্টন
                  </th>
                  <th scope="col" style={{ width: 220 }}>
                    সহকর্মীদের তুলনায়
                  </th>
                  <th scope="col">একই মার্ক</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const distLabel = r.distribution.map((d) => `${bn(d.mark)}: ${bn(d.count)}টি`).join(', ');
                  return (
                    <tr key={r.teacherKey}>
                      <td data-label="শিক্ষক" style={{ fontWeight: 600 }}>
                        {r.name}
                      </td>
                      <td data-label="সারকথা" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                        {verdict(r)}
                      </td>
                      <td data-label="ক্লাস-বিষয়" className="sv-num">
                        {bn(r.batches)}
                      </td>
                      <td data-label="শিক্ষার্থী" className="sv-num">
                        {bn(r.students)}
                      </td>
                      <td data-label="গড়" className="sv-num" style={{ color: r.students < MIN_N ? 'var(--sv-text-muted)' : undefined }}>
                        {formatMark(r.mean, bn)}
                        {r.students < MIN_N && <span style={{ fontSize: 12, fontWeight: 400 }}> (n&lt;৩)</span>}
                      </td>
                      <td data-label="বণ্টন">
                        <Distribution items={r.distribution} label={`${r.name}: ${distLabel}`} />
                      </td>
                      <td data-label="তুলনা">
                        {r.leniency ? (
                          <div className="flex items-center gap-2.5">
                            <LeniencyDot
                              delta={r.leniency.delta}
                              label={`${r.name}: সহকর্মীদের তুলনায় ${signed(r.leniency.delta)} মার্ক, ${bn(r.leniency.pairedStudents)} জন শিক্ষার্থীর তুলনায়`}
                            />
                            <span className="sv-num" style={{ width: 64, textAlign: 'right', color: r.leniency.pairedStudents < MIN_N ? 'var(--sv-text-muted)' : undefined }}>
                              {signed(r.leniency.delta)}
                              {r.leniency.pairedStudents < MIN_N && <span style={{ fontSize: 12, fontWeight: 400 }}> (n&lt;৩)</span>}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>তুলনার মতো সহকর্মী নেই</span>
                        )}
                      </td>
                      <td data-label="একই মার্ক">
                        {r.flatBatches.length ? (
                          <div className="flex flex-col gap-1">
                            {r.flatBatches.map((b) => (
                              <span key={b.label} className="sv-flag">
                                ⚠ {b.label} · {bn(Math.round(b.share * 100))}% {b.mark !== null ? bn(b.mark) : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', textAlign: 'right' }}>সহকর্মীদের তুলনায়: কঠোর ← ০ → উদার (মার্ক, −২ থেকে +২)</div>
      </section>
    </>
  );
}
