import type { Metadata } from 'next';
import Link from 'next/link';
import { allReportRounds, classGuardian, withGuardian } from '@/lib/survey/guardian-reports';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatLow, formatMark, GUARDIAN_AREAS } from '@/lib/survey/report-math';
import { classReport, pickRound } from '@/lib/survey/reports';
import { MIN_N } from '@/lib/survey/stats';
import { RoundPicker } from '../../RoundPicker';
import { AREA_GAP_MARKS, GapScatter, GUARDIAN, MarkAxis, PairBar, TEACHER } from '../charts';
import { NoRounds } from '../NoRounds';
import { ReportTools } from '../ReportTools';
import { ClassTable } from './ClassTable';

export const metadata: Metadata = { title: 'ক্লাস রিপোর্ট' };
export const dynamic = 'force-dynamic';

type Search = { round?: string; class?: string; section?: string; verified?: string };

function Kpi({ label, value, unit, sub, muted }: { label: string; value: string; unit?: string; sub: string; muted?: boolean }) {
  return (
    <div className={`sv-card sv-kpi${muted ? ' is-muted' : ''}`}>
      <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', fontWeight: 600 }}>{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="sv-num" style={{ fontSize: 30, lineHeight: 1.2 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{sub}</div>
    </div>
  );
}

export default async function ClassReportPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [search, all] = await Promise.all([searchParams, allReportRounds()]);
  const rounds = all.filter((r) => r.kind === 'T1');
  const round = pickRound(rounds, search.round);
  if (!round) return <NoRounds />;
  const verifiedOnly = search.verified === '1';
  const place = { classKey: search.class ?? '', sectionKey: search.section ?? '' };
  const [report, guardian] = search.class ? await Promise.all([classReport(round, place.classKey, place.sectionKey), classGuardian(round, all, place, { verifiedOnly })]) : [null, null];
  if (!report || !guardian) {
    return (
      <div className="sv-card" style={{ padding: 20 }}>
        শ্রেণিটি এই রাউন্ডে নেই। <Link href={`/admin/reports?round=${round.id}`}>ক্লাস বাছাই করুন</Link>
      </div>
    );
  }
  const { kpis } = report;
  const params = { class: place.classKey, section: place.sectionKey };
  const reliable = kpis.ratedStudents >= MIN_N;
  const rows = withGuardian(report.rows, guardian);
  const answered = rows.filter((r) => r.form !== 'none').length;
  const g2 = guardian.g2;
  const g1 = guardian.g1;
  const both = rows.filter((r) => r.shared !== null);
  const teacherAreas = new Map(report.areas.map((a) => [a.areaKey, a]));
  const toggle = `/admin/reports/class?${new URLSearchParams({ round: round.id, ...params, ...(verifiedOnly ? {} : { verified: '1' }) })}`;

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
            {bn(rows.length)} জন শিক্ষার্থী{g2.round ? ` · অভিভাবকের সাড়া ${bn(answered)}/${bn(rows.length)}` : ''} · শিক্ষকের রিভিউ {bn(kpis.subjectsCovered)}/{bn(kpis.subjectsTotal)} বিষয় · {round.label}
            {verifiedOnly ? ' · শুধু যাচাইকৃত অভিভাবক' : ''}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="sv-no-print flex flex-wrap gap-2 items-center">
            <RoundPicker
              rounds={[...rounds].reverse().map((r) => ({ id: r.id, label: r.label }))}
              value={round.id}
              basePath="/admin/reports/class"
              params={{ ...params, ...(verifiedOnly ? { verified: '1' } : {}) }}
            />
            {g2.round && (
              <Link href={toggle} className="sv-sbtn" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
                {verifiedOnly ? 'সব অভিভাবক দেখান' : 'শুধু যাচাইকৃত'}
              </Link>
            )}
          </span>
          <ReportTools exportHref={`/admin/reports/export?${new URLSearchParams({ kind: 'class', round: round.id, ...params, ...(verifiedOnly ? { verified: '1' } : {}) })}`} />
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <Kpi
          label="অভিভাবকের রিভিউ · শিক্ষার্থী"
          value={g2.round && g2.reliable ? formatMark(g2.mean, bn) : '—'}
          unit="/ ১০"
          sub={
            !g2.round
              ? 'এই রাউন্ডের সাথে অভিভাবকের রিভিউ নেই'
              : g2.reliable
                ? `${bn(g2.respondents)}/${bn(rows.length)} জনের অভিভাবক · ${formatLow(g2.lowShare, bn)}`
                : `মাত্র ${bn(g2.respondents)} জনের অভিভাবক (৩ জনের কম)`
          }
          muted={!g2.reliable}
        />
        <Kpi
          label="শিক্ষকের রিভিউ"
          value={reliable ? formatMark(kpis.mean, bn) : '—'}
          unit="/ ১০"
          sub={reliable ? `${bn(kpis.ratedStudents)}/${bn(rows.length)} জনের রিভিউ · ${formatLow(kpis.lowShare, bn)}` : `মাত্র ${bn(kpis.ratedStudents)} জনের রিভিউ (৩ জনের কম)`}
          muted={!reliable}
        />
        <Kpi
          label="অভিভাবকের রিভিউ · ক্লাস পরিচালনা"
          value={g1.round && g1.reliable ? formatMark(g1.mean, bn) : '—'}
          unit="/ ১০"
          sub={
            !g1.round
              ? 'এই রাউন্ডের সাথে ক্লাস পরিচালনার রিভিউ নেই'
              : !g1.reliable
                ? `মাত্র ${bn(g1.respondents)} জন অভিভাবক (৩ জনের কম)`
                : `${bn(g1.respondents)} জন অভিভাবক · ${formatLow(g1.lowShare, bn)}${g1.lowest ? ` · সবচেয়ে কম: ${g1.lowest.name} ${formatMark(g1.lowest.mean, bn)}` : ''}`
          }
          muted={!g1.reliable}
        />
        <Kpi label="মনোযোগ প্রয়োজন" value={bn(rows.filter((r) => r.flags.length).length)} unit="জন" sub="নিচের তালিকায় চিহ্নিত" />
      </div>

      <div className="flex flex-wrap gap-4 items-stretch">
        <details className="sv-card flex flex-col gap-2.5 min-w-0 sv-no-print" style={{ flex: '1 1 460px', alignSelf: 'flex-start' }}>
          <summary className="sv-head sv-h2" style={{ cursor: 'pointer' }}>
            অভিভাবক বনাম শিক্ষক · প্রত্যেক শিক্ষার্থীর চিত্র
            <span style={{ display: 'block', fontFamily: 'inherit', fontSize: 13, fontWeight: 400, color: 'var(--sv-text-muted)' }}>বিস্তারিত দেখতে চাপ দিন · একই তথ্য নিচের তালিকায়ও আছে</span>
          </summary>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>যেসব ক্ষেত্রে অভিভাবক ও শিক্ষক দুজনেই মার্ক দিয়েছেন, সেগুলোর গড় মার্ক · রেখা = মার্ক ৮</div>
          {both.length ? (
            <>
              <GapScatter points={both.map((r) => ({ erpId: r.erpId, name: r.name, guardian: r.shared!.guardian, teacher: r.shared!.teacher, flagged: r.flags.length > 0 }))} />
              <div className="flex flex-wrap gap-4" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }} aria-hidden="true">
                <span className="flex items-center gap-1.5">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: TEACHER }} />
                  শিক্ষার্থী
                </span>
                <span className="flex items-center gap-1.5">
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#8A4416' }} />
                  মনোযোগ প্রয়োজন (নামসহ)
                </span>
              </div>
            </>
          ) : (
            <p className="sv-muted" style={{ margin: 0 }}>
              {g2.round ? 'এখনো কোনো শিক্ষার্থীর অভিভাবক ও শিক্ষক দুজনের রিভিউ নেই।' : 'এই রাউন্ডের সাথে অভিভাবকের রিভিউ নেই।'}
            </p>
          )}
        </details>
        <section className="sv-card flex flex-col gap-3 min-w-0" style={{ flex: '1 1 380px' }} aria-labelledby="areas-title">
          <h2 id="areas-title" className="sv-head sv-h2">
            ক্ষেত্রভিত্তিক তুলনা · ক্লাসের গড়
          </h2>
          <div className="flex flex-wrap gap-4" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }} aria-hidden="true">
            <span className="flex items-center gap-1.5">
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: GUARDIAN }} />
              অভিভাবক
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: TEACHER }} />
              শিক্ষক
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>গড় মার্ক (১০-এর মধ্যে), প্রত্যেক শিক্ষার্থীর গড় থেকে · ৩ জনের কম হলে হালকা</div>
          {guardian.areas.map((area) => {
            const teacher = teacherAreas.get(area.areaKey);
            const g = area.mean;
            const t = teacher?.mean ?? null;
            const side = (name: string, mean: number | null, n: number, reliable: boolean) =>
              mean === null ? `${name} —` : `${name} ${formatMark(mean, bn)} (${bn(n)} জন${reliable ? '' : ', ৩ জনের কম'})`;
            const text = [side('অভিভাবক', g, area.students, area.reliable), side('শিক্ষক', t, teacher?.students ?? 0, teacher?.reliable ?? false)];
            const gap = area.reliable && teacher?.reliable && g !== null && t !== null ? Math.round(Math.abs(g - t) * 10) / 10 : null;
            return (
              <div key={area.areaKey} className="flex flex-col gap-1.5" style={{ padding: '4px 0' }}>
                <div className="flex flex-wrap justify-between gap-2" style={{ fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>
                    {area.name}
                    {GUARDIAN_AREAS.has(area.areaKey) && <span style={{ fontWeight: 400, color: 'var(--sv-text-muted)' }}> · অভিভাবক সম্পর্কে, শিক্ষার্থীর গড়ে ধরা হয়নি</span>}
                  </span>
                  <span className="sv-num" style={{ color: 'var(--sv-text-muted)', fontWeight: 400 }}>
                    {text.join(' · ')}
                  </span>
                </div>
                <PairBar guardian={g} teacher={t} muted={{ guardian: !area.reliable, teacher: !teacher?.reliable }} label={`${area.name}: ${text.join(', ')}`} />
                {gap !== null && gap >= AREA_GAP_MARKS && (
                  <span className="sv-flag" style={{ alignSelf: 'flex-start' }}>
                    ⚠ পার্থক্য {bn(gap.toFixed(1))} মার্ক
                  </span>
                )}
              </div>
            );
          })}
          <MarkAxis />
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
        <ClassTable rows={rows} roundId={round.id} showTrend={report.rounds >= 2} showGuardian={Boolean(g2.round)} />
      </section>
    </>
  );
}
