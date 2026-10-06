import type { Metadata } from 'next';
import Link from 'next/link';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import { classOverview, pickRound, searchableStudents, t1Rounds } from '@/lib/survey/reports';
import { NoRounds } from './NoRounds';
import { StudentSearch } from './StudentSearch';
import { PageTop } from '../AdminShell';

export const metadata: Metadata = { title: 'ক্লাস ও শিক্ষার্থী' };
export const dynamic = 'force-dynamic';

export default async function ReportsIndex({ searchParams }: { searchParams: Promise<{ round?: string; find?: string }> }) {
  const [{ round: requested, find }, rounds] = await Promise.all([searchParams, t1Rounds()]);
  const round = pickRound(rounds, await chosenRoundId(requested));
  return (
    <>
      <PageTop crumbs={[{ label: 'ক্লাস ও শিক্ষার্থী' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
            ক্লাস ও শিক্ষার্থী
          </h1>
          <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>শিক্ষকের রিভিউ · মার্ক ১০-এর মধ্যে</div>
        </div>
      </div>
      {!round ? (
        <NoRounds />
      ) : (
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          <StudentSearch students={await searchableStudents(round)} roundId={round.id} focus={find === '1'} />
          <section className="sv-card flex flex-col gap-3" aria-labelledby="class-pick-title">
            <h2 id="class-pick-title" className="sv-head sv-h2">
              ক্লাস · বাছাই করুন
            </h2>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {(await classOverview(round)).map((c) => (
                <Link
                  key={`${c.classKey}|${c.sectionKey}`}
                  href={`/admin/reports/class?${new URLSearchParams({ round: round.id, class: c.classKey, section: c.sectionKey })}`}
                  className="flex flex-col gap-1"
                  style={{ padding: 12, borderRadius: 12, border: '1px solid var(--sv-hairline)', textDecoration: 'none', color: 'var(--sv-text)' }}
                >
                  <span style={{ fontWeight: 600 }}>{c.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
                    {c.students ? `${bn(c.students)} জন · গড় ${formatMark(c.mean, bn)}` : 'এখনো রিভিউ নেই'}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
