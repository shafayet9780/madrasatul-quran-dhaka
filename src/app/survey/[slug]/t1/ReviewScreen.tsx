'use client';

import { useEffect, useId, useState } from 'react';
import { Icon, MarkTrack, Sheet, Topbar, useIsDesktop, type SaveState } from '@/components/survey/ui';
import { formatDateTime } from '@/lib/survey/dates';
import { batchLabel, bn, questionLabel } from '@/lib/survey/labels';
import { NOTE_MAX, type BatchKeyInput, type DuplicateBatch, type RosterStudent, type SubmitResult } from '@/lib/survey/t1-types';
import { DeskHeader, StatusBanners } from './Chrome';
import type { T1Config } from './types';

export type SubmitOutcome = SubmitResult | { ok: false; reason: 'network' };

const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' });

function ago(iso: string, now: number) {
  const minutes = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60000));
  return minutes < 60 ? `${bn(minutes)} মিনিট আগে` : formatDateTime(new Date(iso));
}

/** Minutes of the 10-minute grace left, or null outside it. Re-evaluated every 15 s. */
function useGraceMinutes(closesAt: string, graceMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  const closes = new Date(closesAt).getTime();
  if (now < closes || now >= closes + graceMs) return null;
  return Math.max(1, Math.ceil((closes + graceMs - now) / 60000));
}

export function ReviewScreen({
  config,
  batchKey,
  students,
  answers,
  notes,
  saveState,
  closed,
  onBack,
  onGoTo,
  onMark,
  onNote,
  onSubmit,
}: {
  config: T1Config;
  batchKey: BatchKeyInput;
  students: RosterStudent[];
  answers: Record<string, Record<string, number>>;
  notes: Record<string, string>;
  saveState: SaveState;
  closed: boolean;
  onBack: () => void;
  onGoTo: (q: number) => void;
  onMark: (erpId: string, questionKey: string, mark: number) => void;
  onNote: (erpId: string, note: string) => void;
  onSubmit: (acknowledged: string[]) => Promise<SubmitOutcome>;
}) {
  const { questions, scale } = config.snapshot.template;
  const [editing, setEditing] = useState<{ erpId: string; q: number } | null>(null);
  const [noting, setNoting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<'network' | 'closed' | 'conflict' | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateBatch[] | null>(null);
  const graceMinutes = useGraceMinutes(config.closesAt, config.graceMs);
  const desktop = useIsDesktop();

  const missing = questions
    .map((question, q) => ({ q, question, students: students.filter((s) => !scale.includes(answers[s.erpId]?.[question.key])) }))
    .filter((m) => m.students.length);
  const missingCount = missing.reduce((sum, m) => sum + m.students.length, 0);
  const noteCount = students.filter((s) => notes[s.erpId]).length;
  const longLabel = batchLabel(config.snapshot, batchKey);
  const editUntil = dayMonth.format(new Date(config.closesAt));

  async function submit(acknowledged: string[] = []) {
    if (submitting) return;
    setSubmitting(true);
    setFailure(null);
    const result = await onSubmit(acknowledged);
    setSubmitting(false);
    if (result.ok) return;
    if (result.reason === 'duplicate') setDuplicates(result.duplicates);
    else if (result.reason === 'closed') setFailure('closed');
    else if (result.reason === 'network' || result.reason === 'conflict') setFailure(result.reason);
  }

  const submitButton = (
    <button
      type="button"
      className="sv-cta"
      disabled={submitting || closed || failure === 'closed'}
      aria-busy={submitting || undefined}
      onClick={() => void submit()}
    >
      {submitting ? (
        <>
          {Icon.spinner({ size: 20 })} জমা হচ্ছে…
        </>
      ) : failure === 'network' || failure === 'conflict' ? (
        'আবার চেষ্টা করুন'
      ) : (
        'জমা দিন'
      )}
    </button>
  );

  const notices = (
    <>
      {graceMinutes !== null && !closed && failure !== 'closed' && (
        <div className="sv-banner is-info" role="status">
          {Icon.clock({ size: 20 })}
          <span>সময় শেষ, তবে আরও {bn(graceMinutes)} মিনিট জমা দেওয়া যাবে</span>
        </div>
      )}
      {(failure === 'network' || failure === 'conflict') && (
        <div role="alert" className="sv-card is-attention">
          <div style={{ fontSize: 16, fontWeight: 600 }}>জমা হয়নি, নেটওয়ার্কে সমস্যা</div>
          <div style={{ fontSize: 14.5, color: 'var(--sv-text-muted)', lineHeight: 1.55 }}>আপনার সব উত্তর সংরক্ষিত আছে। সংযোগ ঠিক হলে আবার চেষ্টা করুন।</div>
        </div>
      )}
      {failure === 'closed' && (
        <div role="alert" className="sv-card">
          <div style={{ fontSize: 15, fontWeight: 600 }}>এই রাউন্ড বন্ধ হয়ে গেছে</div>
          <div style={{ fontSize: 14.5, color: 'var(--sv-text-muted)', lineHeight: 1.55 }}>
            আপনার খসড়া সংরক্ষিত আছে। অ্যাডমিন সময় বাড়ালে এই লিংক থেকেই জমা দিতে পারবেন।
          </div>
        </div>
      )}
    </>
  );

  const sheets = (
    <>
      {editing && (
        <EditMarkSheet
          config={config}
          students={students}
          answers={answers}
          editing={editing}
          onMove={setEditing}
          onMark={onMark}
          onClose={() => setEditing(null)}
        />
      )}
      {noting && (
        <NoteSheet
          config={config}
          student={students.find((s) => s.erpId === noting)!}
          answers={answers[noting] ?? {}}
          note={notes[noting] ?? ''}
          onSave={(text) => {
            onNote(noting, text);
            setNoting(null);
          }}
          onClose={() => setNoting(null)}
        />
      )}
      {duplicates && (
        <DuplicateAtSubmitSheet
          label={batchLabel(config.snapshot, batchKey, 'short')}
          duplicates={duplicates}
          onKeepDraft={() => setDuplicates(null)}
          onSubmitAnyway={() => {
            const ids = duplicates.map((d) => d.submissionId);
            setDuplicates(null);
            void submit(ids);
          }}
        />
      )}
    </>
  );

  if (missing.length) {
    return (
      <div className="sv-frame">
        {desktop && <DeskHeader config={config} batchKey={batchKey} saveState={saveState} />}
        <main className="sv-screen" style={{ minHeight: 0, flex: 1, width: '100%' }}>
          <Topbar label="শেষ ধাপ · দেখে নিয়ে জমা" onBack={onBack} backLabel="প্রশ্নে ফিরুন" />
          <div className="flex flex-col gap-2" style={{ padding: '6px 20px 0' }}>
            <h1 className="sv-head sv-h1" style={{ lineHeight: 1.4 }}>
              আর একটু বাকি
            </h1>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{longLabel}</div>
          </div>
          <StatusBanners saveState={saveState} closed={closed} />
          <div role="alert" className="sv-banner is-warn" style={{ margin: '14px 16px 0' }}>
            {Icon.warn()}
            <span>
              {bn(missing.length)}টি প্রশ্নে মোট <b>{bn(missingCount)}টি মার্ক</b> বাকি। সব মার্ক দিলে জমা দেওয়া যাবে। আপনার কাজ সংরক্ষিত আছে।
            </span>
          </div>
          <div className="flex flex-col gap-2" style={{ padding: '14px 16px 16px' }}>
            {missing.map((m) => (
              <button key={m.question.key} type="button" className="sv-gap" onClick={() => onGoTo(m.q)}>
                <span className="flex flex-col" style={{ minWidth: 0 }}>
                  <b style={{ fontSize: 15 }}>
                    প্রশ্ন {bn(m.q + 1)} · {questionLabel(m.question)}
                  </b>
                  <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
                    {m.students
                      .slice(0, 3)
                      .map((s) => s.name)
                      .join(', ')}
                    {m.students.length > 3 ? ` ও আরও ${bn(m.students.length - 3)} জন` : ''}
                  </span>
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--sv-bronze-pressed)', whiteSpace: 'nowrap' }}>{bn(m.students.length)} জন →</span>
              </button>
            ))}
          </div>
          <div className="sv-footer is-white">
            <button type="button" className="sv-cta" onClick={() => onGoTo(missing[0].q)}>
              প্রথম বাকি মার্কে যান
            </button>
            <button type="button" className="sv-cta" disabled aria-disabled="true">
              জমা দিন ({bn(missingCount)}টি বাকি)
            </button>
          </div>
        </main>
      </div>
    );
  }

  const summaryChips = (
    <div className="flex flex-wrap gap-1.5">
      <span className="sv-chip is-ok">
        {bn(students.length)} জন · {bn(questions.length)}টি প্রশ্ন · সব পূর্ণ
      </span>
      {noteCount > 0 && <span className="sv-chip is-info">{bn(noteCount)}টি নোট</span>}
    </div>
  );

  return (
    <div className="sv-frame">
      {desktop && <DeskHeader config={config} batchKey={batchKey} saveState={saveState} />}

      {/* Phone (T1-Review) */}
      {!desktop && (
      <main className="flex flex-col" style={{ flex: 1 }}>
        <Topbar label="শেষ ধাপ · দেখে নিয়ে জমা" onBack={onBack} backLabel="প্রশ্নে ফিরুন" />
        <div className="flex flex-col gap-2" style={{ padding: '6px 20px 0' }}>
          <h1 className="sv-head sv-h1" style={{ lineHeight: 1.4 }}>
            দেখে নিয়ে জমা দিন
          </h1>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{longLabel}</div>
          {summaryChips}
          <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>যেকোনো মার্কে চাপ দিয়ে সেখানেই বদলান।</div>
        </div>
        <StatusBanners saveState={saveState} closed={closed} />
        <div className="sv-grid" style={{ margin: '14px 10px 0', ['--sv-questions' as string]: questions.length }}>
          <div className="sv-grid-row is-head" aria-hidden="true">
            <div style={{ textAlign: 'left' }}>শিক্ষার্থী</div>
            {questions.map((question, q) => (
              <div key={question.key}>{bn(q + 1)}</div>
            ))}
            <div className="flex justify-center">{Icon.note({ stroke: 'var(--sv-text-muted)' })}</div>
          </div>
          {students.map((student) => (
            <div key={student.erpId} className="sv-grid-row">
              <div className="flex gap-1.5 items-baseline" style={{ minWidth: 0 }}>
                <span style={{ flex: 'none', fontSize: 13, color: 'var(--sv-text-muted)', width: 16 }}>{student.roll !== null ? bn(student.roll) : '–'}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</span>
              </div>
              {questions.map((question, q) => {
                const mark = answers[student.erpId]?.[question.key];
                return (
                  <button
                    key={question.key}
                    type="button"
                    className={`sv-grid-cell${mark === scale[scale.length - 1] ? ' is-low' : ''}`}
                    aria-label={`${student.name}, প্রশ্ন ${bn(q + 1)}: ${bn(mark)}। বদলাতে চাপ দিন`}
                    onClick={() => setEditing({ erpId: student.erpId, q })}
                  >
                    {bn(mark)}
                  </button>
                );
              })}
              <button
                type="button"
                className="sv-grid-cell"
                aria-label={`${notes[student.erpId] ? 'নোট দেখুন' : 'নোট যোগ করুন'}: ${student.name}`}
                onClick={() => setNoting(student.erpId)}
              >
                {notes[student.erpId] ? Icon.noteFilled() : Icon.noteAdd()}
              </button>
            </div>
          ))}
        </div>
        <ol className="flex flex-col gap-1" style={{ margin: '14px 16px 16px', padding: 0, listStyle: 'none', fontSize: 13, lineHeight: 1.6, color: 'var(--sv-text-muted)' }}>
          {questions.map((question, q) => (
            <li key={question.key}>
              <b style={{ color: 'var(--sv-text)' }}>{bn(q + 1)}</b> {questionLabel(question)}
            </li>
          ))}
        </ol>
        <div className="sv-footer is-white">
          {notices}
          {submitButton}
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--sv-text-muted)' }}>জমা দেওয়ার পরেও {editUntil} পর্যন্ত সংশোধন করা যাবে</div>
        </div>
      </main>
      )}

      {/* Desktop (T1-Review-Desktop) */}
      {desktop && (
      <div className="sv-wide flex flex-col" style={{ gap: 18 }}>
        <div className="flex flex-wrap items-baseline gap-3.5">
          <button type="button" className="sv-tertiary" style={{ alignSelf: 'auto', textDecoration: 'none', padding: 0 }} onClick={onBack}>
            ← প্রশ্নে ফিরে যান
          </button>
          <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
            দেখে নিয়ে জমা দিন
          </h1>
        </div>
        <StatusBanners saveState={saveState} closed={closed} />
        <div className="flex flex-wrap gap-5 items-start">
          <section className="sv-panel" style={{ flex: '999 1 720px', minWidth: 0, padding: '8px 12px 12px', overflowX: 'auto', borderRadius: 18 }}>
            <table className="sv-desk-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', width: 44 }}>রোল</th>
                  <th style={{ textAlign: 'left', minWidth: 190 }}>শিক্ষার্থী</th>
                  {questions.map((question, q) => (
                    <th key={question.key} style={{ width: 76 }}>
                      <div style={{ fontSize: 15, color: 'var(--sv-text)' }}>{bn(q + 1)}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{questionLabel(question)}</div>
                    </th>
                  ))}
                  <th style={{ textAlign: 'left', width: 220 }}>নোট (ঐচ্ছিক)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.erpId}>
                    <td className="sv-num" style={{ color: 'var(--sv-text-muted)', paddingLeft: 8 }}>
                      {student.roll !== null ? bn(student.roll) : '–'}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {student.name}
                      {student.roll === null && <div className="sv-student-id">আইডি {bn(student.erpId)}</div>}
                    </td>
                    {questions.map((question, q) => {
                      const mark = answers[student.erpId]?.[question.key];
                      return (
                        <td key={question.key}>
                          <button
                            type="button"
                            className={`sv-grid-cell${mark === scale[scale.length - 1] ? ' is-low' : ''}`}
                            style={{ width: '100%', height: 36 }}
                            aria-label={`${student.name}, প্রশ্ন ${bn(q + 1)}: ${bn(mark)}। বদলাতে চাপ দিন`}
                            onClick={() => setEditing({ erpId: student.erpId, q })}
                          >
                            {bn(mark)}
                          </button>
                        </td>
                      );
                    })}
                    <td>
                      {notes[student.erpId] ? (
                        <button
                          type="button"
                          onClick={() => setNoting(student.erpId)}
                          aria-label={`নোট দেখুন: ${student.name}`}
                          style={{
                            display: 'block',
                            width: '100%',
                            maxWidth: 220,
                            border: 0,
                            textAlign: 'left',
                            fontSize: 13,
                            lineHeight: 1.4,
                            color: 'var(--sv-info)',
                            padding: '6px 8px',
                            borderRadius: 8,
                            background: 'var(--sv-info-bg)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                          }}
                        >
                          {notes[student.erpId]}
                        </button>
                      ) : (
                        <button type="button" className="sv-note-add" aria-label={`নোট যোগ করুন: ${student.name}`} onClick={() => setNoting(student.erpId)}>
                          + নোট যোগ করুন
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <aside className="flex flex-col gap-3.5" style={{ flex: '1 1 300px', position: 'sticky', top: 12 }}>
            <div className="sv-panel flex flex-col gap-3.5" style={{ padding: 20, borderRadius: 18 }}>
              <div className="flex flex-col gap-1">
                <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>সারাংশ</div>
                <div className="sv-head" style={{ fontSize: 20 }}>
                  {batchLabel(config.snapshot, batchKey, 'short')}
                </div>
              </div>
              {summaryChips}
              {notices}
              {submitButton}
              <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', lineHeight: 1.5 }}>
                জমা দেওয়ার পরেও {editUntil} পর্যন্ত সংশোধন করা যাবে। কোনো মার্কে চাপ দিয়ে সেখানেই বদলান।
              </div>
            </div>
            <div className="sv-panel flex flex-col gap-1.5" style={{ padding: '16px 18px', borderRadius: 18, fontSize: 13.5, lineHeight: 1.5, color: 'var(--sv-text-body)' }}>
              <div style={{ fontWeight: 600, color: 'var(--sv-text)', marginBottom: 2 }}>প্রশ্নসমূহ</div>
              {questions.map((question, q) => (
                <div key={question.key}>
                  <b>{bn(q + 1)}.</b> {question.text}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
      )}

      {sheets}
    </div>
  );
}

function EditMarkSheet({
  config,
  students,
  answers,
  editing,
  onMove,
  onMark,
  onClose,
}: {
  config: T1Config;
  students: RosterStudent[];
  answers: Record<string, Record<string, number>>;
  editing: { erpId: string; q: number };
  onMove: (next: { erpId: string; q: number }) => void;
  onMark: (erpId: string, questionKey: string, mark: number) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const { questions, scale } = config.snapshot.template;
  const question = questions[editing.q];
  const index = students.findIndex((s) => s.erpId === editing.erpId);
  const student = students[index];
  const prev = students[index - 1];
  const next = students[index + 1];

  return (
    <Sheet labelledBy={titleId} onClose={onClose}>
      <div className="flex flex-col gap-1">
        <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>মার্ক বদলান</div>
        <h2 id={titleId} className="sv-head" style={{ margin: 0, fontSize: 22, lineHeight: 1.4 }}>
          {student.name} · প্রশ্ন {bn(editing.q + 1)}
        </h2>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--sv-text-body)' }}>{question.text}</div>
        {question.hint && <div className="sv-hint">{question.hint}</div>}
      </div>
      <div data-autofocus-scope>
        <MarkTrack large marks={scale} value={answers[student.erpId]?.[question.key]} labelledBy={titleId} onChange={(mark) => onMark(student.erpId, question.key, mark)} />
      </div>
      <div className="flex justify-between" style={{ fontSize: 14 }}>
        <button type="button" className="sv-tertiary" style={{ alignSelf: 'auto', visibility: prev ? 'visible' : 'hidden' }} onClick={() => prev && onMove({ erpId: prev.erpId, q: editing.q })}>
          ← আগের শিক্ষার্থী
        </button>
        <button type="button" className="sv-tertiary" style={{ alignSelf: 'auto', visibility: next ? 'visible' : 'hidden' }} onClick={() => next && onMove({ erpId: next.erpId, q: editing.q })}>
          পরের শিক্ষার্থী →
        </button>
      </div>
      <button type="button" className="sv-cta" style={{ minHeight: 52 }} onClick={onClose}>
        সম্পন্ন
      </button>
    </Sheet>
  );
}

function NoteSheet({
  config,
  student,
  answers,
  note,
  onSave,
  onClose,
}: {
  config: T1Config;
  student: RosterStudent;
  answers: Record<string, number>;
  note: string;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const fieldId = useId();
  const [text, setText] = useState(note);
  const { questions, scale } = config.snapshot.template;
  const low = scale[scale.length - 1];

  return (
    <Sheet labelledBy={titleId} onClose={onClose}>
      <div className="flex flex-col gap-0.5">
        <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>শিক্ষার্থীর জন্য নোট (ঐচ্ছিক)</div>
        <h2 id={titleId} className="sv-head" style={{ margin: 0, fontSize: 22 }}>
          {student.name}
          {student.roll !== null ? ` · রোল ${bn(student.roll)}` : ''}
        </h2>
      </div>
      <div className="flex flex-wrap gap-1.5" aria-label="এই শিক্ষার্থীর মার্ক">
        {questions.map((question, q) => {
          const mark = answers[question.key];
          return (
            <span
              key={question.key}
              style={{
                background: mark === low ? 'var(--sv-warn-bg)' : 'var(--sv-paper)',
                color: mark === low ? 'var(--sv-warn)' : undefined,
                fontWeight: mark === low ? 600 : undefined,
                borderRadius: 8,
                padding: '4px 8px',
                fontSize: 13,
              }}
            >
              {bn(q + 1)} · {mark !== undefined ? bn(mark) : '–'}
            </span>
          );
        })}
      </div>
      <label htmlFor={fieldId} style={{ fontSize: 15, fontWeight: 600 }}>
        নোট
      </label>
      <textarea
        id={fieldId}
        data-autofocus
        className="sv-textarea"
        rows={5}
        maxLength={NOTE_MAX}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
        <span>শুধু অ্যাডমিন ও প্রিন্সিপাল দেখবেন</span>
        <span>
          {bn(text.length)}/{bn(NOTE_MAX)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" className="sv-secondary" style={{ minHeight: 52 }} onClick={onClose}>
          বাতিল
        </button>
        <button type="button" className="sv-cta" style={{ minHeight: 52 }} onClick={() => onSave(text)}>
          সংরক্ষণ
        </button>
      </div>
    </Sheet>
  );
}

function DuplicateAtSubmitSheet({
  label,
  duplicates,
  onKeepDraft,
  onSubmitAnyway,
}: {
  label: string;
  duplicates: DuplicateBatch[];
  onKeepDraft: () => void;
  onSubmitAnyway: () => void;
}) {
  const titleId = useId();
  const now = Date.now();
  return (
    <Sheet labelledBy={titleId} onClose={onKeepDraft}>
      <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--sv-warn-bg)', color: 'var(--sv-warn)' }}>
        {Icon.warn({ size: 28 })}
      </div>
      <h2 id={titleId} className="sv-head" style={{ margin: 0, fontSize: 21, lineHeight: 1.45 }}>
        এইমাত্র আরেকজন শিক্ষক এই ক্লাস ও বিষয়ের রিভিউ জমা দিয়েছেন
      </h2>
      {duplicates.map((d) => (
        <div key={d.submissionId} style={{ fontSize: 14.5, color: 'var(--sv-text-muted)' }}>
          {d.teacherName} · {ago(d.submittedAt, now)} · {label}
        </div>
      ))}
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--sv-text-muted)' }}>
        আপনি সত্যিই এই ক্লাসে এই বিষয় পড়ালে জমা দিন। দুটি রিভিউই সংরক্ষিত থাকবে এবং অ্যাডমিনকে বিষয়টি জানানো হবে।
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="sv-secondary" onClick={onKeepDraft}>
          খসড়া রেখে দিন
        </button>
        <button type="button" className="sv-cta" onClick={onSubmitAnyway}>
          তবুও জমা দিন
        </button>
      </div>
    </Sheet>
  );
}

/** Warning when another teacher already submitted this class and subject (T1-Duplicate). */
export function DuplicateSheet({
  label,
  duplicate,
  onChange,
  onContinue,
}: {
  label: string;
  duplicate: DuplicateBatch;
  onChange: () => void;
  onContinue: () => void;
}) {
  const titleId = useId();
  return (
    <Sheet labelledBy={titleId} onClose={onChange}>
      <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--sv-warn-bg)', color: 'var(--sv-warn)' }}>
        {Icon.warn({ size: 28 })}
      </div>
      <h2 id={titleId} className="sv-head" style={{ margin: 0, fontSize: 23, lineHeight: 1.35 }}>
        এই ক্লাস ও বিষয়ের রিভিউ আগেই জমা হয়েছে
      </h2>
      <div className="flex flex-col gap-1.5" style={{ borderRadius: 16, border: '1px solid var(--sv-hairline)', padding: '14px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 15, color: 'var(--sv-text-muted)' }}>
          জমা দিয়েছেন: <b style={{ color: 'var(--sv-text)' }}>{duplicate.teacherName}</b>
        </div>
        <div style={{ fontSize: 15, color: 'var(--sv-text-muted)' }}>
          {formatDateTime(new Date(duplicate.submittedAt))} · {bn(duplicate.students)} জন শিক্ষার্থী
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--sv-text-muted)' }}>
        আপনি সত্যিই এই ক্লাসে এই বিষয় পড়ালে চালিয়ে যান। দুটি রিভিউই সংরক্ষিত থাকবে এবং অ্যাডমিনকে বিষয়টি জানানো হবে।
      </p>
      <div className="flex flex-col gap-2.5" style={{ paddingTop: 4 }}>
        <button type="button" className="sv-cta" data-autofocus onClick={onChange}>
          ফিরে গিয়ে বদলান
        </button>
        <button type="button" className="sv-secondary is-bronze-text" onClick={onContinue}>
          তবুও চালিয়ে যান
        </button>
      </div>
    </Sheet>
  );
}
