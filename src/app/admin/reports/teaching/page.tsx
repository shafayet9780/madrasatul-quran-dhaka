import type { Metadata } from 'next';
import Link from 'next/link';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import { pairedRound } from '@/lib/survey/guardian-report-math';
import {
  allReportRounds,
  pickKindRound,
  previousRound,
  teachingCell,
  teachingQuality,
} from '@/lib/survey/guardian-reports';
import { formatDateTime } from '@/lib/survey/dates';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { classLabel } from '@/lib/survey/snapshot';
import { DistLegend, Distribution } from '../charts';
import { ReportFilters } from '../ReportFilters';
import { ReportTools } from '../ReportTools';
import { TeachingHeat } from '../TeachingHeat';
import { PageTop } from '../../AdminShell';
import {
  Card,
  EmptyState,
  LINK,
  PageBody,
  PageTitle,
  StatTile,
  StatTiles,
} from '../../ui';

export const metadata: Metadata = { title: 'শিক্ষার মান' };
export const dynamic = 'force-dynamic';

type Search = {
  round?: string;
  compare?: string;
  area?: string;
  verified?: string;
  cell?: string;
};

const signed = (d: number | null) =>
  d === null || d === 0
    ? ''
    : `${d > 0 ? '▲' : '▼'} ${bn(Math.abs(d).toFixed(1))}`;

export default async function TeachingPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [search, rounds] = await Promise.all([searchParams, allReportRounds()]);
  // The class-management round: the one picked here, else the one paired with the sidebar's teacher round.
  const t1 = pickKindRound(rounds, 'T1', await chosenRoundId());
  const picked = rounds.some(r => r.kind === 'G1' && r.id === search.round)
    ? search.round
    : undefined;
  const g1 = pickKindRound(
    rounds,
    'G1',
    picked ?? (t1 ? pairedRound(t1, rounds, 'G1')?.id : undefined)
  );
  if (!g1) {
    return (
      <>
        <PageTop crumbs={[{ label: 'রিপোর্ট' }, { label: 'শিক্ষার মান' }]} />
        <PageBody>
          <PageTitle>শিক্ষার মান</PageTitle>
          <EmptyState>
            এখনো কোনো “ক্লাস পরিচালনা” অভিভাবক রাউন্ড খোলা হয়নি।
          </EmptyState>
        </PageBody>
      </>
    );
  }
  const earlier = rounds.filter(r => r.kind === 'G1' && r.opensAt < g1.opensAt);
  const compare =
    search.compare === 'none'
      ? undefined
      : (earlier.find(r => r.id === search.compare) ??
        previousRound(rounds, g1));
  const verifiedOnly = search.verified === '1';
  const areaKey = g1.snapshot.areas.some(a => a.key === search.area)
    ? search.area
    : undefined;
  const report = await teachingQuality(
    g1,
    compare,
    { verifiedOnly, areaKey },
    rounds
  );
  const [cClass, cSection, cSubject] = (search.cell ?? '').split('|');
  const cellAt =
    cClass && cSubject
      ? { classKey: cClass, sectionKey: cSection ?? '', subjectKey: cSubject }
      : null;
  const validCell =
    cellAt &&
    report.rows.some(
      r =>
        r.classKey === cellAt.classKey &&
        r.sectionKey === cellAt.sectionKey &&
        r.cells.some(c => c?.subjectKey === cellAt.subjectKey)
    );
  const detail =
    cellAt && validCell
      ? await teachingCell(g1, compare, cellAt, { verifiedOnly })
      : null;
  const subjectName = (key: string) =>
    report.subjects.find(s => s.key === key)?.name ?? key;
  // The class list opens on the teacher round of this period, so it shows the same guardian round.
  const classRound = pairedRound(g1, rounds, 'T1');
  const query = (extra: Record<string, string>) =>
    `/admin/reports/teaching?${new URLSearchParams({ round: g1.id, compare: compare?.id ?? 'none', ...(areaKey ? { area: areaKey } : {}), ...(verifiedOnly ? { verified: '1' } : {}), ...extra })}`;

  const teacher = cellAt
    ? report.rows
        .find(
          r =>
            r.classKey === cellAt.classKey && r.sectionKey === cellAt.sectionKey
        )
        ?.cells.find(c => c?.subjectKey === cellAt.subjectKey)?.teacher
    : null;

  return (
    <>
      <PageTop
        crumbs={[{ label: 'রিপোর্ট' }, { label: 'শিক্ষার মান' }]}
        actions={
          <ReportTools
            exportHref={`/admin/reports/export?${new URLSearchParams({ kind: 'teaching', round: g1.id, compare: compare?.id ?? 'none', ...(areaKey ? { area: areaKey } : {}), ...(verifiedOnly ? { verified: '1' } : {}) })}`}
          />
        }
      />
      <PageBody>
        <PageTitle
          sub={`${g1.snapshot.template.title} · ${g1.label} · ${bn(report.respondents)} জন শিক্ষার্থীর অভিভাবক${verifiedOnly ? ' · শুধু যাচাইকৃত' : ''}`}
        >
          শিক্ষার মান
        </PageTitle>

        <ReportFilters
          action="/admin/reports/teaching"
          verifiedOnly={verifiedOnly}
          selects={[
            {
              name: 'round',
              label: 'ক্লাস পরিচালনার রিভিউ',
              value: g1.id,
              options: [...rounds]
                .reverse()
                .filter(r => r.kind === 'G1')
                .map(r => ({ value: r.id, label: r.label })),
            },
            {
              name: 'compare',
              label: 'তুলনা',
              value: compare?.id ?? 'none',
              options: [
                { value: 'none', label: 'তুলনা নয়' },
                ...[...earlier]
                  .reverse()
                  .map(r => ({ value: r.id, label: r.label })),
              ],
            },
            {
              name: 'area',
              label: 'ক্ষেত্র',
              value: areaKey ?? '',
              options: [
                { value: '', label: 'সব ক্ষেত্র' },
                ...g1.snapshot.areas
                  .filter(a => a.group === 'teaching')
                  .map(a => ({ value: a.key, label: a.name })),
              ],
            },
          ]}
        />

        <StatTiles>
          {report.areas.map(a => (
            <StatTile
              key={a.key}
              label={a.name}
              value={formatMark(a.mean, bn)}
              unit="/১০"
              sub="পুরো মাদরাসা, অভিভাবকদের গড়"
              note={
                signed(a.delta)
                  ? `${signed(a.delta)} ${compare?.label ?? 'আগের'}-এর তুলনায়`
                  : undefined
              }
            />
          ))}
        </StatTiles>

        <Card title="শ্রেণি × বিষয় · গড় মার্ক">
          <p className="m-0 -mt-1 mb-3 text-[13.5px] text-muted-foreground">
            যেকোনো ঘরে চাপ দিলে নিচে বিস্তারিত দেখাবে
          </p>
          <TeachingHeat
            report={report}
            href={(row, subjectKey) =>
              `${query({ cell: `${row.classKey}|${row.sectionKey}|${subjectKey}` })}#detail`
            }
            selected={detail && cellAt ? cellAt : null}
          />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
            <span>⚠ = অন্তত ২৫% উত্তর ৭ বা কম</span>
            <span>জন = উত্তর দেওয়া অভিভাবক · ৩ জনের কম হলে ফলাফল লুকানো</span>
          </div>
        </Card>

        {detail && cellAt && (
          <section
            id="detail"
            className="flex scroll-mt-20 flex-col gap-4 rounded-xl border bg-card p-5"
            aria-labelledby="detail-title"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-muted-foreground">
                নির্বাচিত ঘর
              </span>
              <h2 id="detail-title" className="m-0 text-lg font-semibold">
                {classLabel(g1.snapshot, cellAt.classKey, cellAt.sectionKey)} ·{' '}
                {subjectName(cellAt.subjectKey)}
              </h2>
              <span className="text-[13.5px] text-muted-foreground">
                শিক্ষক: {teacher ?? 'এই সময়ের শিক্ষক রিভিউতে জমা নেই'}
              </span>
            </div>
            <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                [
                  'গড় মার্ক',
                  detail.reliable ? formatMark(detail.mean, bn) : '—',
                  detail.reliable && signed(detail.delta)
                    ? `${signed(detail.delta)} (${compare?.label})`
                    : '',
                ],
                [
                  'উত্তরদাতা',
                  bn(detail.respondents),
                  `${bn(detail.classSize)} জনের মধ্যে`,
                ],
                [
                  '৭ বা কম দিয়েছেন',
                  detail.reliable && detail.lowShare !== null
                    ? `${bn(Math.round(detail.lowShare * 100))}%`
                    : '—',
                  'সব উত্তরের',
                ],
              ].map(([label, value, note]) => (
                <div
                  key={label}
                  className="flex flex-col gap-0.5 rounded-lg bg-muted/60 px-3.5 py-2.5"
                >
                  <dt className="text-[13px] text-muted-foreground">{label}</dt>
                  <dd className="m-0 text-[22px] font-semibold tabular-nums">
                    {value}
                  </dd>
                  {note && (
                    <dd className="m-0 text-[12.5px] text-muted-foreground">
                      {note}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
            {!detail.reliable ? (
              <p className="m-0 text-sm text-muted-foreground">
                ৩ জনের কম অভিভাবক উত্তর দিয়েছেন, তাই বিস্তারিত লুকানো। একজন
                অভিভাবকের উত্তর দেখতে{' '}
                <Link
                  href={`/admin/reports/class?${new URLSearchParams({ ...(classRound ? { round: classRound.id } : {}), class: cellAt.classKey, section: cellAt.sectionKey })}`}
                  className={LINK}
                >
                  ক্লাসের তালিকা
                </Link>{' '}
                থেকে শিক্ষার্থীর নামে চাপ দিন।
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="m-0 text-[15px] font-semibold">
                    প্রশ্নভিত্তিক মার্কের বণ্টন
                  </h3>
                  <DistLegend />
                </div>
                {detail.questions.map((q, i) => (
                  <div
                    key={q.questionKey}
                    className="grid grid-cols-[minmax(0,1fr)_120px_40px] items-center gap-3 text-[13.5px]"
                  >
                    <span>
                      {bn(i + 1)}. {q.label}
                    </span>
                    <Distribution
                      items={q.counts}
                      label={`${q.label}: ${q.counts.map(c => `${bn(c.mark)} মার্ক ${bn(c.count)}টি`).join(', ')}`}
                    />
                    <span className="text-right font-semibold tabular-nums">
                      {formatMark(q.mean, bn)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <h3 className="m-0 text-[15px] font-semibold">
                এই শ্রেণির অভিভাবকদের মন্তব্য
              </h3>
              {detail.comments.length === 0 && (
                <p className="m-0 text-sm text-muted-foreground">
                  কোনো মন্তব্য নেই।
                </p>
              )}
              {detail.comments.map((c, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm"
                >
                  <div className="flex flex-wrap gap-x-2 text-[13px]">
                    <b className="font-semibold">
                      {c.who} ({c.relation})
                    </b>
                    <span className="text-muted-foreground">{c.child}</span>
                    <span
                      className={c.verified ? 'text-success' : 'text-warning'}
                    >
                      {c.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত'}
                    </span>
                    <span className="text-muted-foreground">
                      {c.submittedAt ? formatDateTime(c.submittedAt) : ''}
                    </span>
                  </div>
                  <div className="leading-relaxed">{c.text}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </PageBody>
    </>
  );
}
