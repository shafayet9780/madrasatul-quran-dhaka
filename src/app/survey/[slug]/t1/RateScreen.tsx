'use client';

import { useRef } from 'react';
import { Icon, MarkTrack, Progress, SaveChip, useIsDesktop, type SaveState } from '@/components/survey/ui';
import { batchLabel, bn } from '@/lib/survey/labels';
import type { BatchKeyInput, RosterStudent } from '@/lib/survey/t1-types';
import { DeskHeader, StatusBanners } from './Chrome';
import type { T1Config } from './types';

export function RateScreen({
  config,
  batchKey,
  students,
  answers,
  saveState,
  closed,
  q,
  onQuestion,
  onBackToClass,
  onReview,
  onMark,
}: {
  config: T1Config;
  batchKey: BatchKeyInput;
  students: RosterStudent[];
  answers: Record<string, Record<string, number>>;
  saveState: SaveState;
  closed: boolean;
  q: number;
  onQuestion: (q: number) => void;
  onBackToClass: () => void;
  onReview: () => void;
  onMark: (erpId: string, questionKey: string, mark: number) => void;
}) {
  const { questions, scale } = config.snapshot.template;
  const question = questions[q];
  const listRef = useRef<HTMLDivElement>(null);
  const desktop = useIsDesktop();
  const isDone = (i: number) => students.every((s) => scale.includes(answers[s.erpId]?.[questions[i].key]));
  const remaining = students.filter((s) => !scale.includes(answers[s.erpId]?.[question.key]));
  const last = q === questions.length - 1;
  const shortLabel = batchLabel(config.snapshot, batchKey, 'short');

  function jumpToRemaining() {
    const first = remaining[0];
    if (!first) return;
    const row = listRef.current?.querySelector<HTMLElement>(`[data-student="${CSS.escape(first.erpId)}"]`);
    row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    row?.querySelector<HTMLElement>('[role="radio"]')?.focus({ preventScroll: true });
  }

  const goBack = () => (q === 0 ? onBackToClass() : onQuestion(q - 1));
  const goNext = () => (last ? onReview() : onQuestion(q + 1));

  return (
    <div className="sv-frame">
      {/* One label element for every mark group, whichever header layout is showing. */}
      <span id="question-text" className="sv-visually-hidden">
        {question.text}
      </span>
      {desktop && <DeskHeader config={config} batchKey={batchKey} saveState={saveState} />}

      {!desktop && (
      <div className="sv-rate-head">
        <Progress total={questions.length} done={isDone} current={q} />
        <div className="flex items-center" style={{ padding: '6px 8px 0' }}>
          <button type="button" className="sv-icon-btn" aria-label={q === 0 ? 'ক্লাস বাছাইয়ে ফিরুন' : 'আগের প্রশ্ন'} onClick={goBack}>
            {Icon.back()}
          </button>
          <div className="flex flex-col text-center" style={{ flex: 1, lineHeight: 1.4 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{shortLabel}</span>
            <span aria-live="polite">
              <SaveChip state={saveState} />
            </span>
          </div>
          <div className="sv-icon-spacer" />
        </div>
        <QuestionBlock config={config} q={q} />
      </div>
      )}

      <div className="sv-frame-body">
        {desktop && (
        <aside className="sv-frame-aside">
          <nav aria-label="প্রশ্নসমূহ" className="sv-panel flex flex-col gap-0.5" style={{ padding: 10 }}>
            {questions.map((item, i) => (
              <button key={item.key} type="button" className="sv-step" aria-current={i === q ? 'step' : undefined} onClick={() => onQuestion(i)}>
                <span className={`sv-step-dot${isDone(i) ? ' is-done' : ''}`}>{isDone(i) ? '✓' : bn(i + 1)}</span>
                <span>{item.shortLabel ?? item.text}</span>
              </button>
            ))}
          </nav>
          <div className="sv-panel flex flex-col gap-2" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', fontWeight: 600 }}>মার্কিং</div>
            <div style={{ fontSize: 14 }}>১০ = সবচেয়ে ভালো · ৪ = সন্তোষজনক নয়</div>
          </div>
        </aside>
        )}

        <main className="sv-frame-main">
          {desktop && (
          <section
            className="sv-panel"
            style={{ position: 'sticky', top: 12, zIndex: 2, padding: '22px 24px', boxShadow: '0 4px 14px rgba(32,43,48,0.07)', borderRadius: 18 }}
          >
            <QuestionBlock config={config} q={q} desktop />
          </section>
          )}

          <StatusBanners saveState={saveState} closed={closed} />

          <div className="flex items-center justify-between gap-3" style={{ padding: '14px 24px 6px' }}>
            <span style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>{bn(students.length)} জন · রোল অনুযায়ী</span>
            {remaining.length > 0 ? (
              <button type="button" className="sv-pill" aria-label={`${bn(remaining.length)} জন বাকি, প্রথম বাকি শিক্ষার্থীর কাছে যান`} onClick={jumpToRemaining}>
                {bn(remaining.length)} জন বাকি {Icon.down()}
              </button>
            ) : (
              <span className="sv-chip is-ok">{Icon.check()} সবাই পূর্ণ</span>
            )}
          </div>

          <div ref={listRef} className="sv-student-list" style={{ padding: '0 12px', ['--sv-rows' as string]: Math.ceil(students.length / 2) }}>
            {students.map((student) => {
              const value = answers[student.erpId]?.[question.key];
              const nameId = `st-${student.erpId}`;
              return (
                <div key={student.erpId} className="sv-student-row" data-student={student.erpId}>
                  <div className={`sv-roll${scale.includes(value) ? ' is-done' : ''}`} aria-hidden="true">
                    {student.roll !== null ? bn(student.roll) : '–'}
                  </div>
                  <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
                    <span id={nameId} className="sv-student-name">
                      {student.name}
                    </span>
                    {student.roll === null && <span className="sv-student-id">আইডি {bn(student.erpId)}</span>}
                  </div>
                  <MarkTrack marks={scale} value={value} labelledBy={`${nameId} question-text`} onChange={(mark) => onMark(student.erpId, question.key, mark)} />
                </div>
              );
            })}
          </div>

          {desktop && (
          <div style={{ paddingTop: 8 }}>
            <div className="flex flex-wrap justify-between gap-3">
              <button type="button" className="sv-secondary" style={{ width: 'auto', minHeight: 50 }} onClick={goBack}>
                ← {q === 0 ? 'ক্লাস বাছাই' : 'আগের প্রশ্ন'}
              </button>
              <button type="button" className="sv-cta" style={{ width: 'auto', minHeight: 50 }} onClick={goNext}>
                {last ? 'দেখে নিয়ে জমা দিন' : 'পরের প্রশ্ন'} →
              </button>
            </div>
          </div>
          )}
        </main>
      </div>

      {!desktop && (
      <div className="sv-footer" style={{ background: 'rgba(252,251,248,0.94)' }}>
        <div className="sv-rate-nav">
          <button type="button" className="sv-square" aria-label={q === 0 ? 'ক্লাস বাছাইয়ে ফিরুন' : 'আগের প্রশ্ন'} onClick={goBack}>
            {Icon.back()}
          </button>
          <button type="button" className="sv-cta" onClick={goNext}>
            {last ? 'দেখে নিয়ে জমা দিন' : 'পরের প্রশ্ন'} {Icon.next()}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

function QuestionBlock({ config, q, desktop }: { config: T1Config; q: number; desktop?: boolean }) {
  const { questions } = config.snapshot.template;
  const question = questions[q];
  return (
    <div className="flex flex-col gap-2" style={desktop ? { gap: 10 } : { padding: '10px 24px 14px' }}>
      <div style={{ fontSize: desktop ? 14 : 13.5, fontWeight: 600, color: desktop ? 'var(--sv-text-muted)' : 'var(--sv-bronze)' }}>
        প্রশ্ন {bn(q + 1)} / {bn(questions.length)}
      </div>
      <h1 className="sv-head sv-question" style={desktop ? { fontSize: 28, lineHeight: 1.35 } : undefined}>
        {question.text}
      </h1>
      {question.hint && (
        <div className="sv-hint">
          {Icon.reverse()}
          {question.hint}
        </div>
      )}
    </div>
  );
}
