import type { Metadata } from 'next';
import Link from 'next/link';
import { allReportRounds, classResponses } from '@/lib/survey/guardian-reports';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import { classOverview, pickRound, searchableStudents } from '@/lib/survey/reports';
import { cn } from '@/lib/utils';
import { NoRounds } from './NoRounds';
import { StudentSearch } from './StudentSearch';
import { PageTop } from '../AdminShell';
import { LINK, PageBody, PageTitle } from '../ui';

export const metadata: Metadata = { title: 'ক্লাস ও শিক্ষার্থী' };
export const dynamic = 'force-dynamic';

export default async function ReportsIndex({ searchParams }: { searchParams: Promise<{ round?: string; find?: string }> }) {
  const [{ round: requested, find }, all] = await Promise.all([searchParams, allReportRounds()]);
  const round = pickRound(
    all.filter((r) => r.kind === 'T1'),
    await chosenRoundId(requested)
  );
  if (!round) return <NoRounds />;
  const [students, classes, responses] = await Promise.all([searchableStudents(round), classOverview(round), classResponses(round, all)]);
  return (
    <>
      <PageTop crumbs={[{ label: 'ক্লাস ও শিক্ষার্থী' }]} />
      <PageBody>
        <PageTitle sub={`${round.label} · শিক্ষকের রিভিউ, মার্ক ১০-এর মধ্যে`}>ক্লাস ও শিক্ষার্থী</PageTitle>
        <StudentSearch students={students} roundId={round.id} focus={find === '1'} />
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <caption className="sv-visually-hidden">শ্রেণি · শিক্ষকের রিভিউ ও অভিভাবকের সাড়া</caption>
            <thead>
              <tr className="text-left text-[13px] text-muted-foreground [&>th]:border-b [&>th]:px-4 [&>th]:py-2.5 [&>th]:font-medium">
                <th scope="col">শ্রেণি</th>
                <th scope="col" className="text-right">
                  শিক্ষার্থী
                </th>
                <th scope="col" className="text-right">
                  শিক্ষকের রিভিউ
                </th>
                <th scope="col" className="text-right">
                  শিক্ষকদের গড়
                </th>
                <th scope="col" className="text-right">
                  অভিভাবকের সাড়া
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
                const place = responses.byPlace.get(`${c.classKey}|${c.sectionKey}`) ?? { total: 0, answered: 0 };
                const empty = !c.students;
                return (
                  <tr key={`${c.classKey}|${c.sectionKey}`} className={cn('[&>td]:border-b [&>td]:px-4 [&>td]:py-3 last:[&>td]:border-b-0', empty && 'text-muted-foreground')}>
                    <td>
                      <Link
                        href={`/admin/reports/class?${new URLSearchParams({ round: round.id, class: c.classKey, section: c.sectionKey })}`}
                        className={cn(LINK, 'font-medium', empty && 'text-muted-foreground')}
                      >
                        {c.label}
                      </Link>
                    </td>
                    <td className="text-right tabular-nums">{bn(place.total)}</td>
                    <td className="text-right tabular-nums">{empty ? 'এখনো নেই' : `${bn(c.students)} জন`}</td>
                    <td className="text-right font-medium tabular-nums">{empty ? '—' : formatMark(c.mean, bn)}</td>
                    <td className="text-right tabular-nums">{responses.g2 ? `${bn(place.answered)}/${bn(place.total)}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!responses.g2 && <p className="m-0 text-[13px] text-muted-foreground">এই রাউন্ডের সাথে অভিভাবকের রিভিউ নেই।</p>}
      </PageBody>
    </>
  );
}
