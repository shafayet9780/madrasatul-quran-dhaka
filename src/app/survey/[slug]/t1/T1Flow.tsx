'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { batchLabel } from '@/lib/survey/labels';
import { isByLevel } from '@/lib/survey/snapshot';
import { hasMarks } from '@/lib/survey/t1-logic';
import type { BatchKeyInput, BatchState, DuplicateBatch, OverviewItem, SubmitResult } from '@/lib/survey/t1-types';
import { createApi } from './api';
import { RateScreen } from './RateScreen';
import { DuplicateSheet, ReviewScreen, type SubmitOutcome } from './ReviewScreen';
import { ClassScreen, IntroScreen, MissingNameScreen, TeacherScreen, type LookupResult } from './StartScreens';
import type { FlowState, T1Config, Teacher } from './types';
import { searchToState, stateToSearch } from './url-state';
import { batchId, useBatch } from './useBatch';

const ackKey = (roundId: string, id: string) => `sv-t1-ack:${roundId}:${id}`;
const teacherKeyStore = (roundId: string) => `sv-t1-teacher:${roundId}`;

/** The teacher who last confirmed their ID on this device for this round. */
function readTeacher(roundId: string): Teacher | null {
  try {
    const saved = JSON.parse(localStorage.getItem(teacherKeyStore(roundId)) ?? 'null');
    return typeof saved?.key === 'string' && typeof saved?.name === 'string' ? { key: saved.key, name: saved.name } : null;
  } catch {
    return null;
  }
}

function readAck(roundId: string, id: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(ackKey(roundId, id)) ?? '[]');
  } catch {
    return [];
  }
}

export function T1Flow({ config, initial }: { config: T1Config; initial: FlowState }) {
  const router = useRouter();
  const api = useMemo(() => createApi(config.roundId, config.linkKey), [config.roundId, config.linkKey]);
  const { snapshot } = config;

  // Ignore URL values that are not in this round.
  const sanitize = useCallback(
    (state: FlowState): FlowState => {
      const cls = snapshot.classes.find((c) => c.key === state.classKey);
      const batchOk =
        cls &&
        (cls.sections.length ? cls.sections.some((s) => s.key === state.sectionKey) : !state.sectionKey) &&
        cls.subjects.some((s) => s.key === state.subjectKey);
      if ((state.step === 'rate' || state.step === 'review') && !batchOk) return { ...state, step: 'class' };
      return { ...state, q: Math.min(state.q, snapshot.template.questions.length - 1) };
    },
    [snapshot]
  );

  const [state, setState] = useState<FlowState>(() => sanitize(initial));
  /** Read from the device after mounting: undefined until then, null when nobody has confirmed here. */
  const [teacher, setTeacher] = useState<Teacher | null | undefined>(undefined);
  const needsTeacher = state.step === 'class' || state.step === 'rate' || state.step === 'review';
  const [overview, setOverview] = useState<OverviewItem[] | null>(null);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [pendingDuplicate, setPendingDuplicate] = useState<{ key: BatchKeyInput; duplicates: DuplicateBatch[] } | null>(null);

  const batchKey: BatchKeyInput | null =
    (state.step === 'rate' || state.step === 'review') && teacher && state.classKey && state.subjectKey
      ? { teacherKey: teacher.key, classKey: state.classKey, sectionKey: state.sectionKey ?? '', subjectKey: state.subjectKey }
      : null;
  const session = useBatch(api, config.roundId, batchKey);

  const go = useCallback(
    (next: FlowState, replace = false) => {
      const url = `${window.location.pathname}${stateToSearch(next, config.linkKey)}`;
      if (replace) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
      setState(next);
      window.scrollTo({ top: 0 });
    },
    [config.linkKey]
  );

  useEffect(() => {
    const onPop = () => setState(sanitize(searchToState(new URLSearchParams(window.location.search))));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [sanitize]);

  useEffect(() => setTeacher(readTeacher(config.roundId)), [config.roundId]);

  // Class, rating and review belong to a teacher: without one on this device, ask for the ID first.
  useEffect(() => {
    if (teacher === null && needsTeacher) go({ ...state, step: 'teacher' }, true);
  }, [teacher, needsTeacher, state, go]);

  const forgetTeacher = useCallback(() => {
    try {
      localStorage.removeItem(teacherKeyStore(config.roundId));
    } catch {
      // Storage unavailable.
    }
    setTeacher(null);
  }, [config.roundId]);

  async function lookup(id: string): Promise<LookupResult> {
    try {
      const response = await api.post<Teacher>('teacher', { teacherId: id });
      if (response.status === 200) return { ok: true, teacher: { key: response.data.key, name: response.data.name } };
      return { ok: false, reason: response.status === 404 ? 'not-found' : response.status === 429 ? 'rate-limited' : response.status === 403 ? 'closed' : 'network' };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }

  const loadOverview = useCallback(
    async (teacherKey: string) => {
      setOverview(null);
      try {
        const response = await api.post<{ items: OverviewItem[] }>('overview', { teacherKey });
        if (response.status === 200) setOverview(response.data.items);
        // The admin removed this teacher from the round's list: ask for the ID again.
        else if (response.status === 400) forgetTeacher();
      } catch {
        setOverview([]);
      }
    },
    [api, forgetTeacher]
  );

  useEffect(() => {
    if (state.step === 'class' && teacher) void loadOverview(teacher.key);
  }, [state.step, teacher, loadOverview]);

  async function openBatch(key: BatchKeyInput, skipDuplicateCheck = false) {
    setOpening(true);
    setOpenError(null);
    try {
      const response = await api.post<BatchState>('batch', key);
      if (response.status !== 200) {
        setOpenError(response.status === 403 ? 'এই রাউন্ড এখন বন্ধ।' : 'খোলা যায়নি। পাতাটি আবার লোড করুন।');
        return;
      }
      const batch = response.data;
      const acknowledged = readAck(config.roundId, batchId(key));
      const unseen = batch.duplicates.filter((d) => !acknowledged.includes(d.submissionId));
      if (!skipDuplicateCheck && batch.status === 'new' && unseen.length) {
        setPendingDuplicate({ key, duplicates: batch.duplicates });
        return;
      }
      const { questions, scale } = snapshot.template;
      // By level only the students the teacher has marked count; with none yet, start rating.
      const counted = isByLevel(snapshot, key.classKey, key.subjectKey) ? batch.students.filter((s) => hasMarks(snapshot, batch.answers[s.erpId])) : batch.students;
      const firstGap = counted.length ? questions.findIndex((q) => counted.some((s) => !scale.includes(batch.answers[s.erpId]?.[q.key]))) : 0;
      const base = { ...state, classKey: key.classKey, sectionKey: key.sectionKey, subjectKey: key.subjectKey };
      if (batch.status === 'submitted' || (batch.status === 'draft' && firstGap === -1)) go({ ...base, step: 'review', q: 0 });
      else go({ ...base, step: 'rate', q: Math.max(0, firstGap) });
    } catch {
      setOpenError('ইন্টারনেট সংযোগ নেই। সংযোগ দেখে আবার চেষ্টা করুন।');
    } finally {
      setOpening(false);
    }
  }

  async function submit(acknowledged: string[]): Promise<SubmitOutcome> {
    if (!batchKey) return { ok: false, reason: 'empty' };
    const id = batchId(batchKey);
    const known = [...new Set([...readAck(config.roundId, id), ...acknowledged])];
    if (acknowledged.length) {
      try {
        localStorage.setItem(ackKey(config.roundId, id), JSON.stringify(known));
      } catch {
        // Storage unavailable.
      }
    }
    const saved = await session.saveNow();
    if (!saved) return session.closed ? { ok: false, reason: 'closed' } : { ok: false, reason: 'network' };
    try {
      const response = await api.post<SubmitResult>('submit', { ...batchKey, acknowledgedDuplicates: known });
      const result = response.data;
      if (result.ok) {
        try {
          localStorage.removeItem(ackKey(config.roundId, id));
        } catch {
          // Storage unavailable.
        }
        router.push(`/survey/receipt/${result.receiptToken}`);
        return result;
      }
      // Fresh marks, and fresh "rated by another teacher" names for a by-level subject.
      if (result.reason === 'incomplete' || result.reason === 'taken') await session.reload();
      if (result.reason === 'conflict') return { ok: false, reason: 'conflict' };
      return result;
    } catch {
      return { ok: false, reason: 'network' };
    }
  }

  if (state.step === 'intro') {
    return <IntroScreen config={config} onStart={() => go({ ...state, step: 'teacher' })} />;
  }
  if (state.step === 'missing-name') {
    return <MissingNameScreen config={config} onBack={() => go({ ...state, step: 'teacher' })} />;
  }
  if (teacher === undefined || (needsTeacher && !teacher)) {
    return (
      <main className="sv-screen" style={{ alignItems: 'center', justifyContent: 'center' }} aria-busy="true">
        <p className="sv-muted">লোড হচ্ছে…</p>
      </main>
    );
  }
  if (state.step === 'teacher' || !teacher) {
    return (
      <TeacherScreen
        key={teacher?.key}
        remembered={teacher}
        lookup={lookup}
        onBack={() => go({ ...state, step: 'intro' })}
        onHelp={() => go({ ...state, step: 'missing-name' })}
        onConfirm={(confirmed) => {
          try {
            localStorage.setItem(teacherKeyStore(config.roundId), JSON.stringify(confirmed));
          } catch {
            // Storage unavailable.
          }
          setTeacher(confirmed);
          go({ ...state, step: 'class', q: 0 });
        }}
      />
    );
  }
  if (state.step === 'class') {
    return (
      <>
        <ClassScreen
          key={teacher.key}
          config={config}
          teacherName={teacher.name}
          overview={overview}
          initial={state}
          busy={opening}
          error={openError}
          onBack={() => go({ ...state, step: 'teacher' })}
          onStart={(key) => void openBatch({ ...key, teacherKey: teacher.key })}
        />
        {pendingDuplicate && (
          <DuplicateSheet
            label={batchLabel(snapshot, pendingDuplicate.key)}
            duplicate={pendingDuplicate.duplicates[0]}
            onChange={() => setPendingDuplicate(null)}
            onContinue={() => {
              const { key, duplicates } = pendingDuplicate;
              try {
                localStorage.setItem(ackKey(config.roundId, batchId(key)), JSON.stringify(duplicates.map((d) => d.submissionId)));
              } catch {
                // Storage unavailable.
              }
              setPendingDuplicate(null);
              void openBatch(key, true);
            }}
          />
        )}
      </>
    );
  }

  // rate / review
  const toClass = () => go({ step: 'class', classKey: state.classKey, sectionKey: state.sectionKey, subjectKey: state.subjectKey, q: 0 });
  if (session.loadError) {
    return (
      <main className="sv-screen" style={{ padding: 20, gap: 16, justifyContent: 'center' }}>
        <div role="alert" className="sv-card is-attention">
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {session.loadError === 'closed' ? 'এই রাউন্ড এখন বন্ধ' : session.loadError === 'network' ? 'ইন্টারনেট সংযোগ নেই' : 'এই ক্লাসটি খোলা যায়নি'}
          </div>
          <div style={{ fontSize: 14.5, color: 'var(--sv-text-muted)', lineHeight: 1.55 }}>
            {session.loadError === 'network' ? 'আপনার আগের কাজ সংরক্ষিত আছে। সংযোগ ফিরলে আবার চেষ্টা করুন।' : 'ক্লাস বাছাইয়ে ফিরে আবার চেষ্টা করুন।'}
          </div>
          <button type="button" className="sv-cta" onClick={() => (session.loadError === 'network' ? void session.reload() : toClass())}>
            {session.loadError === 'network' ? 'আবার চেষ্টা করুন' : 'ক্লাস বাছাইয়ে ফিরুন'}
          </button>
        </div>
      </main>
    );
  }
  if (!session.batch || !batchKey) {
    return (
      <main className="sv-screen" style={{ alignItems: 'center', justifyContent: 'center' }} aria-busy="true">
        <p className="sv-muted">লোড হচ্ছে…</p>
      </main>
    );
  }

  const students = session.batch.students;
  const byLevel = isByLevel(snapshot, batchKey.classKey, batchKey.subjectKey);
  if (state.step === 'rate') {
    return (
      <RateScreen
        config={config}
        teacherName={teacher.name}
        batchKey={batchKey}
        students={students}
        answers={session.answers}
        saveState={session.saveState}
        closed={session.closed}
        stale={session.stale}
        byLevel={byLevel}
        taken={session.batch.taken}
        q={state.q}
        onQuestion={(q) => go({ ...state, step: 'rate', q })}
        onBackToClass={toClass}
        onReview={() => go({ ...state, step: 'review' })}
        onMark={session.setMark}
      />
    );
  }
  return (
    <ReviewScreen
      config={config}
      teacherName={teacher.name}
      batchKey={batchKey}
      students={students}
      answers={session.answers}
      notes={session.notes}
      saveState={session.saveState}
      closed={session.closed}
      stale={session.stale}
      byLevel={byLevel}
      taken={session.batch.taken}
      wasSubmitted={Boolean(session.batch.submitted)}
      onBack={() => go({ ...state, step: 'rate', q: snapshot.template.questions.length - 1 })}
      onGoTo={(q) => go({ ...state, step: 'rate', q })}
      onMark={session.setMark}
      onNote={session.setNote}
      onClear={session.clearStudent}
      onSubmit={submit}
    />
  );
}
