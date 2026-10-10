import type { Metadata } from 'next';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import Link from 'next/link';
import {
  allReportRounds,
  overviewReport,
  pickKindRound,
} from '@/lib/survey/guardian-reports';
import { formatDateTime } from '@/lib/survey/dates';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatLow, formatMark } from '@/lib/survey/report-math';
import { MIN_N } from '@/lib/survey/stats';
import { roundStatus } from '@/lib/survey/round-status';
import { cn } from '@/lib/utils';
import { GUARDIAN, PairTrendChart, TEACHING } from '../charts';
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

export const metadata: Metadata = { title: 'ওভারভিউ' };
export const dynamic = 'force-dynamic';

type Search = {
  round?: string;
  compare?: string;
  g1?: string;
  g2?: string;
  verified?: string;
};

const signed = (d: number | null) =>
  d === null || d === 0
    ? ''
    : `${d > 0 ? '▲' : '▼'} ${bn(Math.abs(d).toFixed(1))}`;
const percent = (part: number, total: number) =>
  total ? `${bn(Math.round((part / total) * 100))}%` : '—';

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [search, rounds] = await Promise.all([searchParams, allReportRounds()]);
  const t1 = pickKindRound(rounds, 'T1', await chosenRoundId(search.round));
  if (!t1) {
    return (
      <>
        <PageTop crumbs={[{ label: 'রিপোর্ট' }, { label: 'ওভারভিউ' }]} />
        <PageBody>
          <PageTitle>ওভারভিউ</PageTitle>
          <EmptyState>
            এখনো কোনো শিক্ষক রিভিউ রাউন্ড খোলা হয়নি।{' '}
            <Link href="/admin/rounds" className={LINK}>
              রাউন্ড পাতা
            </Link>
          </EmptyState>
        </PageBody>
      </>
    );
  }
  const verifiedOnly = search.verified === '1';
  const earlier = rounds.filter(r => r.kind === 'T1' && r.opensAt < t1.opensAt);
  const report = await overviewReport(
    t1,
    rounds,
    {
      g1: search.g1 || undefined,
      g2: search.g2 || undefined,
      compare: search.compare,
    },
    { verifiedOnly }
  );
  const compareId = report.compareT1?.id;
  const compareLabel = report.compareT1?.label;
  const status = roundStatus(t1, new Date());
  const { kpis } = report;
  // Every average says how many children it rests on, the share of low answers and, for guardians,
  // how many of all children that is; below 3 children the average is not shown.
  const markTile = (
    label: string,
    k: (typeof kpis)['teacher'],
    who: string,
    round: string | undefined,
    ofAll = false
  ) => ({
    label,
    value: k.children >= MIN_N ? formatMark(k.mean, bn) : '—',
    unit: '/১০',
    sub: !round
      ? 'এই রাউন্ডের সাথে নেই'
      : k.children >= MIN_N
        ? [
            `${bn(k.children)}${ofAll ? `/${bn(kpis.response.total)}` : ''} জন শিক্ষার্থীর ${who}`,
            formatLow(k.lowShare, bn),
          ].join(' · ')
        : `মাত্র ${bn(k.children)} জন শিক্ষার্থীর ${who} (৩ জনের কম)`,
    delta:
      k.children >= MIN_N && signed(k.delta)
        ? `${signed(k.delta)} আগের তুলনায় · একই ${bn(k.cohort)} জন`
        : '',
  });
  const tiles = [
    {
      ...markTile('শিক্ষকের রিভিউ', kpis.teacher, 'রিভিউ', t1.label),
      href: `/admin/reports?round=${t1.id}`,
    },
    {
      ...markTile(
        'অভিভাবক · শিক্ষার্থী',
        kpis.guardian,
        'অভিভাবক',
        report.g2?.label,
        true
      ),
      href: `/admin/reports/questions?${new URLSearchParams({ round: t1.id, ...(search.g2 ? { g2: search.g2 } : {}), ...(verifiedOnly ? { verified: '1' } : {}) })}`,
    },
    {
      ...markTile(
        'অভিভাবক · ক্লাস পরিচালনা',
        kpis.teaching,
        'অভিভাবক',
        report.g1?.label,
        true
      ),
      href: report.g1
        ? `/admin/reports/teaching?${new URLSearchParams({ round: report.g1.id, ...(verifiedOnly ? { verified: '1' } : {}) })}`
        : null,
    },
    {
      label: 'মনোযোগ প্রয়োজন',
      value: bn(report.attention.length),
      unit: 'জন',
      sub: `রিভিউ হওয়া ${bn(report.assessed)} জন শিক্ষার্থীর মধ্যে`,
      delta: '',
      href: '#attention',
    },
  ];
  const kindOptions = (kind: 'G1' | 'G2', current: string | undefined) => [
    { value: '', label: `স্বয়ংক্রিয় (${current ?? 'নেই'})` },
    ...[...rounds]
      .reverse()
      .filter(r => r.kind === kind)
      .map(r => ({ value: r.id, label: r.label })),
  ];

  const response = kpis.response;
  const query = (extra: Record<string, string>) =>
    new URLSearchParams({
      ...extra,
      ...(verifiedOnly ? { verified: '1' } : {}),
    }).toString();

  return (
    <>
      <PageTop
        crumbs={[{ label: 'রিপোর্ট' }, { label: 'ওভারভিউ' }]}
        actions={<ReportTools />}
      />
      <PageBody>
        <PageTitle
          sub={
            <>
              {t1.label} রাউন্ড ·{' '}
              {status === 'open'
                ? `চলমান · ${formatDateTime(t1.closesAt)} বন্ধ হবে`
                : status === 'closed'
                  ? 'বন্ধ'
                  : 'এখনো খোলেনি'}
              {compareLabel ? ` · তুলনা: ${compareLabel}` : ''}
              {verifiedOnly ? ' · শুধু যাচাইকৃত' : ''}
            </>
          }
        >
          ওভারভিউ
        </PageTitle>

        <ReportFilters
          action="/admin/reports/overview"
          verifiedOnly={verifiedOnly}
          selects={[
            {
              name: 'compare',
              label: 'তুলনা',
              value: compareId ?? 'none',
              options: [
                { value: 'none', label: 'তুলনা নয়' },
                ...[...earlier]
                  .reverse()
                  .map(r => ({ value: r.id, label: r.label })),
              ],
            },
            {
              name: 'g1',
              label: 'ক্লাস পরিচালনার রিভিউ',
              value: search.g1 ?? '',
              options: kindOptions('G1', report.g1?.label),
              more: true,
            },
            {
              name: 'g2',
              label: 'শিক্ষার্থীর উপর অভিভাবক রিভিউ',
              value: search.g2 ?? '',
              options: kindOptions('G2', report.g2?.label),
              more: true,
            },
          ]}
        />

        <StatTiles>
          {tiles.map(t => (
            <StatTile
              key={t.label}
              label={t.label}
              value={t.value}
              unit={t.unit}
              sub={t.sub}
              note={t.delta}
              href={t.href}
            />
          ))}
        </StatTiles>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card
            className="min-w-0 xl:col-span-2"
            title="শিক্ষার মান · শ্রেণি × বিষয় (অভিভাবকদের গড় মার্ক)"
            action={
              report.g1 && (
                <Link
                  href={`/admin/reports/teaching?${query({ round: report.g1.id })}`}
                  className="text-[13.5px] font-medium text-foreground"
                >
                  বিস্তারিত
                </Link>
              )
            }
          >
            {report.heat && report.g1 ? (
              <div className="flex flex-col gap-3">
                <TeachingHeat
                  report={report.heat}
                  href={(row, subjectKey) =>
                    `/admin/reports/teaching?${query({ round: report.g1!.id, cell: `${row.classKey}|${row.sectionKey}|${subjectKey}` })}#detail`
                  }
                />
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                  <span>⚠ = অন্তত ২৫% উত্তর ৭ বা কম</span>
                  <span>
                    জন = উত্তর দেওয়া অভিভাবক · ৩ জনের কম হলে ফলাফল লুকানো
                  </span>
                  <span>ফাঁকা = বিষয়টি ঐ শ্রেণিতে নেই</span>
                </div>
              </div>
            ) : (
              <p className="m-0 text-sm text-muted-foreground">
                এই সময়ে কোনো “ক্লাস পরিচালনা” রাউন্ড নেই।
              </p>
            )}
          </Card>

          <Card
            className="min-w-0"
            title="অভিভাবকের সাড়া · শ্রেণিভিত্তিক"
            action={
              <Link
                href="/admin/tracker"
                className="text-[13.5px] font-medium text-foreground"
              >
                বাকিদের তালিকা
              </Link>
            }
          >
            <p className="m-0 -mt-1 mb-3 text-[13px] text-muted-foreground">
              {bn(response.total)} জন শিক্ষার্থীর মধ্যে · শিক্ষার্থী রিভিউ{' '}
              {percent(response.g2, response.total)} · ক্লাস পরিচালনা{' '}
              {percent(response.g1, response.total)}। সাড়া কম হলে গড় পুরো
              ক্লাসের মত নয়।
            </p>
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="text-left text-[12.5px] text-muted-foreground [&>th]:pb-1.5 [&>th]:font-normal">
                  <th scope="col">শ্রেণি</th>
                  <th scope="col">ক্লাস পরিচালনা</th>
                  <th scope="col">শিক্ষার্থী</th>
                </tr>
              </thead>
              <tbody>
                {report.progress.map(p => (
                  <tr
                    key={`${p.classKey}|${p.sectionKey}`}
                    className="[&>td]:border-t [&>td]:py-2 [&>td]:align-middle"
                  >
                    <td className="pr-3">
                      <Link
                        href={`/admin/reports/class?${new URLSearchParams({ round: t1.id, class: p.classKey, section: p.sectionKey })}`}
                        className={cn(LINK, 'whitespace-nowrap')}
                      >
                        {p.label}
                      </Link>
                    </td>
                    {[
                      [p.g1, TEACHING],
                      [p.g2, GUARDIAN],
                    ].map(([n, colour]) => (
                      <td key={colour as string} className="w-[38%] pr-3">
                        <span className="tabular-nums">
                          {bn(n as number)}/{bn(p.total)}
                        </span>
                        <span
                          className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted"
                          aria-hidden
                        >
                          <span
                            className="block h-full rounded-full"
                            style={{
                              background: colour as string,
                              width: p.total
                                ? `${((n as number) / p.total) * 100}%`
                                : 0,
                            }}
                          />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card
            className="min-w-0 xl:col-span-2"
            title="অভিভাবক বনাম শিক্ষক · রাউন্ডভিত্তিক গড়"
          >
            {report.trend.length < 2 ? (
              <p className="m-0 text-sm text-muted-foreground">
                দ্বিতীয় রাউন্ড থেকে প্রবণতা দেখা যাবে।
              </p>
            ) : (
              <PairTrendChart points={report.trend} />
            )}
            {report.trend.some(p => p.teaching !== null) && (
              <p className="m-0 mt-2 text-[13.5px] text-muted-foreground">
                ক্লাস পরিচালনার রিভিউ একই সময়ে:{' '}
                {report.trend
                  .filter(p => p.teaching !== null)
                  .map((p, i, list) => (
                    <span key={p.label}>
                      {i === list.length - 1 ? (
                        <b className="font-semibold text-foreground">
                          {formatMark(p.teaching, bn)}
                        </b>
                      ) : (
                        formatMark(p.teaching, bn)
                      )}
                      {i < list.length - 1 ? ' → ' : ''}
                    </span>
                  ))}
              </p>
            )}
          </Card>

          <section
            id="attention"
            className="min-w-0 scroll-mt-20 rounded-xl border bg-card p-5"
            aria-labelledby="ov-attention"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="ov-attention" className="m-0 text-[15px] font-semibold">
                মনোযোগ প্রয়োজন
              </h2>
              <span className="text-[13px] text-muted-foreground">
                {bn(report.assessed)} জনের মধ্যে {bn(report.attention.length)}{' '}
                জন
              </span>
            </div>
            {report.attention.length === 0 ? (
              <p className="m-0 text-sm text-muted-foreground">কেউ নেই।</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead className="sv-visually-hidden">
                  <tr>
                    <th scope="col">শিক্ষার্থী</th>
                    <th scope="col">কারণ</th>
                  </tr>
                </thead>
                <tbody>
                  {report.attention.slice(0, 12).map(a => (
                    <tr
                      key={a.erpId}
                      className="[&>td]:border-t [&>td]:py-2.5 [&>td]:align-top"
                    >
                      <td className="pr-3">
                        <Link
                          href={`/admin/reports/student/${encodeURIComponent(a.erpId)}?round=${t1.id}`}
                          className={cn(LINK, 'font-medium')}
                        >
                          {a.name}
                        </Link>
                        <span className="block text-[12.5px] text-muted-foreground">
                          {a.place}
                        </span>
                      </td>
                      <td className="text-[13px] leading-snug text-warning">
                        {a.reasons.map(r => (
                          <span key={r} className="block">
                            {r}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {report.attention.length > 12 && (
              <p className="m-0 mt-2 text-[13px] text-muted-foreground">
                আরও {bn(report.attention.length - 12)} জন: ক্লাস রিপোর্টে দেখুন।
              </p>
            )}
          </section>
        </div>
      </PageBody>
    </>
  );
}
