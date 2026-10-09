import type { Metadata } from 'next';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import { MARK_FLOOR } from '@/lib/survey/scoring';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { pickRound, raterReport, t1Rounds } from '@/lib/survey/reports';
import { MIN_N } from '@/lib/survey/stats';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DistLegend, Distribution, LeniencyDot } from '../charts';
import { NoRounds } from '../NoRounds';
import { ReportTools } from '../ReportTools';
import { PageTop } from '../../AdminShell';
import { Card, PageBody, PageTitle } from '../../ui';

export const metadata: Metadata = { title: 'শিক্ষকদের রেটিং প্যাটার্ন' };
export const dynamic = 'force-dynamic';

/** Rounded first, so a tiny difference shows as ০.০, not −০.০. */
const signed = (delta: number) => {
  const r = Math.round(delta * 10) / 10;
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${bn(Math.abs(r).toFixed(1))}`;
};

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
  const round = pickRound(rounds, await chosenRoundId(search.round));
  if (!round) return <NoRounds />;
  const rows = await raterReport(round);

  const few = (n: number) => n < MIN_N && <span className="text-[12px] font-normal text-muted-foreground"> (n&lt;৩)</span>;

  return (
    <>
      <PageTop crumbs={[{ label: 'রিপোর্ট' }, { label: 'শিক্ষকদের রেটিং প্যাটার্ন' }]} actions={<ReportTools exportHref={`/admin/reports/export?${new URLSearchParams({ kind: 'raters', round: round.id })}`} />} />
      <PageBody>
        <PageTitle sub={`শিক্ষকের রিভিউ · ${round.label} · কে কেমন মার্ক দেন, যাতে তুলনা ন্যায্য হয়`}>শিক্ষকদের রেটিং প্যাটার্ন</PageTitle>

        <details className="group rounded-xl border bg-card px-5 py-1.5 text-sm leading-relaxed">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 font-medium [&::-webkit-details-marker]:hidden">
            <ChevronRight aria-hidden className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
            কীভাবে পড়বেন
          </summary>
          <ul className="m-0 flex list-disc flex-col gap-1.5 pb-3 pl-5">
            <li>
              <b className="font-semibold">সহকর্মীদের তুলনায়</b>: একই শিক্ষার্থীদের অন্য শিক্ষকেরা যে মার্ক দিয়েছেন, তার সাথে গড় পার্থক্য। + মানে বেশি উদার; দাগে কঠোর ← ০ → উদার, −২ থেকে +২ মার্ক।
            </li>
            <li>
              <b className="font-semibold">একই মার্ক</b>: কোনো ক্লাস-বিষয়ে ১০+ শিক্ষার্থীর ৯০% বা বেশি উত্তরে একই মার্ক হলে চিহ্নিত হয়। ভালো ক্লাসে এটা স্বাভাবিকও হতে পারে — অভিযোগ নয়, দেখে নেওয়ার বিষয়।
            </li>
          </ul>
        </details>

        <Card title="শিক্ষকভিত্তিক সারাংশ" action={<DistLegend />}>
          {rows.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">এই রাউন্ডে এখনো কোনো জমা নেই।</p>
          ) : (
            <>
              <div role="region" aria-label="শিক্ষকভিত্তিক সারাংশের টেবিল" tabIndex={0} className="hidden overflow-x-auto md:block print:block">
                <table className="w-full min-w-[920px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-[13px] text-muted-foreground [&>th]:border-b [&>th]:px-2.5 [&>th]:py-2 [&>th]:font-medium">
                      <th scope="col">শিক্ষক</th>
                      <th scope="col" className="w-64">
                        সারকথা
                      </th>
                      <th scope="col" className="text-right">
                        ক্লাস-বিষয়
                      </th>
                      <th scope="col" className="text-right">
                        শিক্ষার্থী
                      </th>
                      <th scope="col" className="text-right">
                        গড় মার্ক
                      </th>
                      <th scope="col" className="w-52">
                        মার্কের বণ্টন
                      </th>
                      <th scope="col" className="w-56">
                        সহকর্মীদের তুলনায়
                      </th>
                      <th scope="col">একই মার্ক</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const distLabel = r.distribution.map((d) => `${bn(d.mark)}: ${bn(d.count)}টি`).join(', ');
                      return (
                        <tr key={r.teacherKey} className="[&>td]:border-b [&>td]:px-2.5 [&>td]:py-3 [&>td]:align-top last:[&>td]:border-b-0">
                          <td className="whitespace-nowrap font-semibold">{r.name}</td>
                          <td className="text-[13.5px] leading-normal">{verdict(r)}</td>
                          <td className="text-right tabular-nums">{bn(r.batches)}</td>
                          <td className="text-right tabular-nums">{bn(r.students)}</td>
                          <td className={cn('whitespace-nowrap text-right font-semibold tabular-nums', r.students < MIN_N && 'text-muted-foreground')}>
                            {formatMark(r.mean, bn)}
                            {few(r.students)}
                          </td>
                          <td className="pt-4">
                            <Distribution items={r.distribution} label={`${r.name}: ${distLabel}`} />
                          </td>
                          <td>
                            {r.leniency ? (
                              <div className="flex items-center gap-2.5">
                                <LeniencyDot
                                  delta={r.leniency.delta}
                                  label={`${r.name}: সহকর্মীদের তুলনায় ${signed(r.leniency.delta)} মার্ক, ${bn(r.leniency.pairedStudents)} জন শিক্ষার্থীর তুলনায়`}
                                />
                                <span className={cn('w-16 text-right font-semibold tabular-nums', r.leniency.pairedStudents < MIN_N && 'text-muted-foreground')}>
                                  {signed(r.leniency.delta)}
                                  {few(r.leniency.pairedStudents)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[13px] text-muted-foreground">তুলনার মতো সহকর্মী নেই</span>
                            )}
                          </td>
                          <td>
                            {r.flatBatches.length ? (
                              <span className="flex flex-col gap-1 text-[13px] text-warning">
                                {r.flatBatches.map((b) => (
                                  <span key={b.label}>
                                    ⚠ {b.label} · {bn(Math.round(b.share * 100))}% {b.mark !== null ? bn(b.mark) : ''}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phones: one short row per teacher; the summary sentence says the rest. */}
              <ul className="m-0 flex list-none flex-col p-0 md:hidden print:hidden" aria-label="শিক্ষকভিত্তিক সারাংশ">
                {rows.map((r) => (
                  <li key={r.teacherKey} className="flex flex-col gap-1 border-b py-3 last:border-b-0">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{r.name}</span>
                      <span className="whitespace-nowrap text-[13px] tabular-nums text-muted-foreground">
                        গড় <b className="font-semibold text-foreground">{formatMark(r.mean, bn)}</b>
                        {r.leniency && ` · তুলনায় ${signed(r.leniency.delta)}`}
                        {r.flatBatches.length > 0 && <span className="text-warning"> · ⚠ {bn(r.flatBatches.length)}</span>}
                      </span>
                    </span>
                    <span className="text-[13px] leading-snug text-muted-foreground">{verdict(r)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </PageBody>
    </>
  );
}
