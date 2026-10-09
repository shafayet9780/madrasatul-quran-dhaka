import type { Metadata } from 'next';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import Link from 'next/link';
import { formatDateTime } from '@/lib/survey/dates';
import { allReportRounds, pickKindRound, questionResults } from '@/lib/survey/guardian-reports';
import { KIND_LABEL } from '@/lib/survey/labels';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { classSections } from '@/lib/survey/snapshot';
import { MIN_N } from '@/lib/survey/stats';
import { cn } from '@/lib/utils';
import { DIST_COLORS, DistLegend, Distribution, GUARDIAN, MANY_LOW } from '../charts';
import { ReportFilters } from '../ReportFilters';
import { ReportTools } from '../ReportTools';
import { PageTop } from '../../AdminShell';
import { EmptyState, LINK, PageBody, PageTitle } from '../../ui';
// The student page's tabs: every panel stays rendered, so printing shows all four.
import { ResponseTabs } from '../student/[erpId]/ResponseTabs';

export const metadata: Metadata = { title: 'প্রশ্নভিত্তিক ফলাফল' };
export const dynamic = 'force-dynamic';

type Search = { round?: string; place?: string; g1?: string; g2?: string; verified?: string };

const percent = (share: number | null) => (share === null ? '—' : `${bn(Math.round(share * 100))}%`);

type MarkQuestion = Awaited<ReturnType<typeof questionResults>>['teacher'][number];

/** Marked questions, weakest first: average, share of low answers, how many answers, spread. */
function MarkTable({ caption, questions, unit }: { caption: string; questions: MarkQuestion[]; unit: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm md:min-w-[600px]">
        <caption className="sv-visually-hidden">{caption}</caption>
        <thead>
          <tr className="text-left text-[13px] text-muted-foreground [&>th]:border-b [&>th]:px-2 [&>th]:py-2 [&>th]:font-medium sm:[&>th]:px-2.5">
            <th scope="col">প্রশ্ন</th>
            <th scope="col" className="whitespace-nowrap text-right">
              গড় (/১০)
            </th>
            <th scope="col" className="text-right">
              ৭ বা কম
            </th>
            <th scope="col" className="text-right">
              {unit}
            </th>
            <th scope="col" className="hidden w-40 md:table-cell print:table-cell">
              মার্কের বণ্টন
            </th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => {
            const shown = q.children >= MIN_N;
            return (
              <tr key={q.key} className={cn('[&>td]:border-b [&>td]:px-2 [&>td]:py-2.5 [&>th]:border-b [&>th]:px-2 [&>th]:py-2.5 sm:[&>td]:px-2.5 sm:[&>th]:px-2.5', !shown && 'opacity-55')}>
                <th scope="row" className="text-left font-medium">
                  {q.label}
                  <span className="block text-[12.5px] font-normal text-muted-foreground">
                    {q.area}
                    {q.aboutGuardian ? ' · অভিভাবক সম্পর্কে, শিক্ষার্থীর গড়ে ধরা হয়নি' : ''}
                  </span>
                </th>
                <td className="text-right font-semibold tabular-nums">{shown ? formatMark(q.mean, bn) : '—'}</td>
                <td className={cn('text-right font-semibold tabular-nums', shown && (q.lowShare ?? 0) >= MANY_LOW && 'text-warning')}>{shown ? percent(q.lowShare) : '—'}</td>
                <td className="whitespace-nowrap text-right tabular-nums">
                  {bn(q.children)} জন{shown ? '' : ' (৩ জনের কম)'}
                </td>
                <td className="hidden md:table-cell print:table-cell">
                  {shown && (
                    <Distribution
                      items={[...q.distribution].map(([mark, count]) => ({ mark, count }))}
                      label={`${q.label}: ${[...q.distribution]
                        .sort((a, b) => a[0] - b[0])
                        .map(([mark, count]) => `${bn(mark)} মার্ক ${bn(count)}টি`)
                        .join(', ')}`}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Panel({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h2 className="m-0 text-[15px] font-semibold">{title}</h2>
        <p className="m-0 text-[13px] text-muted-foreground">{sub}</p>
      </div>
      {children}
    </>
  );
}

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [search, rounds] = await Promise.all([searchParams, allReportRounds()]);
  const t1 = pickKindRound(rounds, 'T1', await chosenRoundId(search.round));
  if (!t1) {
    return (
      <>
        <PageTop crumbs={[{ label: 'রিপোর্ট' }, { label: 'প্রশ্নভিত্তিক ফলাফল' }]} />
        <PageBody>
          <PageTitle>প্রশ্নভিত্তিক ফলাফল</PageTitle>
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
  const places = classSections(t1.snapshot);
  const at = places.find((p) => `${p.classKey}|${p.sectionKey}` === search.place) ?? null;
  const report = await questionResults(t1, rounds, { g1: search.g1 || undefined, g2: search.g2 || undefined }, at, { verifiedOnly });
  const kindOptions = (kind: 'G1' | 'G2', current: string | undefined) => [
    { value: '', label: `স্বয়ংক্রিয় (${current ?? 'নেই'})` },
    ...[...rounds].reverse().filter((r) => r.kind === kind).map((r) => ({ value: r.id, label: r.label })),
  ];
  const scope = at ? at.label : 'পুরো মাদরাসা';

  return (
    <>
      <PageTop crumbs={[{ label: 'রিপোর্ট' }, { label: 'প্রশ্নভিত্তিক ফলাফল' }]} actions={<ReportTools
          exportHref={`/admin/reports/export?${new URLSearchParams({
            kind: 'questions',
            round: t1.id,
            ...(at ? { place: `${at.classKey}|${at.sectionKey}` } : {}),
            ...(search.g1 ? { g1: search.g1 } : {}),
            ...(search.g2 ? { g2: search.g2 } : {}),
            ...(verifiedOnly ? { verified: '1' } : {}),
          })}`}
        />} />
      <PageBody>
        <PageTitle sub={`${scope} · ${t1.label}${verifiedOnly ? ' · শুধু যাচাইকৃত অভিভাবক' : ''}`}>প্রশ্নভিত্তিক ফলাফল</PageTitle>

        <ReportFilters
          action="/admin/reports/questions"
          verifiedOnly={verifiedOnly}
          selects={[
            { name: 'place', label: 'শ্রেণি', value: at ? `${at.classKey}|${at.sectionKey}` : '', options: [{ value: '', label: 'পুরো মাদরাসা' }, ...places.map((p) => ({ value: `${p.classKey}|${p.sectionKey}`, label: p.label }))] },
            { name: 'g1', label: 'ক্লাস পরিচালনার রিভিউ', value: search.g1 ?? '', options: kindOptions('G1', report.g1?.label), more: true },
            { name: 'g2', label: 'শিক্ষার্থীর উপর অভিভাবক রিভিউ', value: search.g2 ?? '', options: kindOptions('G2', report.g2?.label), more: true },
          ]}
        />

        <section className="flex flex-col gap-3 rounded-xl border bg-card p-5" aria-label="প্রশ্নভিত্তিক ফলাফল">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 max-w-[75ch] text-[13.5px] leading-relaxed text-muted-foreground">
              প্রতিটি প্রশ্নের গড় মার্ক, কত শতাংশ উত্তর ৭ বা তার কম, আর কতজনের উত্তর। যেখানে সবচেয়ে বেশি কম মার্ক, সেই প্রশ্ন আগে। ৩ জনের কম উত্তর হলে ফলাফল দেখানো হয় না।
            </p>
            <span className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              মার্কের বণ্টন: <DistLegend />
            </span>
          </div>
          <ResponseTabs
            label="কোন ফলাফল"
            tabs={[
              {
                key: 'teaching',
                label: 'ক্লাস পরিচালনা',
                sub: 'অভিভাবকদের মত',
                content: (
                  <Panel title="ক্লাস পরিচালনা · অভিভাবকদের মত" sub={report.g1 ? `${report.g1.label} · সব বিষয় মিলিয়ে` : 'এই রাউন্ডের সাথে ক্লাস পরিচালনার রিভিউ নেই'}>
                    {report.g1 && <MarkTable caption="ক্লাস পরিচালনার প্রশ্নভিত্তিক ফলাফল" questions={report.teaching} unit="অভিভাবক" />}
                  </Panel>
                ),
              },
              {
                key: 'child',
                label: 'শিক্ষার্থী · অভিভাবক',
                sub: 'কোন উত্তর কতজন',
                content: (
                  <Panel title="শিক্ষার্থী · অভিভাবকদের উত্তর" sub={report.g2 ? `${report.g2.label} · কতজন অভিভাবক কোন উত্তর দিয়েছেন` : 'এই রাউন্ডের সাথে শিক্ষার্থীর উপর অভিভাবক রিভিউ নেই'}>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-3">
                      {report.child.map((q) => {
                        const total = q.options.reduce((sum, o) => sum + o.count, 0);
                        return (
                          <div key={q.key} className="flex flex-col gap-2 rounded-lg border p-3.5">
                            <div className="flex justify-between gap-2 text-[14.5px]">
                              <span className="font-semibold">{q.label}</span>
                              <span className="whitespace-nowrap text-[13px] text-muted-foreground tabular-nums">
                                {q.unscored ? 'মার্ক নেই' : q.n >= MIN_N ? `গড় ${formatMark(q.mean, bn)} · ${percent(q.lowShare)} উত্তর ৭ বা কম` : `${bn(q.answered)} জন`}
                              </span>
                            </div>
                            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                              {q.options.map((o) => (
                                <li key={o.answer} className="grid grid-cols-[minmax(0,1fr)_90px_52px] items-center gap-2 text-[13.5px]">
                                  <span>{o.answer}</span>
                                  <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
                                    <span className="block h-2" style={{ width: `${total ? (o.count / total) * 100 : 0}%`, background: o.mark !== null && o.mark <= 7 ? DIST_COLORS[4] : GUARDIAN }} />
                                  </span>
                                  <span className="text-right tabular-nums">{bn(o.count)} জন</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                ),
              },
              {
                key: 'teacher',
                label: 'শিক্ষার্থী · শিক্ষক',
                sub: 'শিক্ষকদের মার্ক',
                content: (
                  <Panel title="শিক্ষার্থী · শিক্ষকদের মার্ক" sub={`${t1.label} · সব বিষয়ের শিক্ষক মিলিয়ে`}>
                    <MarkTable caption="শিক্ষকদের প্রশ্নভিত্তিক ফলাফল" questions={report.teacher} unit="শিক্ষার্থী" />
                  </Panel>
                ),
              },
              {
                key: 'comments',
                label: `মন্তব্য (${bn(report.comments.length)})`,
                sub: 'অভিভাবকদের',
                content: (
                  <Panel title={`অভিভাবকদের মন্তব্য (${bn(report.comments.length)})`} sub="নতুনগুলো আগে">
                    {report.comments.length === 0 && <p className="m-0 text-sm text-muted-foreground">কোনো মন্তব্য নেই।</p>}
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                      {report.comments.map((c, i) => (
                        <li key={i} className="flex flex-col gap-1 rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                            <span className="inline-flex h-[22px] items-center rounded-md border bg-card px-2 text-xs font-medium">{KIND_LABEL[c.kind]}</span>
                            <b className="font-semibold">{c.place}</b>
                            <span className="text-muted-foreground">
                              {c.child} · {c.who}
                              {c.relation ? ` (${c.relation})` : ''}
                            </span>
                            {!c.verified && <span className="text-muted-foreground">· নম্বর ERP-র সাথে মেলেনি</span>}
                            <span className="text-muted-foreground">{c.submittedAt ? formatDateTime(c.submittedAt) : ''}</span>
                          </div>
                          <div className="leading-relaxed">{c.text}</div>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                ),
              },
            ]}
          />
        </section>
      </PageBody>
    </>
  );
}
