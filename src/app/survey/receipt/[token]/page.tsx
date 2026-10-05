import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDateTime } from '@/lib/survey/dates';
import { batchLabel, bn, questionLabel, referenceNumber } from '@/lib/survey/labels';
import { surveyAccess } from '@/lib/survey/round-status';
import { fetchOfficePhone } from '@/lib/survey/sanity-source';
import { loadReceipt } from '@/lib/survey/t1';
import { LinkInvalid } from '../../[slug]/StatusScreens';
import { PrintButton } from './PrintButton';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'রসিদ' };

const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' });

export default async function ReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const receipt = /^[A-Za-z0-9_-]{8,64}$/.test(token) ? await loadReceipt(token) : null;
  if (!receipt || receipt.submission.kind !== 'T1') return <LinkInvalid phone={await fetchOfficePhone().catch(() => null)} />;

  const { submission, round, rows, replacedBy, setAside } = receipt;
  const { questions } = round.snapshot.template;
  const key = { classKey: submission.classKey, sectionKey: submission.sectionKey, subjectKey: submission.subjectKey };
  const label = batchLabel(round.snapshot, key);
  const access = surveyAccess(round);
  const canEdit = !replacedBy && !setAside && (access === 'open' || access === 'grace');
  const surveyBase = `/survey/${round.slug}?k=${encodeURIComponent(round.linkKey)}`;
  // Through the class step, so a shared device shows whose name it will edit under before opening the batch.
  const editHref = `${surveyBase}&step=class&c=${key.classKey}${key.sectionKey ? `&s=${key.sectionKey}` : ''}&sub=${key.subjectKey}`;
  const noted = rows.filter((r) => r.note);

  return (
    <main className="sv-screen" style={{ paddingBottom: 32 }}>
      <div className="flex flex-col items-center gap-2.5 text-center" style={{ padding: '36px 20px 0' }}>
        <div aria-hidden="true" className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--sv-ok-bg)' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--sv-ok)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5 9-10" />
          </svg>
        </div>
        <h1 className="sv-head sv-h1">রিভিউ জমা হয়েছে</h1>
        <div style={{ fontSize: 15, color: 'var(--sv-text-muted)' }}>জাযাকাল্লাহু খাইরান</div>
      </div>

      {setAside && (
        <div className="sv-banner is-info sv-no-print" style={{ margin: '18px 16px 0' }}>
          <span>এই ক্লাস ও বিষয়ে অন্য একজন শিক্ষকের রিভিউ রাখা হয়েছে, তাই এটি রিপোর্টে গণ্য হবে না। প্রশ্ন থাকলে অফিসে যোগাযোগ করুন।</span>
        </div>
      )}
      {replacedBy && (
        <div className="sv-banner is-info sv-no-print" style={{ margin: '18px 16px 0' }}>
          <span>
            এই রিভিউ পরে সংশোধন করা হয়েছে। <Link href={`/survey/receipt/${replacedBy}`}>নতুন রসিদ দেখুন</Link>
          </span>
        </div>
      )}

      <dl
        className="grid"
        style={{
          margin: '18px 16px 0',
          background: '#fff',
          border: '1px solid var(--sv-hairline)',
          borderRadius: 18,
          padding: '16px 18px',
          gridTemplateColumns: '96px minmax(0, 1fr)',
          rowGap: 8,
          columnGap: 8,
          fontSize: 14,
        }}
      >
        <dt className="sv-muted">রেফারেন্স নং</dt>
        <dd className="sv-num" style={{ margin: 0, letterSpacing: 0.5 }}>
          {referenceNumber(submission.id)}
        </dd>
        <dt className="sv-muted">শিক্ষক</dt>
        <dd style={{ margin: 0, fontWeight: 600 }}>{submission.teacherName}</dd>
        <dt className="sv-muted">ক্লাস ও বিষয়</dt>
        <dd style={{ margin: 0, fontWeight: 600 }}>{label}</dd>
        <dt className="sv-muted">রাউন্ড</dt>
        <dd style={{ margin: 0 }}>{round.label}</dd>
        <dt className="sv-muted">জমার সময়</dt>
        <dd style={{ margin: 0 }}>{formatDateTime(submission.submittedAt!)}</dd>
      </dl>

      <div style={{ margin: '14px 12px 0', background: '#fff', borderRadius: 16, border: '1px solid var(--sv-hairline)', overflowX: 'auto' }}>
        <table className="sv-receipt-table">
          <caption className="sv-visually-hidden">প্রতিটি শিক্ষার্থীর মার্ক, প্রশ্ন অনুযায়ী</caption>
          <thead>
            <tr>
              <th scope="col">শিক্ষার্থী</th>
              {questions.map((question, q) => (
                <th key={question.key} scope="col" title={questionLabel(question)}>
                  {bn(q + 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.erpId}>
                <th scope="row" style={{ fontWeight: 400 }}>
                  <span className="sv-muted" style={{ display: 'inline-block', width: 20 }}>
                    {row.roll !== null ? bn(row.roll) : '–'}
                  </span>
                  {row.name}
                </th>
                {questions.map((question) => (
                  <td key={question.key} className="sv-num" style={{ fontSize: 13 }}>
                    {row.answers[question.key] !== undefined ? bn(row.answers[question.key] as number) : '–'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol style={{ margin: '12px 16px 0', padding: 0, listStyle: 'none', fontSize: 12.5, lineHeight: 1.6, color: 'var(--sv-text-muted)' }}>
        {questions.map((question, q) => (
          <li key={question.key} style={{ display: 'inline' }}>
            <b style={{ color: 'var(--sv-text)' }}>{bn(q + 1)}</b> {questionLabel(question)}
            {q < questions.length - 1 ? ' · ' : ''}
          </li>
        ))}
      </ol>

      {noted.length > 0 && (
        <div className="sv-card" style={{ margin: '14px 16px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>নোট ({bn(noted.length)})</div>
          {noted.map((row) => (
            <div key={row.erpId} style={{ fontSize: 14, lineHeight: 1.55 }}>
              <b>
                {row.roll !== null ? `${bn(row.roll)} · ` : ''}
                {row.name}:
              </b>{' '}
              {row.note}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5 sv-no-print" style={{ padding: '18px 16px 0' }}>
        <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          এই পাতার লিংকটি সংরক্ষণ করুন। পরে রসিদ দেখতে বা সংশোধন করতে এটি লাগবে।
        </div>
        <PrintButton />
        <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', textAlign: 'center' }}>iPhone: শেয়ার বাটন → প্রিন্ট → PDF হিসেবে সংরক্ষণ</div>
        {canEdit && (
          <Link className="sv-secondary" href={editHref}>
            সংশোধন করুন ({dayMonth.format(round.closesAt)} পর্যন্ত)
          </Link>
        )}
        {canEdit && (
          <Link className="sv-secondary is-bronze-text" style={{ background: 'transparent' }} href={`${surveyBase}&step=class`}>
            আরেকটি ক্লাস / বিষয় রিভিউ করুন
          </Link>
        )}
      </div>
    </main>
  );
}
