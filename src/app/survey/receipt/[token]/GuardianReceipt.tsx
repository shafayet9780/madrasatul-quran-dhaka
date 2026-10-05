import Link from 'next/link';
import { formatDateTime } from '@/lib/survey/dates';
import { answerText } from '@/lib/survey/guardian-logic';
import { bn, questionLabel, referenceNumber } from '@/lib/survey/labels';
import { surveyAccess } from '@/lib/survey/round-status';
import { classifyAnswer, classLabel } from '@/lib/survey/snapshot';
import type { Receipt } from '@/lib/survey/t1';
import { PrintButton } from './PrintButton';

const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' });

/** Receipt for a guardian's G1/G2 form (G2-Receipt / G1-Receipt frames). */
export function GuardianReceipt({ receipt }: { receipt: Receipt }) {
  const { submission, round, rows, replacedBy, setAside } = receipt;
  const { template, classes } = round.snapshot;
  const row = rows[0];
  const answers = (row?.answers ?? {}) as Record<string, unknown>;
  const access = surveyAccess(round);
  const canCorrect = !replacedBy && !setAside && (access === 'open' || access === 'grace');
  const subjects = classes.find((c) => c.key === submission.classKey)?.subjects ?? [];


  return (
    <main className="sv-screen" style={{ paddingBottom: 32 }}>
      <div className="flex flex-col items-center gap-2.5 text-center" style={{ padding: '36px 20px 0' }}>
        <div aria-hidden="true" className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--sv-ok-bg)' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--sv-ok)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5 9-10" />
          </svg>
        </div>
        <h1 className="sv-head sv-h1">জমা হয়েছে</h1>
        <div style={{ fontSize: 15, color: 'var(--sv-text-muted)' }}>জাযাকাল্লাহু খাইরান</div>
      </div>

      {replacedBy && (
        <div className="sv-banner is-info sv-no-print" style={{ margin: '18px 16px 0' }}>
          <span>
            এই রিভিউ পরে সংশোধন করা হয়েছে। <Link href={`/survey/receipt/${replacedBy}`}>নতুন রসিদ দেখুন</Link>
          </span>
        </div>
      )}
      {setAside && (
        <div className="sv-banner is-info sv-no-print" style={{ margin: '18px 16px 0' }}>
          <span>এই শিক্ষার্থীর জন্য পরে আরেকটি রিভিউ জমা হয়েছে; সেটিই গণ্য হবে।</span>
        </div>
      )}

      <article className="flex flex-col gap-3" style={{ margin: '18px 16px 0', background: '#fff', border: '1px solid var(--sv-hairline)', borderRadius: 18, padding: '16px 18px' }}>
        <div className="flex flex-col" style={{ lineHeight: 1.45 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>মাদরাসাতুল কুরআন, ঢাকা</span>
          <span style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>
            {template.title} · {round.label}
          </span>
        </div>
        <dl className="grid" style={{ margin: 0, gridTemplateColumns: '96px minmax(0, 1fr)', rowGap: 8, columnGap: 8, fontSize: 14 }}>
          <dt className="sv-muted">শিক্ষার্থী</dt>
          <dd style={{ margin: 0, fontWeight: 600 }}>
            {row?.name} · {classLabel(round.snapshot, submission.classKey, submission.sectionKey)}
          </dd>
          <dt className="sv-muted">প্রদানকারী</dt>
          <dd style={{ margin: 0 }}>
            {submission.submitterName} ({submission.submitterRelation})
          </dd>
          <dt className="sv-muted">যাচাই</dt>
          <dd style={{ margin: 0, fontWeight: 600, color: submission.verified ? 'var(--sv-ok)' : 'var(--sv-warn)' }}>{submission.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত'}</dd>
          <dt className="sv-muted">রেফারেন্স নং</dt>
          <dd className="sv-num" style={{ margin: 0, letterSpacing: 0.5 }}>
            {referenceNumber(submission.id)}
          </dd>
          <dt className="sv-muted">জমার সময়</dt>
          <dd style={{ margin: 0 }}>{formatDateTime(submission.submittedAt!)}</dd>
        </dl>

        <div style={{ borderTop: '1px solid var(--sv-hairline)', paddingTop: 12, fontSize: 15, fontWeight: 600 }}>আপনার উত্তর</div>
        <ol className="flex flex-col gap-2.5" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {template.questions.map((question, q) => (
            <li key={question.key} className="flex gap-2.5" style={{ fontSize: 14, lineHeight: 1.5 }}>
              <span className="sv-num sv-muted" style={{ flex: 'none', width: 22 }}>
                {bn(q + 1)}
              </span>
              <span className="flex flex-col gap-1" style={{ minWidth: 0 }}>
                <span className="sv-muted">{template.kind === 'G1' ? questionLabel(question) : question.text}</span>
                {template.kind === 'G1' ? (
                  <span className="flex flex-wrap gap-1.5">
                    {subjects.map((subject) => {
                      const value = (answers[question.key] as Record<string, unknown> | undefined)?.[subject.key];
                      const answer = classifyAnswer(question, template.scale, value);
                      return (
                        <span key={subject.key} style={{ background: 'var(--sv-stone)', borderRadius: 8, padding: '1px 8px', fontSize: 13 }}>
                          {subject.name} <b className="sv-num">{answer.kind === 'mark' ? bn(answer.mark) : answer.kind === 'na' ? 'প্রযোজ্য নয়' : '–'}</b>
                        </span>
                      );
                    })}
                  </span>
                ) : (
                  <b style={{ fontWeight: 600 }}>{answerText(question, template.scale, answers[question.key]) ?? '–'}</b>
                )}
              </span>
            </li>
          ))}
        </ol>
        {submission.comment && (
          <div style={{ borderTop: '1px solid var(--sv-hairline)', paddingTop: 12, fontSize: 14, lineHeight: 1.6 }}>
            <div className="sv-muted">{template.commentLabel ?? 'মন্তব্য'}</div>
            <div>{submission.comment}</div>
          </div>
        )}
      </article>

      <div className="flex flex-col gap-2.5 sv-no-print" style={{ padding: '18px 16px 0' }}>
        <PrintButton />
        <Link className="sv-secondary" href={`/survey/${round.slug}?k=${encodeURIComponent(round.linkKey)}&step=class`}>
          অন্য সন্তানের জন্য রিভিউ দিন
        </Link>
        <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          এই পাতার লিংকটি সংরক্ষণ করুন · iPhone: শেয়ার → প্রিন্ট → PDF
          {canCorrect && (
            <>
              <br />
              সংশোধন করতে {dayMonth.format(round.closesAt)} পর্যন্ত একই লিংকে আবার রিভিউ দিন।
            </>
          )}
        </div>
      </div>
    </main>
  );
}
