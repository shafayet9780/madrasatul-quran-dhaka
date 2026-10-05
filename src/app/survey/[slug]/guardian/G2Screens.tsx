'use client';

import { useState } from 'react';
import { Icon, Topbar, useIsDesktop } from '@/components/survey/ui';
import { bn } from '@/lib/survey/labels';
import { classifyAnswer, NA, type SnapshotQuestion } from '@/lib/survey/snapshot';
import { ChoiceGroup, GuardianDeskHeader, Segments, type Choice } from './GuardianChrome';
import type { GuardianConfig } from './types';

const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' });

export type Answers = Record<string, unknown>;
export type SubmitError = 'closed' | 'network' | 'failed' | 'incomplete';

/** Who and for which child, as the question screens show it. */
export type Heading = { child: string; submitter: string; verified: boolean | null };

function choicesFor(question: SnapshotQuestion): Choice[] {
  const choices: Choice[] = question.options.map((o) => ({ value: o.key, label: o.label }));
  if (question.allowNA) choices.push({ value: NA, label: question.naLabel ?? 'প্রযোজ্য নয়', caption: 'স্কোরে গণনা হবে না', na: true });
  return choices;
}

/** The answer as the guardian chose it, for review lists; null when unanswered. */
export function answerText(question: SnapshotQuestion, scale: number[], value: unknown): string | null {
  const answer = classifyAnswer(question, scale, value);
  if (answer.kind === 'invalid') return null;
  if (answer.kind === 'na') return question.naLabel ?? 'প্রযোজ্য নয়';
  return question.type === 'options' ? (question.options.find((o) => o.key === value)?.label ?? null) : bn(answer.mark);
}

export function G2QuestionScreen({
  config,
  heading,
  q,
  answers,
  onAnswer,
  onQuestion,
  onBack,
  onReview,
}: {
  config: GuardianConfig;
  heading: Heading;
  q: number;
  answers: Answers;
  onAnswer: (questionKey: string, value: string) => void;
  onQuestion: (q: number) => void;
  onBack: () => void;
  onReview: () => void;
}) {
  const desktop = useIsDesktop();
  const { questions, scale } = config.snapshot.template;
  const question = questions[q];
  const answered = (i: number) => answerText(questions[i], scale, answers[questions[i].key]) !== null;
  const last = q === questions.length - 1;
  const goBack = () => (q === 0 ? onBack() : onQuestion(q - 1));
  const goNext = () => (last ? onReview() : onQuestion(q + 1));
  const value = answers[question.key];

  const title = (
    <>
      <h1 id="g2-question" className="sv-head" style={{ margin: 0, fontSize: desktop ? 28 : 24, lineHeight: 1.4 }}>
        {question.text}
      </h1>
      {question.hint && <div style={{ fontSize: 14.5, color: 'var(--sv-text-muted)' }}>{question.hint}</div>}
    </>
  );
  const choices = <ChoiceGroup choices={choicesFor(question)} value={typeof value === 'string' ? value : undefined} onChange={(v) => onAnswer(question.key, v)} labelledBy="g2-question" />;

  if (desktop) {
    return (
      <div className="sv-frame">
        <GuardianDeskHeader config={config} child={heading.child} submitter={heading.submitter} verified={heading.verified} />
        <div className="sv-frame-body">
          <aside className="sv-frame-aside">
            <nav aria-label="প্রশ্নসমূহ" className="sv-panel flex flex-col gap-0.5" style={{ padding: 10 }}>
              <div className="flex justify-between" style={{ padding: '6px 10px 8px', fontSize: 13, color: 'var(--sv-text-muted)' }}>
                <span style={{ fontWeight: 600 }}>{bn(questions.length)}টি প্রশ্ন</span>
                <span>{bn(questions.filter((_, i) => answered(i)).length)}টি সম্পন্ন</span>
              </div>
              {questions.map((item, i) => (
                <button key={item.key} type="button" className="sv-step" aria-current={i === q ? 'step' : undefined} onClick={() => onQuestion(i)}>
                  <span className={`sv-step-dot${answered(i) ? ' is-done' : ''}`}>{answered(i) ? '✓' : bn(i + 1)}</span>
                  <span className="flex flex-col" style={{ lineHeight: 1.4 }}>
                    <span>{item.shortLabel ?? item.text}</span>
                    {answered(i) && <span style={{ fontSize: 12.5, color: 'var(--sv-text-muted)' }}>{answerText(item, scale, answers[item.key])}</span>}
                  </span>
                </button>
              ))}
            </nav>
          </aside>
          <main className="sv-frame-main">
            <section className="sv-panel flex flex-col gap-2.5" style={{ padding: '22px 24px', borderRadius: 18 }}>
              <div style={{ fontSize: 14, color: 'var(--sv-text-muted)', fontWeight: 600 }}>
                প্রশ্ন {bn(q + 1)}/{bn(questions.length)}
              </div>
              {title}
            </section>
            <div style={{ maxWidth: 640 }}>{choices}</div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" className="sv-secondary" style={{ width: 'auto', padding: '0 22px' }} onClick={goBack}>
                ← {q === 0 ? 'আগের ধাপ' : 'আগের প্রশ্ন'}
              </button>
              <button type="button" className="sv-cta" style={{ width: 'auto', padding: '0 24px' }} onClick={goNext}>
                {last ? 'দেখে নিয়ে জমা দিন' : 'পরের প্রশ্ন'} {Icon.next()}
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <main className="sv-screen">
      <div className="flex flex-col gap-3" style={{ position: 'sticky', top: 0, zIndex: 2, background: '#fff', borderBottom: '1px solid var(--sv-hairline)', padding: '14px 16px 18px' }}>
        <div className="flex items-center justify-between gap-2">
          <span style={{ fontSize: 15, fontWeight: 600 }}>{heading.child}</span>
          <span style={{ fontSize: 13, color: 'var(--sv-text-muted)', whiteSpace: 'nowrap' }}>
            প্রশ্ন {bn(q + 1)}/{bn(questions.length)}
          </span>
        </div>
        <Segments total={questions.length} done={answered} current={q} />
        {title}
      </div>
      <div style={{ padding: '18px 16px 12px' }}>{choices}</div>
      <div style={{ padding: '0 20px', fontSize: 13, color: 'var(--sv-ok)', fontWeight: 600 }}>এই ফোনে সংরক্ষিত</div>
      <div className="sv-footer" style={{ display: 'grid', gridTemplateColumns: '116px minmax(0, 1fr)', gap: 10 }}>
        <button type="button" className="sv-secondary" onClick={goBack}>
          আগের
        </button>
        <button type="button" className="sv-cta" onClick={goNext}>
          {last ? 'দেখে নিয়ে জমা দিন' : 'পরের প্রশ্ন'}
        </button>
      </div>
    </main>
  );
}

const SUBMIT_ERRORS: Record<SubmitError, string> = {
  closed: 'এই রিভিউ এখন বন্ধ, তাই জমা দেওয়া যায়নি।',
  network: 'ইন্টারনেট সংযোগ নেই। আপনার উত্তর এই ফোনে রাখা আছে; সংযোগ ফিরলে আবার জমা দিন।',
  failed: 'জমা দেওয়া যায়নি। আবার চেষ্টা করুন।',
  incomplete: 'কিছু প্রশ্নের উত্তর বাকি আছে।',
};

export function G2ReviewScreen({
  config,
  heading,
  answers,
  comment,
  onComment,
  onEdit,
  onBack,
  onSubmit,
}: {
  config: GuardianConfig;
  heading: Heading;
  answers: Answers;
  comment: string;
  onComment: (comment: string) => void;
  onEdit: (q: number) => void;
  onBack: () => void;
  onSubmit: () => Promise<SubmitError | null>;
}) {
  const { questions, scale, commentLabel } = config.snapshot.template;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);
  const missing = questions.filter((question) => answerText(question, scale, answers[question.key]) === null);

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await onSubmit();
    // On success the page moves to the receipt; keep the button busy until then.
    if (result) {
      setError(result);
      setBusy(false);
    }
  }

  return (
    <main className="sv-screen">
      <Topbar label="শেষ ধাপ · দেখে নিয়ে জমা" onBack={onBack} backLabel="প্রশ্নে ফিরুন" />
      <div className="flex flex-col gap-1.5" style={{ padding: '6px 20px 0' }}>
        <h1 className="sv-head sv-h1">দেখে নিয়ে জমা দিন</h1>
        <div style={{ fontSize: 15, color: 'var(--sv-text-muted)' }}>
          {heading.child} · {bn(questions.length)}টি প্রশ্ন
        </div>
      </div>
      <ol className="flex flex-col gap-2" style={{ margin: '14px 12px 0', padding: 0, listStyle: 'none' }}>
        {questions.map((question, q) => {
          const text = answerText(question, scale, answers[question.key]);
          return (
            <li key={question.key} className="flex items-start gap-2.5" style={{ background: '#fff', border: `1px solid ${text ? 'var(--sv-hairline)' : 'var(--sv-tint-border)'}`, borderRadius: 14, padding: '10px 12px 10px 14px' }}>
              <span className="sv-num sv-muted" style={{ flex: 'none', width: 20, paddingTop: 1 }}>
                {bn(q + 1)}
              </span>
              <span className="flex flex-col gap-0.5" style={{ flex: 1, minWidth: 0, lineHeight: 1.45 }}>
                <span style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>{question.text}</span>
                <span style={{ fontSize: 15.5, fontWeight: 600, color: text ? 'var(--sv-text)' : 'var(--sv-warn)' }}>{text ?? 'উত্তর দেওয়া হয়নি'}</span>
              </span>
              <button type="button" className="sv-tertiary" style={{ padding: '10px 4px', fontSize: 14 }} aria-label={`প্রশ্ন ${bn(q + 1)} বদলান`} onClick={() => onEdit(q)}>
                বদলান
              </button>
            </li>
          );
        })}
      </ol>
      {commentLabel && (
        <div className="flex flex-col gap-2" style={{ padding: '20px 16px 0' }}>
          <label htmlFor="g-comment" style={{ fontSize: 16, fontWeight: 600 }}>
            {commentLabel} <span style={{ fontWeight: 400, color: 'var(--sv-text-muted)' }}>(ঐচ্ছিক)</span>
          </label>
          <textarea id="g-comment" className="sv-textarea" rows={3} maxLength={2000} placeholder="এখানে লিখুন" value={comment} onChange={(e) => onComment(e.target.value)} />
        </div>
      )}
      <div className="sv-footer">
        <div aria-live="polite">
          {error && (
            <p role="alert" style={{ margin: '0 0 4px', fontSize: 14.5, lineHeight: 1.55, color: 'var(--sv-warn)' }}>
              {SUBMIT_ERRORS[error]}
            </p>
          )}
          {!error && missing.length > 0 && (
            <p style={{ margin: '0 0 4px', fontSize: 14.5, color: 'var(--sv-warn)' }}>{bn(missing.length)}টি প্রশ্নের উত্তর বাকি। উত্তর দিলে জমা দিতে পারবেন।</p>
          )}
        </div>
        <button type="button" className="sv-cta" disabled={missing.length > 0 || busy} aria-busy={busy || undefined} onClick={() => void submit()}>
          {busy ? 'জমা হচ্ছে…' : 'জমা দিন'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--sv-text-muted)' }}>{dayMonth.format(new Date(config.closesAt))} পর্যন্ত সংশোধন করা যাবে</div>
      </div>
    </main>
  );
}
