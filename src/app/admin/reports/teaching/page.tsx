import type { Metadata } from 'next';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import { pairedRound } from '@/lib/survey/guardian-report-math';
import { allReportRounds, pickKindRound, previousRound, teachingCell, teachingQuality } from '@/lib/survey/guardian-reports';
import { formatDateTime } from '@/lib/survey/dates';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { classLabel } from '@/lib/survey/snapshot';
import { DIST_COLORS, Distribution, TEACHING } from '../charts';
import { ReportFilters } from '../ReportFilters';
import { ReportTools } from '../ReportTools';
import { TeachingHeat } from '../TeachingHeat';
import { PageTop } from '../../AdminShell';

export const metadata: Metadata = { title: 'শিক্ষার মান' };
export const dynamic = 'force-dynamic';

type Search = { round?: string; compare?: string; area?: string; verified?: string; cell?: string };

const signed = (d: number | null) => (d === null || d === 0 ? '' : `${d > 0 ? '▲' : '▼'} ${bn(Math.abs(d).toFixed(1))}`);

export default async function TeachingPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [search, rounds] = await Promise.all([searchParams, allReportRounds()]);
  // The class-management round: the one picked here, else the one paired with the sidebar's teacher round.
  const t1 = pickKindRound(rounds, 'T1', await chosenRoundId());
  const picked = rounds.some((r) => r.kind === 'G1' && r.id === search.round) ? search.round : undefined;
  const g1 = pickKindRound(rounds, 'G1', picked ?? (t1 ? pairedRound(t1, rounds, 'G1')?.id : undefined));
  if (!g1) {
    return (
      <>
        <PageTop crumbs={[{ label: 'রিপোর্ট' }, { label: 'শিক্ষার মান' }]} />
        <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
          শিক্ষার মান
        </h1>
        <div className="sv-card" style={{ padding: 20 }}>
          এখনো কোনো “ক্লাস পরিচালনা” অভিভাবক রাউন্ড খোলা হয়নি।
        </div>
      </>
    );
  }
  const earlier = rounds.filter((r) => r.kind === 'G1' && r.opensAt < g1.opensAt);
  const compare = search.compare === 'none' ? undefined : (earlier.find((r) => r.id === search.compare) ?? previousRound(rounds, g1));
  const verifiedOnly = search.verified === '1';
  const areaKey = g1.snapshot.areas.some((a) => a.key === search.area) ? search.area : undefined;
  const report = await teachingQuality(g1, compare, { verifiedOnly, areaKey }, rounds);
  const [cClass, cSection, cSubject] = (search.cell ?? '').split('|');
  const cellAt = cClass && cSubject ? { classKey: cClass, sectionKey: cSection ?? '', subjectKey: cSubject } : null;
  const validCell = cellAt && report.rows.some((r) => r.classKey === cellAt.classKey && r.sectionKey === cellAt.sectionKey && r.cells.some((c) => c?.subjectKey === cellAt.subjectKey));
  const detail = cellAt && validCell ? await teachingCell(g1, compare, cellAt, { verifiedOnly }) : null;
  const subjectName = (key: string) => report.subjects.find((s) => s.key === key)?.name ?? key;
  const query = (extra: Record<string, string>) =>
    `/admin/reports/teaching?${new URLSearchParams({ round: g1.id, compare: compare?.id ?? 'none', ...(areaKey ? { area: areaKey } : {}), ...(verifiedOnly ? { verified: '1' } : {}), ...extra })}`;

  return (
    <>
      <PageTop crumbs={[{ label: 'রিপোর্ট' }, { label: 'শিক্ষার মান' }]} actions={<ReportTools exportHref={`/admin/reports/export?${new URLSearchParams({ kind: 'teaching', round: g1.id, compare: compare?.id ?? 'none', ...(areaKey ? { area: areaKey } : {}), ...(verifiedOnly ? { verified: '1' } : {}) })}`} />} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
            শিক্ষার মান
          </h1>
          <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>
            {g1.snapshot.template.title} · {g1.label} · {bn(report.respondents)} জন শিক্ষার্থীর অভিভাবক{verifiedOnly ? ' · শুধু যাচাইকৃত' : ''}
          </div>
        </div>
      </div>

      <ReportFilters
        action="/admin/reports/teaching"
        verifiedOnly={verifiedOnly}
        selects={[
          { name: 'round', label: 'ক্লাস পরিচালনার রিভিউ', value: g1.id, options: [...rounds].reverse().filter((r) => r.kind === 'G1').map((r) => ({ value: r.id, label: r.label })) },
          { name: 'compare', label: 'তুলনা', value: compare?.id ?? 'none', options: [{ value: 'none', label: 'তুলনা নয়' }, ...[...earlier].reverse().map((r) => ({ value: r.id, label: r.label }))] },
          { name: 'area', label: 'ক্ষেত্র', value: areaKey ?? '', options: [{ value: '', label: 'সব ক্ষেত্র' }, ...g1.snapshot.areas.filter((a) => a.group === 'teaching').map((a) => ({ value: a.key, label: a.name }))] },
        ]}
      />

      <div className="sv-split">
        <section className="sv-card flex flex-col gap-3" style={{ minWidth: 0 }} aria-labelledby="heat-title">
          <div className="flex flex-col gap-0.5">
            <h2 id="heat-title" className="sv-head sv-h2">
              শ্রেণি × বিষয় · গড় মার্ক
            </h2>
            <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>যেকোনো ঘরে চাপ দিলে বিস্তারিত দেখাবে</div>
          </div>
          <TeachingHeat
            report={report}
            href={(row, subjectKey) => `${query({ cell: `${row.classKey}|${row.sectionKey}|${subjectKey}` })}#detail`}
            selected={detail && cellAt ? cellAt : null}
          />
          <div className="flex flex-wrap gap-4" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
            <span>⚠ = অন্তত ২৫% উত্তর ৭ বা কম</span>
            <span>জন = উত্তর দেওয়া অভিভাবক · ৩ জনের কম হলে ফলাফল লুকানো</span>
          </div>
          <h3 style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 600 }}>ক্ষেত্রভিত্তিক গড় · পুরো মাদরাসা</h3>
          <dl className="grid gap-2" style={{ margin: 0, gridTemplateColumns: 'minmax(160px, 220px) 1fr 64px', alignItems: 'center' }}>
            {report.areas.map((a) => (
              <div key={a.key} className="contents">
                <dt style={{ fontSize: 14 }}>{a.name}</dt>
                <dd style={{ margin: 0, height: 8, borderRadius: 4, background: 'var(--sv-hairline-soft)', overflow: 'hidden' }} aria-hidden="true">
                  <span style={{ display: 'block', height: 8, background: TEACHING, width: `${a.mean === null ? 0 : ((a.mean - 4) / 6) * 100}%` }} />
                </dd>
                <dd className="sv-num" style={{ margin: 0, fontSize: 14, textAlign: 'right' }}>
                  {formatMark(a.mean, bn)}
                  {signed(a.delta) && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--sv-text-muted)' }}>{signed(a.delta)}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="detail" className="sv-card flex flex-col gap-3" style={{ flex: '1 1 340px', minWidth: 0 }} aria-labelledby="detail-title">
          {!detail || !cellAt ? (
            <>
              <h2 id="detail-title" className="sv-head sv-h2">
                নির্বাচিত ঘর
              </h2>
              <p className="sv-muted" style={{ margin: 0 }}>
                টেবিলের কোনো ঘরে চাপ দিলে সেই শ্রেণি ও বিষয়ের প্রশ্নভিত্তিক মার্ক ও অভিভাবকদের মন্তব্য এখানে দেখাবে।
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-0.5">
                <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>নির্বাচিত ঘর</div>
                <h2 id="detail-title" className="sv-head sv-h2">
                  {classLabel(g1.snapshot, cellAt.classKey, cellAt.sectionKey)} · {subjectName(cellAt.subjectKey)}
                </h2>
                <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>
                  শিক্ষক:{' '}
                  {report.rows.find((r) => r.classKey === cellAt.classKey && r.sectionKey === cellAt.sectionKey)?.cells.find((c) => c?.subjectKey === cellAt.subjectKey)?.teacher ??
                    'এই সময়ের শিক্ষক রিভিউতে জমা নেই'}
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-2" style={{ margin: 0 }}>
                {[
                  ['গড় মার্ক', detail.reliable ? formatMark(detail.mean, bn) : '—', detail.reliable && signed(detail.delta) ? `${signed(detail.delta)} (${compare?.label})` : ''],
                  ['উত্তরদাতা', bn(detail.respondents), `${bn(detail.classSize)} জনের মধ্যে`],
                  ['৭ বা কম দিয়েছেন', detail.reliable && detail.lowShare !== null ? `${bn(Math.round(detail.lowShare * 100))}%` : '—', 'সব উত্তরের'],
                ].map(([label, value, note]) => (
                  <div key={label} className="flex flex-col gap-0.5" style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--sv-stone-soft)' }}>
                    <dt style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{label}</dt>
                    <dd className="sv-num" style={{ margin: 0, fontSize: 22 }}>
                      {value}
                    </dd>
                    {note && <dd style={{ margin: 0, fontSize: 12.5, color: 'var(--sv-text-muted)' }}>{note}</dd>}
                  </div>
                ))}
              </dl>
              {!detail.reliable ? (
                <p className="sv-muted" style={{ margin: 0 }}>
                  ৩ জনের কম অভিভাবক উত্তর দিয়েছেন, তাই বিস্তারিত লুকানো।
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>প্রশ্নভিত্তিক মার্কের বণ্টন</h3>
                    <div className="flex gap-3" style={{ fontSize: 12.5, color: 'var(--sv-text-muted)' }} aria-hidden="true">
                      {[4, 6, 8, 10].map((m) => (
                        <span key={m} className="flex items-center gap-1">
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: DIST_COLORS[m] }} />
                          {bn(m)}
                        </span>
                      ))}
                    </div>
                  </div>
                  {detail.questions.map((q, i) => (
                    <div key={q.questionKey} className="grid items-center gap-2" style={{ gridTemplateColumns: 'minmax(0, 1fr) 120px 36px', fontSize: 13.5 }}>
                      <span>
                        {bn(i + 1)}. {q.label}
                      </span>
                      <Distribution items={q.counts} label={`${q.label}: ${q.counts.map((c) => `${bn(c.mark)} মার্ক ${bn(c.count)}টি`).join(', ')}`} />
                      <span className="sv-num" style={{ textAlign: 'right' }}>
                        {formatMark(q.mean, bn)}
                      </span>
                    </div>
                  ))}
                </>
              )}
              <h3 style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 600 }}>এই শ্রেণির অভিভাবকদের মন্তব্য</h3>
              {detail.comments.length === 0 && <p className="sv-muted" style={{ margin: 0 }}>কোনো মন্তব্য নেই।</p>}
              {detail.comments.map((c, i) => (
                <div key={i} className="flex flex-col gap-1" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--sv-hairline)', fontSize: 14 }}>
                  <div className="flex flex-wrap gap-2" style={{ fontSize: 13 }}>
                    <b>
                      {c.who} ({c.relation})
                    </b>
                    <span className="sv-muted">{c.child}</span>
                    <span style={{ color: c.verified ? 'var(--sv-ok)' : 'var(--sv-warn)' }}>{c.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত'}</span>
                    <span className="sv-muted">{c.submittedAt ? formatDateTime(c.submittedAt) : ''}</span>
                  </div>
                  <div style={{ lineHeight: 1.6 }}>{c.text}</div>
                </div>
              ))}
            </>
          )}
        </section>
      </div>
    </>
  );
}
