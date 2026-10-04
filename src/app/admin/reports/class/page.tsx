import type { Metadata } from 'next';
import Link from 'next/link';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { classReport, pickRound, t1Rounds } from '@/lib/survey/reports';
import { MIN_N } from '@/lib/survey/stats';
import { RoundPicker } from '../../RoundPicker';
import { MarkAxis, MarkBar } from '../charts';
import { NoRounds } from '../NoRounds';
import { ReportTools } from '../ReportTools';
import { ClassTable } from './ClassTable';

export const metadata: Metadata = { title: 'ক্লাস রিপোর্ট' };
export const dynamic = 'force-dynamic';

type Search = { round?: string; class?: string; section?: string };

export default async function ClassReportPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [search, rounds] = await Promise.all([searchParams, t1Rounds()]);
  const round = pickRound(rounds, search.round);
  if (!round) return <NoRounds />;
  const report = search.class ? await classReport(round, search.class, search.section ?? '') : null;
  if (!report) {
    return (
      <div className="sv-card" style={{ padding: 20 }}>
        শ্রেণিটি এই রাউন্ডে নেই। <Link href={`/admin/reports?round=${round.id}`}>ক্লাস বাছাই করুন</Link>
      </div>
    );
  }
  const { kpis } = report;
  const params = { class: search.class!, section: search.section ?? '' };
  const reliable = kpis.ratedStudents >= MIN_N;

  return (
    <>
      <Link href={`/admin/reports?round=${round.id}`} className="sv-no-print" style={{ fontSize: 14, fontWeight: 600, alignSelf: 'flex-start' }}>
        ← সব ক্লাস
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
            {report.label}
          </h1>
          <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>
            {bn(report.rows.length)} জন শিক্ষার্থী · শিক্ষকের রিভিউ {bn(kpis.subjectsCovered)}/{bn(kpis.subjectsTotal)} বিষয় · {round.label}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="sv-no-print">
            <RoundPicker rounds={[...rounds].reverse().map((r) => ({ id: r.id, label: r.label }))} value={round.id} basePath="/admin/reports/class" params={params} />
          </span>
          <ReportTools exportHref={`/admin/reports/export?${new URLSearchParams({ kind: 'class', round: round.id, ...params })}`} />
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className={`sv-card sv-kpi${reliable ? '' : ' is-muted'}`}>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', fontWeight: 600 }}>শিক্ষকদের গড়</div>
          <div className="flex items-baseline gap-1.5">
            <span className="sv-num" style={{ fontSize: 30, lineHeight: 1.2 }}>
              {reliable ? formatMark(kpis.mean, bn) : '—'}
            </span>
            <span style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>/ ১০</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
            {reliable ? `${bn(kpis.n)}টি মার্ক` : `মাত্র ${bn(kpis.ratedStudents)} জনের রিভিউ (n<৩)`}
          </div>
        </div>
        <div className={`sv-card sv-kpi${reliable ? '' : ' is-muted'}`}>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', fontWeight: 600 }}>১০ পেয়েছে</div>
          <div className="sv-num" style={{ fontSize: 30, lineHeight: 1.2 }}>
            {reliable && kpis.topShare !== null ? `${bn(Math.round(kpis.topShare * 100))}%` : '—'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>সব মার্কের মধ্যে</div>
        </div>
        <div className="sv-card sv-kpi">
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', fontWeight: 600 }}>রিভিউ হয়েছে</div>
          <div className="sv-num" style={{ fontSize: 30, lineHeight: 1.2 }}>
            {bn(kpis.ratedStudents)}/{bn(report.rows.length)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>জন শিক্ষার্থী</div>
        </div>
        <div className="sv-card sv-kpi">
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', fontWeight: 600 }}>মনোযোগ প্রয়োজন</div>
          <div className="sv-num" style={{ fontSize: 30, lineHeight: 1.2 }}>
            {bn(kpis.flagged)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>জনের ফ্ল্যাগ আছে</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-start">
        <section className="sv-card flex flex-col gap-3 min-w-0" style={{ flex: '1 1 420px' }} aria-labelledby="areas-title">
          <h2 id="areas-title" className="sv-head sv-h2">
            ক্ষেত্রভিত্তিক · ক্লাসের গড়
          </h2>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>শিক্ষকদের মার্ক, প্রত্যেক শিক্ষার্থীর গড় থেকে · ৩ জনের কম হলে ধূসর</div>
          {report.areas.map((area) => (
            <div key={area.areaKey} className="flex flex-col gap-1.5" style={{ padding: '4px 0' }}>
              <div className="flex justify-between" style={{ fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>{area.name}</span>
                <span style={{ color: 'var(--sv-text-muted)' }}>
                  <b className="sv-num" style={{ color: area.reliable ? 'var(--sv-text)' : undefined }}>
                    {formatMark(area.mean, bn)}
                  </b>{' '}
                  · {bn(area.students)} জন{area.reliable ? '' : ' (n<৩)'}
                </span>
              </div>
              <MarkBar value={area.mean} muted={!area.reliable} label={`${area.name}: ${formatMark(area.mean, bn)} (${bn(area.students)} জন)`} />
            </div>
          ))}
          <MarkAxis />
        </section>
        <section className="sv-card flex flex-col gap-2 min-w-0" style={{ flex: '1 1 420px' }}>
          <h2 className="sv-head sv-h2">অভিভাবক বনাম শিক্ষক</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--sv-text-muted)', lineHeight: 1.6 }}>
            অভিভাবকের রিভিউ (G2) শুরু হলে এখানে প্রত্যেক শিক্ষার্থীর অভিভাবক ও শিক্ষকের চোখে তুলনা এবং বিন্দুচিত্র দেখা যাবে।
          </p>
        </section>
      </div>

      <section className="sv-card flex flex-col gap-3" aria-labelledby="students-title">
        <div className="flex flex-wrap justify-between items-baseline gap-2">
          <h2 id="students-title" className="sv-head sv-h2">
            শিক্ষার্থী তালিকা
          </h2>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>কলাম শিরোনামে চাপ দিয়ে সাজান · নামে চাপ দিলে প্রোফাইল</div>
        </div>
        {report.rounds < 2 && <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>দ্বিতীয় রাউন্ড থেকে প্রবণতা দেখা যাবে।</div>}
        <ClassTable rows={report.rows} roundId={round.id} showTrend={report.rounds >= 2} />
      </section>
    </>
  );
}
