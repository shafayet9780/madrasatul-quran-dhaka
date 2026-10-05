'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon, MarkTrack, Topbar, useIsDesktop } from '@/components/survey/ui';
import { bn, questionLabel } from '@/lib/survey/labels';
import type { SnapshotQuestion } from '@/lib/survey/snapshot';
import type { Answers, Heading, SubmitError } from './G2Screens';
import { GuardianDeskHeader, Segments } from './GuardianChrome';
import type { GuardianConfig } from './types';

const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' });

type Subject = { key: string; name: string };
export type G1Layout = 'by-subject' | 'by-question';

/** The mark given for a question and subject, if it is one of the scale's marks. */
export function markOf(answers: Answers, scale: number[], questionKey: string, subjectKey: string): number | undefined {
  const value = (answers[questionKey] as Record<string, unknown> | undefined)?.[subjectKey];
  return typeof value === 'number' && scale.includes(value) ? value : undefined;
}

/** One screen per subject (default) or per question; `index` counts screens in that order. */
export function g1ScreenCount(layout: G1Layout, questions: SnapshotQuestion[], subjects: Subject[]): number {
  return layout === 'by-subject' ? subjects.length : questions.length;
}

function useFocusOnChange(index: number) {
  const ref = useRef<HTMLHeadingElement>(null);
  const shown = useRef(index);
  useEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    ref.current?.focus();
  }, [index]);
  return ref;
}

export function G1RateScreen({
  config,
  heading,
  layout,
  subjects,
  index,
  answers,
  onMark,
  onIndex,
  onBack,
  onReview,
}: {
  config: GuardianConfig;
  heading: Heading;
  layout: G1Layout;
  subjects: Subject[];
  index: number;
  answers: Answers;
  onMark: (questionKey: string, subjectKey: string, mark: number) => void;
  onIndex: (index: number) => void;
  onBack: () => void;
  onReview: () => void;
}) {
  const desktop = useIsDesktop();
  const { questions, scale } = config.snapshot.template;
  const bySubject = layout === 'by-subject';
  const count = g1ScreenCount(layout, questions, subjects);
  const titleRef = useFocusOnChange(index);
  const mark = (q: SnapshotQuestion, s: Subject) => markOf(answers, scale, q.key, s.key);
  // The rows on this screen: questions of one subject, or subjects of one question.
  const rows = bySubject
    ? questions.map((q) => ({ key: q.key, label: `${bn(questions.indexOf(q) + 1)}. ${q.text}`, hint: q.hint, question: q, subject: subjects[index] }))
    : subjects.map((s) => ({ key: s.key, label: s.name, hint: undefined, question: questions[index], subject: s }));
  const screenDone = (i: number) =>
    bySubject ? questions.every((q) => mark(q, subjects[i]) !== undefined) : subjects.every((s) => mark(questions[i], s) !== undefined);
  const left = rows.filter((r) => mark(r.question, r.subject) === undefined).length;
  const last = index === count - 1;
  const goBack = () => (index === 0 ? onBack() : onIndex(index - 1));
  const goNext = () => (last ? onReview() : onIndex(index + 1));
  const place = bySubject ? `বিষয় ${bn(index + 1)}/${bn(count)}` : `প্রশ্ন ${bn(index + 1)}/${bn(count)}`;
  const title = bySubject ? subjects[index].name : questions[index].text;
  const nextLabel = last ? 'দেখে নিয়ে জমা দিন' : bySubject ? (left ? `পরের বিষয় (${bn(left)}টি বাকি)` : 'পরের বিষয়') : left ? `পরের প্রশ্ন (${bn(left)}টি বাকি)` : 'পরের প্রশ্ন';
  const titleHint = !bySubject ? questions[index].hint : undefined;

  const rowsList = rows.map((row) => {
    const value = mark(row.question, row.subject);
    const labelId = `g1-row-${row.key}`;
    return (
      <div key={row.key} className="flex flex-col gap-2.5" style={{ background: '#fff', border: `1px solid ${value === undefined ? 'var(--sv-tint-border)' : 'var(--sv-hairline)'}`, borderRadius: 16, padding: '12px 12px 12px 14px' }}>
        <div className="flex items-start gap-2.5">
          <div id={labelId} style={{ flex: 1, fontSize: bySubject ? 16.5 : 17, fontWeight: 600, lineHeight: 1.5 }}>
            {row.label}
          </div>
          {value !== undefined && <span style={{ flex: 'none', marginTop: 3, color: 'var(--sv-ok)' }} aria-label="সম্পন্ন">{Icon.check({ size: 18 })}</span>}
        </div>
        {row.hint && <div className="sv-hint">{row.hint}</div>}
        <MarkTrack large marks={scale} value={value} labelledBy={`g1-title ${labelId}`} onChange={(m) => onMark(row.question.key, row.subject.key, m)} />
      </div>
    );
  });

  if (desktop) {
    const steps = bySubject ? subjects.map((s) => s.name) : questions.map((q) => q.shortLabel ?? q.text);
    return (
      <div className="sv-frame">
        <GuardianDeskHeader config={config} child={heading.child} submitter={heading.submitter} verified={heading.verified} />
        <div className="sv-frame-body">
          <aside className="sv-frame-aside">
            <nav aria-label={bySubject ? 'বিষয়সমূহ' : 'প্রশ্নসমূহ'} className="sv-panel flex flex-col gap-0.5" style={{ padding: 10 }}>
              {steps.map((label, i) => (
                <button key={label + i} type="button" className="sv-step" aria-current={i === index ? 'step' : undefined} onClick={() => onIndex(i)}>
                  <span className={`sv-step-dot${screenDone(i) ? ' is-done' : ''}`}>{screenDone(i) ? '✓' : bn(i + 1)}</span>
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <div className="sv-panel flex flex-col gap-2" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', fontWeight: 600 }}>মার্কিং</div>
              <div style={{ fontSize: 14 }}>১০ = সবচেয়ে ভালো · ৪ = সন্তোষজনক নয়</div>
            </div>
          </aside>
          <main className="sv-frame-main">
            <section className="sv-panel flex flex-col gap-2" style={{ padding: '20px 24px', borderRadius: 18 }}>
              <div style={{ fontSize: 14, color: 'var(--sv-text-muted)', fontWeight: 600 }}>{place}</div>
              <h1 ref={titleRef} tabIndex={-1} id="g1-title" className="sv-head" style={{ margin: 0, fontSize: 28, lineHeight: 1.35, outline: 'none' }}>
                {title}
              </h1>
              {titleHint && <div className="sv-hint">{titleHint}</div>}
            </section>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
              {rowsList}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" className="sv-secondary" style={{ width: 'auto', padding: '0 22px' }} onClick={goBack}>
                ← {index === 0 ? 'আগের ধাপ' : bySubject ? 'আগের বিষয়' : 'আগের প্রশ্ন'}
              </button>
              <button type="button" className="sv-cta" style={{ width: 'auto', padding: '0 24px' }} onClick={goNext}>
                {nextLabel} {Icon.next()}
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <main className="sv-screen">
      <div style={{ position: 'sticky', top: 0, zIndex: 2, background: '#fff', borderBottom: '1px solid var(--sv-hairline)', boxShadow: '0 2px 8px rgba(32,43,48,0.06)' }}>
        <Segments total={count} done={screenDone} current={index} />
        <div className="flex flex-col gap-1" style={{ padding: '12px 20px 14px' }}>
          <div className="flex items-center justify-between gap-2">
            <span style={{ fontSize: 14, fontWeight: 600 }}>{heading.child}</span>
            <span style={{ fontSize: 13, color: 'var(--sv-text-muted)', whiteSpace: 'nowrap' }}>{place}</span>
          </div>
          <h1 ref={titleRef} tabIndex={-1} id="g1-title" className="sv-head" style={{ margin: 0, fontSize: bySubject ? 28 : 22, lineHeight: 1.4, outline: 'none' }}>
            {title}
          </h1>
          {titleHint && <div className="sv-hint">{titleHint}</div>}
          <div className="flex items-center justify-between gap-2" style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>
            <span>
              {bn(rows.length)}টি {bySubject ? 'প্রশ্ন' : 'বিষয়'} · {bn(rows.length - left)}টি সম্পন্ন
            </span>
            <span style={{ color: 'var(--sv-ok)', fontWeight: 600 }}>এই ফোনে সংরক্ষিত</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5" style={{ padding: '14px 12px 12px' }}>
        {rowsList}
      </div>
      <div className="sv-footer" style={{ display: 'grid', gridTemplateColumns: '116px minmax(0, 1fr)', gap: 10 }}>
        <button type="button" className="sv-secondary" onClick={goBack}>
          আগের
        </button>
        <button type="button" className="sv-cta" onClick={goNext}>
          {nextLabel}
        </button>
      </div>
    </main>
  );
}

const SUBMIT_ERRORS: Record<SubmitError, string> = {
  closed: 'এই রিভিউ এখন বন্ধ, তাই জমা দেওয়া যায়নি।',
  network: 'ইন্টারনেট সংযোগ নেই। আপনার উত্তর এই ফোনে রাখা আছে; সংযোগ ফিরলে আবার জমা দিন।',
  failed: 'জমা দেওয়া যায়নি। আবার চেষ্টা করুন।',
  incomplete: 'কিছু মার্ক বাকি আছে।',
  'rate-limited': 'এই মুহূর্তে অনেক রিভিউ জমা হচ্ছে। কয়েক মিনিট পরে আবার জমা দিন; আপনার উত্তর এই ফোনে রাখা আছে।',
};

export function G1ReviewScreen({
  config,
  heading,
  layout,
  subjects,
  answers,
  comment,
  onComment,
  onEdit,
  onBack,
  onSubmit,
}: {
  config: GuardianConfig;
  heading: Heading;
  layout: G1Layout;
  subjects: Subject[];
  answers: Answers;
  comment: string;
  onComment: (comment: string) => void;
  onEdit: (index: number) => void;
  onBack: () => void;
  onSubmit: () => Promise<SubmitError | null>;
}) {
  const { questions, scale, commentLabel } = config.snapshot.template;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);
  const bySubject = layout === 'by-subject';
  const missing = questions.reduce((n, q) => n + subjects.filter((s) => markOf(answers, scale, q.key, s.key) === undefined).length, 0);

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await onSubmit();
    if (result) {
      setError(result);
      setBusy(false);
    }
  }

  // Grouped the way the guardian answered: per subject (with the question numbers) or per question.
  const groups = bySubject
    ? subjects.map((s, i) => ({ key: s.key, index: i, title: s.name, cells: questions.map((q, qi) => ({ key: q.key, label: bn(qi + 1), mark: markOf(answers, scale, q.key, s.key) })) }))
    : questions.map((q, i) => ({ key: q.key, index: i, title: `${bn(i + 1)}. ${q.text}`, cells: subjects.map((s) => ({ key: s.key, label: s.name, mark: markOf(answers, scale, q.key, s.key) })) }));

  return (
    <main className="sv-screen">
      <Topbar label="শেষ ধাপ" onBack={onBack} />
      <div className="flex flex-col gap-1.5" style={{ padding: '6px 20px 0' }}>
        <h1 className="sv-head sv-h1">দেখে নিয়ে জমা দিন</h1>
        <div style={{ fontSize: 15, color: 'var(--sv-text-muted)' }}>
          {heading.child} · {bn(subjects.length)}টি বিষয় × {bn(questions.length)}টি প্রশ্ন
        </div>
      </div>
      <div className="flex flex-col gap-2" style={{ margin: '14px 12px 0' }}>
        {groups.map((group) => {
          const marks = group.cells.map((c) => c.mark).filter((m): m is number => m !== undefined);
          const average = marks.length ? marks.reduce((a, b) => a + b, 0) / marks.length : null;
          return (
            <section key={group.key} className="flex flex-col gap-2" style={{ background: '#fff', border: `1px solid ${marks.length < group.cells.length ? 'var(--sv-tint-border)' : 'var(--sv-hairline)'}`, borderRadius: 14, padding: '10px 12px 12px 14px' }}>
              <div className="flex items-center gap-2">
                <h2 style={{ flex: 1, margin: 0, fontSize: bySubject ? 16.5 : 14.5, fontWeight: 600, lineHeight: 1.45 }}>
                  {group.title}
                  {bySubject && average !== null && <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, color: 'var(--sv-text-muted)' }}>গড় {bn(average.toFixed(1))}</span>}
                </h2>
                <button type="button" className="sv-tertiary" style={{ padding: '10px 4px', fontSize: 14 }} aria-label={`${bySubject ? group.title : `প্রশ্ন ${bn(group.index + 1)}`} বদলান`} onClick={() => onEdit(group.index)}>
                  বদলান
                </button>
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: bySubject ? 'repeat(5, minmax(0, 1fr))' : 'repeat(auto-fill, minmax(110px, 1fr))' }}>
                {group.cells.map((cell) => (
                  <div key={cell.key} className="flex items-baseline justify-between gap-1" style={{ background: 'var(--sv-paper)', borderRadius: 8, padding: '4px 8px', fontSize: 12.5 }}>
                    <span className="sv-muted">{cell.label}</span>
                    <b className="sv-num" style={{ fontSize: 14.5, color: cell.mark === undefined ? 'var(--sv-warn)' : cell.mark === 4 ? 'var(--sv-warn)' : 'var(--sv-text)' }}>
                      {cell.mark === undefined ? '–' : bn(cell.mark)}
                    </b>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
        {bySubject && (
          <p style={{ margin: 0, padding: '2px 4px', fontSize: 13, lineHeight: 1.55, color: 'var(--sv-text-muted)' }}>
            প্রশ্নের ক্রম: {questions.map((q, i) => `${bn(i + 1)} ${questionLabel(q)}`).join(' · ')}
          </p>
        )}
      </div>
      {commentLabel && (
        <div className="flex flex-col gap-2" style={{ padding: '20px 16px 0' }}>
          <label htmlFor="g-comment" style={{ fontSize: 16, fontWeight: 600 }}>
            {commentLabel} <span style={{ fontWeight: 400, color: 'var(--sv-text-muted)' }}>(ঐচ্ছিক)</span>
          </label>
          <textarea id="g-comment" className="sv-textarea" rows={4} maxLength={2000} placeholder="এখানে লিখুন" value={comment} onChange={(e) => onComment(e.target.value)} />
        </div>
      )}
      <div className="sv-footer">
        <div aria-live="polite">
          {error && <p style={{ margin: '0 0 4px', fontSize: 14.5, lineHeight: 1.55, color: 'var(--sv-warn)' }}>{SUBMIT_ERRORS[error]}</p>}
          {!error && missing > 0 && <p style={{ margin: '0 0 4px', fontSize: 14.5, color: 'var(--sv-warn)' }}>{bn(missing)}টি মার্ক বাকি। সব দিলে জমা দিতে পারবেন।</p>}
        </div>
        <button type="button" className="sv-cta" disabled={missing > 0 || busy} aria-busy={busy || undefined} onClick={() => void submit()}>
          {busy ? 'জমা হচ্ছে…' : 'জমা দিন'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--sv-text-muted)' }}>{dayMonth.format(new Date(config.closesAt))} পর্যন্ত সংশোধন করা যাবে</div>
      </div>
    </main>
  );
}
