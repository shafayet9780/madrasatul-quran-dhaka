import type { Metadata } from 'next';
import Link from 'next/link';
import { allReportRounds, classGuardian, withGuardian } from '@/lib/survey/guardian-reports';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatLow, formatMark, GUARDIAN_AREAS } from '@/lib/survey/report-math';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import { classReport, pickRound } from '@/lib/survey/reports';
import { MIN_N } from '@/lib/survey/stats';
import { cn } from '@/lib/utils';
import { AREA_GAP_MARKS } from '../charts';
import { NoRounds } from '../NoRounds';
import { ReportFilters } from '../ReportFilters';
import { ReportTools } from '../ReportTools';
import { ClassTable } from './ClassTable';
import { PageTop } from '../../AdminShell';
import { Card, EmptyState, LINK, PageBody, PageTitle, StatTile, StatTiles } from '../../ui';

export const metadata: Metadata = { title: 'ক্লাস রিপোর্ট' };
export const dynamic = 'force-dynamic';

type Search = { round?: string; class?: string; section?: string; verified?: string };

const average = (list: number[]) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);

/** One side of the comparison: the mark, and how many children it rests on (light below 3). */
function Side({ mean, n, reliable }: { mean: number | null; n: number; reliable: boolean }) {
  if (mean === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn('flex flex-col items-end', !reliable && 'text-muted-foreground')}>
      <span className="text-[15px] font-semibold tabular-nums">{formatMark(mean, bn)}</span>
      <span className="text-[12px] font-normal text-muted-foreground">{bn(n)} জন</span>
    </span>
  );
}

export default async function ClassReportPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [search, all] = await Promise.all([searchParams, allReportRounds()]);
  const rounds = all.filter((r) => r.kind === 'T1');
  const round = pickRound(rounds, await chosenRoundId(search.round));
  if (!round) return <NoRounds />;
  const verifiedOnly = search.verified === '1';
  const place = { classKey: search.class ?? '', sectionKey: search.section ?? '' };
  const [report, guardian] = search.class ? await Promise.all([classReport(round, place.classKey, place.sectionKey), classGuardian(round, all, place, { verifiedOnly })]) : [null, null];
  if (!report || !guardian) {
    return (
      <>
        <PageTop crumbs={[{ label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports' }, { label: 'পাওয়া যায়নি' }]} />
        <PageBody>
          <EmptyState>
            শ্রেণিটি এই রাউন্ডে নেই।{' '}
            <Link href={`/admin/reports?round=${round.id}`} className={LINK}>
              ক্লাস বাছাই করুন
            </Link>
          </EmptyState>
        </PageBody>
      </>
    );
  }
  const { kpis } = report;
  const params = { class: place.classKey, section: place.sectionKey };
  const reliable = kpis.ratedStudents >= MIN_N;
  const rows = withGuardian(report.rows, guardian);
  const answered = rows.filter((r) => r.form !== 'none').length;
  const g2 = guardian.g2;
  const g1 = guardian.g1;
  const teacherAreas = new Map(report.areas.map((a) => [a.areaKey, a]));
  // The comparison: every area, both sides; the average and the ⚠ only where both rest on 3+ children.
  const compared = guardian.areas.map((area) => {
    const teacher = teacherAreas.get(area.areaKey);
    const both = area.reliable && Boolean(teacher?.reliable) && area.mean !== null && teacher?.mean != null;
    return { area, teacher, gap: both ? Math.round(Math.abs(area.mean! - teacher!.mean!) * 10) / 10 : null, counted: both && !GUARDIAN_AREAS.has(area.areaKey) };
  });
  const counted = compared.filter((c) => c.counted);
  const teacherAverage = average(counted.map((c) => c.teacher!.mean!));
  const guardianAverage = average(counted.map((c) => c.area.mean!));

  return (
    <>
      <PageTop crumbs={[{ label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports' }, { label: report.label }]} actions={<ReportTools exportHref={`/admin/reports/export?${new URLSearchParams({ kind: 'class', round: round.id, ...params, ...(verifiedOnly ? { verified: '1' } : {}) })}`} />} />
      <PageBody>
        <PageTitle
          sub={
            <>
              {bn(rows.length)} জন শিক্ষার্থী{g2.round ? ` · অভিভাবকের সাড়া ${bn(answered)}/${bn(rows.length)}` : ''} · শিক্ষকের রিভিউ {bn(kpis.subjectsCovered)}/{bn(kpis.subjectsTotal)} বিষয় · {round.label}
              {verifiedOnly ? ' · শুধু যাচাইকৃত অভিভাবক' : ''}
            </>
          }
        >
          {report.label}
        </PageTitle>
        {g2.round && <ReportFilters action="/admin/reports/class" keep={{ round: round.id, ...params }} verifiedOnly={verifiedOnly} />}

        <StatTiles>
          <StatTile
            label="শিক্ষকের রিভিউ"
            value={reliable ? formatMark(kpis.mean, bn) : '—'}
            unit="/১০"
            sub={reliable ? `${bn(kpis.ratedStudents)}/${bn(rows.length)} জনের রিভিউ · ${formatLow(kpis.lowShare, bn)}` : `মাত্র ${bn(kpis.ratedStudents)} জনের রিভিউ (৩ জনের কম)`}
            muted={!reliable}
          />
          <StatTile
            label="অভিভাবক · শিক্ষার্থী"
            value={g2.round && g2.reliable ? formatMark(g2.mean, bn) : '—'}
            unit="/১০"
            sub={
              !g2.round
                ? 'এই রাউন্ডের সাথে অভিভাবকের রিভিউ নেই'
                : g2.reliable
                  ? `${bn(g2.respondents)}/${bn(rows.length)} জনের অভিভাবক · ${formatLow(g2.lowShare, bn)}`
                  : `মাত্র ${bn(g2.respondents)} জনের অভিভাবক (৩ জনের কম)`
            }
            muted={!g2.reliable}
          />
          <StatTile
            label="অভিভাবক · ক্লাস পরিচালনা"
            value={g1.round && g1.reliable ? formatMark(g1.mean, bn) : '—'}
            unit="/১০"
            sub={
              !g1.round
                ? 'এই রাউন্ডের সাথে ক্লাস পরিচালনার রিভিউ নেই'
                : !g1.reliable
                  ? `মাত্র ${bn(g1.respondents)} জন অভিভাবক (৩ জনের কম)`
                  : `${bn(g1.respondents)} জন অভিভাবক · ${formatLow(g1.lowShare, bn)}${g1.lowest ? ` · সবচেয়ে কম: ${g1.lowest.name} ${formatMark(g1.lowest.mean, bn)}` : ''}`
            }
            muted={!g1.reliable}
          />
          <StatTile label="মনোযোগ প্রয়োজন" value={bn(rows.filter((r) => r.flags.length).length)} unit="জন" sub="নিচের তালিকায় চিহ্নিত" href="#students" />
        </StatTiles>

        <Card title="ক্ষেত্রভিত্তিক তুলনা · শিক্ষক বনাম অভিভাবক">
          <p className="m-0 -mt-1 mb-3 text-[13px] text-muted-foreground">ক্লাসের গড় মার্ক, ১০-এর মধ্যে, প্রত্যেক শিক্ষার্থীর গড় থেকে · জন = যত শিক্ষার্থীর মার্ক আছে</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" aria-label="ক্ষেত্রভিত্তিক তুলনা">
              <thead>
                <tr className="text-[13px] text-muted-foreground [&>th]:border-b [&>th]:px-2 [&>th]:py-2 [&>th]:font-medium sm:[&>th]:px-3">
                  <th scope="col" className="text-left">
                    ক্ষেত্র
                  </th>
                  <th scope="col" className="w-16 text-right sm:w-28">
                    শিক্ষক
                  </th>
                  <th scope="col" className="w-16 text-right sm:w-28">
                    অভিভাবক
                  </th>
                  <th scope="col" className="w-16 text-right sm:w-28">
                    পার্থক্য
                  </th>
                </tr>
              </thead>
              <tbody>
                {compared.map(({ area, teacher, gap }) => {
                  const wide = gap !== null && gap >= AREA_GAP_MARKS;
                  return (
                    <tr key={area.areaKey} className={cn('[&>td]:border-b [&>td]:px-2 [&>td]:py-2 [&>th]:border-b [&>th]:px-2 [&>th]:py-2 sm:[&>td]:px-3 sm:[&>th]:px-3', wide && 'bg-[var(--sv-warn-bg)]')}>
                      <th scope="row" className="text-left font-medium">
                        {area.name}
                        {GUARDIAN_AREAS.has(area.areaKey) && <span className="block text-[12.5px] font-normal text-muted-foreground">অভিভাবক সম্পর্কে · গড়ে ধরা হয়নি</span>}
                      </th>
                      <td className="text-right">
                        <Side mean={teacher?.mean ?? null} n={teacher?.students ?? 0} reliable={teacher?.reliable ?? false} />
                      </td>
                      <td className="text-right">
                        <Side mean={area.mean} n={area.students} reliable={area.reliable} />
                      </td>
                      <td className={cn('text-right text-[15px] font-semibold tabular-nums', wide && 'text-warning')}>{gap === null ? <span className="font-normal text-muted-foreground">—</span> : `${wide ? '⚠ ' : ''}${bn(gap.toFixed(1))}`}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="[&>td]:px-2 [&>td]:pt-2.5 [&>th]:px-2 [&>th]:pt-2.5 sm:[&>td]:px-3 sm:[&>th]:px-3">
                  <th scope="row" className="text-left font-semibold">
                    গড়
                    <span className="block text-[12.5px] font-normal text-muted-foreground">দুই দিকেরই মার্ক আছে এমন ক্ষেত্র</span>
                  </th>
                  <td className="text-right text-base font-semibold tabular-nums">{formatMark(teacherAverage, bn)}</td>
                  <td className="text-right text-base font-semibold tabular-nums">{formatMark(guardianAverage, bn)}</td>
                  <td className="text-right text-base font-semibold tabular-nums">{teacherAverage !== null && guardianAverage !== null ? bn(Math.abs(teacherAverage - guardianAverage).toFixed(1)) : '—'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="m-0 mt-3 text-[13px] text-muted-foreground">⚠ = {bn(AREA_GAP_MARKS)} মার্ক বা বেশি পার্থক্য · হালকা = ৩ জনের কম, তাই তুলনা ও গড়ে ধরা হয়নি</p>
        </Card>

        <section id="students" className="scroll-mt-20 rounded-xl border bg-card p-5" aria-labelledby="students-title">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="students-title" className="m-0 text-[15px] font-semibold">
              শিক্ষার্থী তালিকা
            </h2>
            <span className="hidden text-[13px] text-muted-foreground md:inline">কলাম শিরোনামে চাপ দিয়ে সাজান · নামে চাপ দিলে প্রোফাইল</span>
          </div>
          {report.rounds < 2 && <p className="m-0 mb-2 text-[13px] text-muted-foreground">দ্বিতীয় রাউন্ড থেকে প্রবণতা দেখা যাবে।</p>}
          <ClassTable rows={rows} roundId={round.id} showTrend={report.rounds >= 2} showGuardian={Boolean(g2.round)} />
        </section>
      </PageBody>
    </>
  );
}
