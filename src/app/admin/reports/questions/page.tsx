import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDateTime } from '@/lib/survey/dates';
import { allReportRounds, pickKindRound, questionResults } from '@/lib/survey/guardian-reports';
import { KIND_LABEL } from '@/lib/survey/labels';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { classSections } from '@/lib/survey/snapshot';
import { MIN_N } from '@/lib/survey/stats';
import { DIST_COLORS, Distribution, GUARDIAN, MANY_LOW } from '../charts';
import { ReportFilters } from '../ReportFilters';
import { ReportTools } from '../ReportTools';

export const metadata: Metadata = { title: 'প্রশ্নভিত্তিক ফলাফল' };
export const dynamic = 'force-dynamic';

type Search = { round?: string; place?: string; g1?: string; g2?: string; verified?: string };

const percent = (share: number | null) => (share === null ? '—' : `${bn(Math.round(share * 100))}%`);

type MarkQuestion = Awaited<ReturnType<typeof questionResults>>['teacher'][number];

/** Marked questions, weakest first: average, share of low answers, how many answers, spread. */
function MarkTable({ caption, questions, unit }: { caption: string; questions: MarkQuestion[]; unit: string }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="sv-table is-stackable" style={{ minWidth: 640 }}>
        <caption className="sv-visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">প্রশ্ন</th>
            <th scope="col">গড় (/১০)</th>
            <th scope="col">৭ বা কম</th>
            <th scope="col">{unit}</th>
            <th scope="col" style={{ width: 160 }}>
              মার্কের বণ্টন
            </th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => {
            const shown = q.children >= MIN_N;
            return (
              <tr key={q.key} style={{ opacity: shown ? 1 : 0.55 }}>
                <th scope="row" style={{ fontWeight: 500, textAlign: 'left', whiteSpace: 'normal' }}>
                  {q.label}
                  <div style={{ fontSize: 12.5, color: 'var(--sv-text-muted)', fontWeight: 400 }}>
                    {q.area}
                    {q.aboutGuardian ? ' · অভিভাবক সম্পর্কে, শিক্ষার্থীর গড়ে ধরা হয়নি' : ''}
                  </div>
                </th>
                <td data-label="গড়" className="sv-num">
                  {shown ? formatMark(q.mean, bn) : '—'}
                </td>
                <td data-label="৭ বা কম" className="sv-num" style={{ color: shown && (q.lowShare ?? 0) >= MANY_LOW ? 'var(--sv-warn)' : undefined, fontWeight: 600 }}>
                  {shown ? percent(q.lowShare) : '—'}
                </td>
                <td data-label={unit} className="sv-num">
                  {bn(q.children)} জন{shown ? '' : ' (৩ জনের কম)'}
                </td>
                <td data-label="বণ্টন">
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

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [search, rounds] = await Promise.all([searchParams, allReportRounds()]);
  const t1 = pickKindRound(rounds, 'T1', search.round);
  if (!t1) {
    return (
      <>
        <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
          প্রশ্নভিত্তিক ফলাফল
        </h1>
        <div className="sv-card" style={{ padding: 20 }}>
          এখনো কোনো শিক্ষক রিভিউ রাউন্ড খোলা হয়নি। <Link href="/admin/rounds">রাউন্ড পাতা</Link>
        </div>
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
            প্রশ্নভিত্তিক ফলাফল
          </h1>
          <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>
            {scope} · {t1.label}
            {verifiedOnly ? ' · শুধু যাচাইকৃত অভিভাবক' : ''}
          </div>
        </div>
        <ReportTools
          exportHref={`/admin/reports/export?${new URLSearchParams({
            kind: 'questions',
            round: t1.id,
            ...(at ? { place: `${at.classKey}|${at.sectionKey}` } : {}),
            ...(search.g1 ? { g1: search.g1 } : {}),
            ...(search.g2 ? { g2: search.g2 } : {}),
            ...(verifiedOnly ? { verified: '1' } : {}),
          })}`}
        />
      </div>

      <ReportFilters
        action="/admin/reports/questions"
        verifiedOnly={verifiedOnly}
        selects={[
          { name: 'round', label: 'রাউন্ড', value: t1.id, options: [...rounds].reverse().filter((r) => r.kind === 'T1').map((r) => ({ value: r.id, label: r.label })) },
          { name: 'place', label: 'শ্রেণি', value: at ? `${at.classKey}|${at.sectionKey}` : '', options: [{ value: '', label: 'পুরো মাদরাসা' }, ...places.map((p) => ({ value: `${p.classKey}|${p.sectionKey}`, label: p.label }))] },
          { name: 'g1', label: 'ক্লাস পরিচালনার রিভিউ', value: search.g1 ?? '', options: kindOptions('G1', report.g1?.label) },
          { name: 'g2', label: 'শিক্ষার্থীর উপর অভিভাবক রিভিউ', value: search.g2 ?? '', options: kindOptions('G2', report.g2?.label) },
        ]}
      />

      <p style={{ margin: 0, fontSize: 14, color: 'var(--sv-text-muted)', lineHeight: 1.6 }}>
        প্রতিটি প্রশ্নের গড় মার্ক, কত শতাংশ উত্তর ৭ বা তার কম, আর কতজনের উত্তর। যেখানে সবচেয়ে বেশি কম মার্ক, সেই প্রশ্ন আগে। ৩ জনের কম উত্তর হলে ফলাফল দেখানো হয় না।
      </p>

      <section className="sv-card flex flex-col gap-3" aria-labelledby="teaching-title">
        <div className="flex flex-col gap-0.5">
          <h2 id="teaching-title" className="sv-head sv-h2">
            ক্লাস পরিচালনা · অভিভাবকদের মত
          </h2>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{report.g1 ? `${report.g1.label} · সব বিষয় মিলিয়ে` : 'এই রাউন্ডের সাথে ক্লাস পরিচালনার রিভিউ নেই'}</div>
        </div>
        {report.g1 && <MarkTable caption="ক্লাস পরিচালনার প্রশ্নভিত্তিক ফলাফল" questions={report.teaching} unit="অভিভাবক" />}
      </section>

      <section className="sv-card flex flex-col gap-3" aria-labelledby="child-title">
        <div className="flex flex-col gap-0.5">
          <h2 id="child-title" className="sv-head sv-h2">
            শিক্ষার্থী · অভিভাবকদের উত্তর
          </h2>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{report.g2 ? `${report.g2.label} · কতজন অভিভাবক কোন উত্তর দিয়েছেন` : 'এই রাউন্ডের সাথে শিক্ষার্থীর উপর অভিভাবক রিভিউ নেই'}</div>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))' }}>
          {report.child.map((q) => {
            const total = q.options.reduce((sum, o) => sum + o.count, 0);
            return (
              <div key={q.key} className="flex flex-col gap-2" style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--sv-hairline)' }}>
                <div className="flex justify-between gap-2" style={{ fontSize: 14.5 }}>
                  <span style={{ fontWeight: 600 }}>{q.label}</span>
                  <span className="sv-num" style={{ color: 'var(--sv-text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {q.unscored ? 'মার্ক নেই' : q.n >= MIN_N ? `গড় ${formatMark(q.mean, bn)} · ${percent(q.lowShare)} উত্তর ৭ বা কম` : `${bn(q.answered)} জন`}
                  </span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }} className="flex flex-col gap-1.5">
                  {q.options.map((o) => (
                    <li key={o.answer} className="grid items-center gap-2" style={{ gridTemplateColumns: 'minmax(0, 1fr) 90px 52px', fontSize: 13.5 }}>
                      <span>{o.answer}</span>
                      <span aria-hidden="true" style={{ height: 8, borderRadius: 4, background: 'var(--sv-hairline-soft)', overflow: 'hidden' }}>
                        <span style={{ display: 'block', height: 8, width: `${total ? (o.count / total) * 100 : 0}%`, background: o.mark !== null && o.mark <= 7 ? DIST_COLORS[4] : GUARDIAN }} />
                      </span>
                      <span className="sv-num" style={{ textAlign: 'right' }}>
                        {bn(o.count)} জন
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sv-card flex flex-col gap-3" aria-labelledby="teacher-title">
        <div className="flex flex-col gap-0.5">
          <h2 id="teacher-title" className="sv-head sv-h2">
            শিক্ষার্থী · শিক্ষকদের মার্ক
          </h2>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{t1.label} · সব বিষয়ের শিক্ষক মিলিয়ে</div>
        </div>
        <MarkTable caption="শিক্ষকদের প্রশ্নভিত্তিক ফলাফল" questions={report.teacher} unit="শিক্ষার্থী" />
      </section>

      <section className="sv-card flex flex-col gap-2.5" aria-labelledby="comments-title">
        <h2 id="comments-title" className="sv-head sv-h2">
          অভিভাবকদের মন্তব্য ({bn(report.comments.length)})
        </h2>
        {report.comments.length === 0 && <p className="sv-muted" style={{ margin: 0 }}>কোনো মন্তব্য নেই।</p>}
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }} className="flex flex-col gap-2">
          {report.comments.map((c, i) => (
            <li key={i} className="flex flex-col gap-1" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--sv-hairline)', fontSize: 14 }}>
              <div className="flex flex-wrap gap-2" style={{ fontSize: 13 }}>
                <span className="sv-tag">{KIND_LABEL[c.kind]}</span>
                <b>{c.place}</b>
                <span className="sv-muted">
                  {c.child} · {c.who}
                  {c.relation ? ` (${c.relation})` : ''}
                </span>
                {!c.verified && <span style={{ color: 'var(--sv-text-muted)' }}>· নম্বর ERP-র সাথে মেলেনি</span>}
                <span className="sv-muted">{c.submittedAt ? formatDateTime(c.submittedAt) : ''}</span>
              </div>
              <div style={{ lineHeight: 1.6 }}>{c.text}</div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
