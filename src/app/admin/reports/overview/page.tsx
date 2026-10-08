import type { Metadata } from 'next';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import Link from 'next/link';
import { allReportRounds, overviewReport, pickKindRound } from '@/lib/survey/guardian-reports';
import { formatDateTime } from '@/lib/survey/dates';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatLow, formatMark } from '@/lib/survey/report-math';
import { MIN_N } from '@/lib/survey/stats';
import { roundStatus } from '@/lib/survey/round-status';
import { GUARDIAN, PairTrendChart, TEACHING } from '../charts';
import { ReportFilters } from '../ReportFilters';
import { ReportTools } from '../ReportTools';
import { TeachingHeat } from '../TeachingHeat';
import { PageTop } from '../../AdminShell';

export const metadata: Metadata = { title: 'ওভারভিউ' };
export const dynamic = 'force-dynamic';

type Search = { round?: string; compare?: string; g1?: string; g2?: string; verified?: string };

const signed = (d: number | null) => (d === null || d === 0 ? '' : `${d > 0 ? '▲' : '▼'} ${bn(Math.abs(d).toFixed(1))}`);
const percent = (part: number, total: number) => (total ? `${bn(Math.round((part / total) * 100))}%` : '—');

export default async function OverviewPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [search, rounds] = await Promise.all([searchParams, allReportRounds()]);
  const t1 = pickKindRound(rounds, 'T1', await chosenRoundId(search.round));
  if (!t1) {
    return (
      <>
        <PageTop crumbs={[{ label: 'রিপোর্ট' }, { label: 'ওভারভিউ' }]} />
        <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
          ওভারভিউ
        </h1>
        <div className="sv-card" style={{ padding: 20 }}>
          এখনো কোনো শিক্ষক রিভিউ রাউন্ড খোলা হয়নি। <Link href="/admin/rounds">রাউন্ড পাতা</Link>
        </div>
      </>
    );
  }
  const verifiedOnly = search.verified === '1';
  const earlier = rounds.filter((r) => r.kind === 'T1' && r.opensAt < t1.opensAt);
  const report = await overviewReport(t1, rounds, { g1: search.g1 || undefined, g2: search.g2 || undefined, compare: search.compare }, { verifiedOnly });
  const compareId = report.compareT1?.id;
  const compareLabel = report.compareT1?.label;
  const status = roundStatus(t1, new Date());
  const { kpis } = report;
  // Every average says how many children it rests on, the share of low answers and, for guardians,
  // how many of all children that is; below 3 children the average is not shown.
  const markTile = (label: string, k: (typeof kpis)['teacher'], who: string, round: string | undefined, ofAll = false) => ({
    label,
    value: k.children >= MIN_N ? formatMark(k.mean, bn) : '—',
    unit: '/১০',
    sub: !round
      ? 'এই রাউন্ডের সাথে নেই'
      : k.children >= MIN_N
        ? [`${bn(k.children)}${ofAll ? `/${bn(kpis.response.total)}` : ''} জন শিক্ষার্থীর ${who}`, formatLow(k.lowShare, bn)].join(' · ')
        : `মাত্র ${bn(k.children)} জন শিক্ষার্থীর ${who} (৩ জনের কম)`,
    delta: k.children >= MIN_N && signed(k.delta) ? `${signed(k.delta)} আগের তুলনায় (দুই রাউন্ডেই আছে এমন ${bn(k.cohort)} জন)` : '',
  });
  const tiles = [
    markTile('অভিভাবকের রিভিউ · ক্লাস পরিচালনা', kpis.teaching, 'অভিভাবক', report.g1?.label, true),
    markTile('অভিভাবকের রিভিউ · শিক্ষার্থী', kpis.guardian, 'অভিভাবক', report.g2?.label, true),
    markTile('শিক্ষকের রিভিউ', kpis.teacher, 'রিভিউ', t1.label),
    {
      label: 'অভিভাবকের সাড়া',
      value: percent(kpis.response.g2, kpis.response.total),
      unit: 'শিক্ষার্থী রিভিউ',
      sub: `ক্লাস পরিচালনা ${percent(kpis.response.g1, kpis.response.total)} · ${bn(kpis.response.total)} জন শিক্ষার্থীর মধ্যে। সাড়া কম হলে গড় পুরো ক্লাসের মত নয়।`,
      delta: '',
    },
    { label: 'মনোযোগ প্রয়োজন', value: bn(report.attention.length), unit: 'জন', sub: `রিভিউ হওয়া ${bn(report.assessed)} জন শিক্ষার্থীর মধ্যে`, delta: '' },
  ];
  const kindOptions = (kind: 'G1' | 'G2', current: string | undefined) => [
    { value: '', label: `স্বয়ংক্রিয় (${current ?? 'নেই'})` },
    ...[...rounds].reverse().filter((r) => r.kind === kind).map((r) => ({ value: r.id, label: r.label })),
  ];

  return (
    <>
      <PageTop crumbs={[{ label: 'রিপোর্ট' }, { label: 'ওভারভিউ' }]} actions={<ReportTools />} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
            ওভারভিউ
          </h1>
          <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>
            {t1.label} রাউন্ড · {status === 'open' ? `চলমান · ${formatDateTime(t1.closesAt)} বন্ধ হবে` : status === 'closed' ? 'বন্ধ' : 'এখনো খোলেনি'}
            {compareLabel ? ` · তুলনা: ${compareLabel}` : ''}
            {verifiedOnly ? ' · শুধু যাচাইকৃত' : ''}
          </div>
        </div>
      </div>

      <ReportFilters
        action="/admin/reports/overview"
        verifiedOnly={verifiedOnly}
        selects={[
          { name: 'compare', label: 'তুলনা', value: compareId ?? 'none', options: [{ value: 'none', label: 'তুলনা নয়' }, ...[...earlier].reverse().map((r) => ({ value: r.id, label: r.label }))] },
          { name: 'g1', label: 'ক্লাস পরিচালনার রিভিউ', value: search.g1 ?? '', options: kindOptions('G1', report.g1?.label) },
          { name: 'g2', label: 'শিক্ষার্থীর উপর অভিভাবক রিভিউ', value: search.g2 ?? '', options: kindOptions('G2', report.g2?.label) },
        ]}
      />

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {tiles.map((t) => (
          <div key={t.label} className="sv-card flex flex-col gap-1" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>{t.label}</span>
            <span className="flex items-baseline gap-1">
              <span className="sv-num" style={{ fontSize: 28 }}>
                {t.value}
              </span>
              <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{t.unit}</span>
            </span>
            <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{t.sub}</span>
            {t.delta && (
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {t.delta}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="sv-split">
        <section className="sv-card flex flex-col gap-3" style={{ flex: '999 1 600px', minWidth: 0 }} aria-labelledby="ov-heat">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="ov-heat" className="sv-head sv-h2">
              শিক্ষার মান · শ্রেণি × বিষয় (অভিভাবকদের গড় মার্ক)
            </h2>
            {report.g1 && <Link href={`/admin/reports/teaching?${new URLSearchParams({ round: report.g1.id, ...(verifiedOnly ? { verified: '1' } : {}) })}`}>বিস্তারিত →</Link>}
          </div>
          {report.heat && report.g1 ? (
            <>
              <TeachingHeat
                report={report.heat}
                href={(row, subjectKey) => `/admin/reports/teaching?${new URLSearchParams({ round: report.g1!.id, cell: `${row.classKey}|${row.sectionKey}|${subjectKey}`, ...(verifiedOnly ? { verified: '1' } : {}) })}#detail`}
              />
              <div className="flex flex-wrap gap-4" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
                <span>⚠ = অন্তত ২৫% উত্তর ৭ বা কম</span>
                <span>জন = উত্তর দেওয়া অভিভাবক · ৩ জনের কম হলে ফলাফল লুকানো</span>
                <span>ফাঁকা = বিষয়টি ঐ শ্রেণিতে নেই</span>
              </div>
            </>
          ) : (
            <p className="sv-muted" style={{ margin: 0 }}>
              এই সময়ে কোনো “ক্লাস পরিচালনা” রাউন্ড নেই।
            </p>
          )}
        </section>

        <section className="sv-card flex flex-col gap-2" style={{ flex: '1 1 320px', minWidth: 0 }} aria-labelledby="ov-progress">
          <h2 id="ov-progress" className="sv-head sv-h2">
            অভিভাবকের সাড়া · শ্রেণিভিত্তিক
          </h2>
          <div className="flex gap-4" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }} aria-hidden="true">
            <span className="flex items-center gap-1.5">
              <span style={{ width: 11, height: 11, borderRadius: 3, background: TEACHING }} />
              ক্লাস পরিচালনা
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 11, height: 11, borderRadius: 3, background: GUARDIAN }} />
              শিক্ষার্থী
            </span>
          </div>
          {report.progress.map((p) => (
            <div key={`${p.classKey}|${p.sectionKey}`} className="grid items-center gap-2.5" style={{ gridTemplateColumns: '90px minmax(0, 1fr) 96px' }}>
              <Link href={`/admin/reports/class?${new URLSearchParams({ round: t1.id, class: p.classKey, section: p.sectionKey })}`} style={{ fontWeight: 600, fontSize: 14 }}>
                {p.label}
              </Link>
              <span className="flex flex-col gap-1" aria-hidden="true">
                {[
                  [p.g1, TEACHING],
                  [p.g2, GUARDIAN],
                ].map(([n, colour]) => (
                  <span key={colour as string} style={{ height: 7, borderRadius: 4, background: 'var(--sv-hairline-soft)', overflow: 'hidden', display: 'block' }}>
                    <span style={{ display: 'block', height: 7, background: colour as string, width: p.total ? `${((n as number) / p.total) * 100}%` : 0 }} />
                  </span>
                ))}
              </span>
              <span className="sv-num" style={{ fontSize: 12.5, textAlign: 'right', lineHeight: 1.3 }}>
                <span style={{ color: 'var(--sv-text-muted)', fontWeight: 400 }}>পরিচালনা </span>
                {bn(p.g1)}/{bn(p.total)}
                <br />
                <span style={{ color: 'var(--sv-text-muted)', fontWeight: 400 }}>শিক্ষার্থী </span>
                {bn(p.g2)}/{bn(p.total)}
              </span>
            </div>
          ))}
          <Link href="/admin/tracker">বাকিদের তালিকা →</Link>
        </section>
      </div>

      <div className="sv-split">
        <section className="sv-card flex flex-col gap-2" style={{ flex: '999 1 520px', minWidth: 0 }} aria-labelledby="ov-trend">
          <h2 id="ov-trend" className="sv-head sv-h2">
            অভিভাবক বনাম শিক্ষক · রাউন্ডভিত্তিক গড়
          </h2>
          {report.trend.length < 2 ? (
            <p className="sv-muted" style={{ margin: 0 }}>
              দ্বিতীয় রাউন্ড থেকে প্রবণতা দেখা যাবে।
            </p>
          ) : (
            <PairTrendChart points={report.trend} />
          )}
          {report.trend.some((p) => p.teaching !== null) && (
            <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>
              ক্লাস পরিচালনার রিভিউ একই সময়ে:{' '}
              {report.trend
                .filter((p) => p.teaching !== null)
                .map((p, i, list) => (
                  <span key={p.label}>
                    {i === list.length - 1 ? <b style={{ color: 'var(--sv-text)' }}>{formatMark(p.teaching, bn)}</b> : formatMark(p.teaching, bn)}
                    {i < list.length - 1 ? ' → ' : ''}
                  </span>
                ))}
            </div>
          )}
        </section>

        <section className="sv-card flex flex-col gap-2" style={{ flex: '1 1 360px', minWidth: 0 }} aria-labelledby="ov-attention">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="ov-attention" className="sv-head sv-h2">
              মনোযোগ প্রয়োজন
            </h2>
            <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
              {bn(report.assessed)} জনের মধ্যে {bn(report.attention.length)} জন
            </span>
          </div>
          {report.attention.length === 0 && <p className="sv-muted" style={{ margin: 0 }}>কেউ নেই।</p>}
          <ul className="flex flex-col gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {report.attention.slice(0, 12).map((a) => (
              <li key={a.erpId}>
                <Link
                  href={`/admin/reports/student/${encodeURIComponent(a.erpId)}?round=${t1.id}`}
                  className="flex flex-col gap-1"
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--sv-hairline)', textDecoration: 'none', color: 'var(--sv-text)' }}
                >
                  <span className="flex justify-between gap-2">
                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{a.place}</span>
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {a.reasons.map((r) => (
                      <span key={r} style={{ fontSize: 12.5, padding: '2px 8px', borderRadius: 8, background: 'var(--sv-warn-bg)', color: 'var(--sv-warn)' }}>
                        {r}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {report.attention.length > 12 && (
            <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>আরও {bn(report.attention.length - 12)} জন: ক্লাস রিপোর্টে দেখুন।</span>
          )}
        </section>
      </div>
    </>
  );
}
