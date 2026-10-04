'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { batchLabel } from '@/lib/survey/labels';
import type { BatchKeyInput, BatchState, DuplicateBatch, OverviewItem, SubmitResult } from '@/lib/survey/t1-types';
import { createApi } from './api';
import { RateScreen } from './RateScreen';
import { DuplicateSheet, ReviewScreen, type SubmitOutcome } from './ReviewScreen';
import { ClassScreen, IntroScreen, MissingNameScreen, TeacherScreen } from './StartScreens';
import type { FlowState, T1Config } from './types';
import { searchToState, stateToSearch } from './url-state';
import { batchId, useBatch } from './useBatch';

const ackKey = (roundId: string, id: string) => `sv-t1-ack:${roundId}:${id}`;
const teacherKeyStore = (roundId: string) => `sv-t1-teacher:${roundId}`;

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
      const teacherOk = snapshot.teachers.some((t) => t.key === state.teacherKey);
      const cls = snapshot.classes.find((c) => c.key === state.classKey);
      const batchOk =
        teacherOk &&
        cls &&
        (cls.sections.length ? cls.sections.some((s) => s.key === state.sectionKey) : !state.sectionKey) &&
        cls.subjects.some((s) => s.key === state.subjectKey);
      if ((state.step === 'rate' || state.step === 'review') && !batchOk) return { ...state, step: teacherOk ? 'class' : 'teacher' };
      if (state.step === 'class' && !teacherOk) return { ...state, step: 'teacher' };
      return { ...state, q: Math.min(state.q, snapshot.template.questions.length - 1) };
    },
    [snapshot]
  );

  const [state, setState] = useState<FlowState>(() => sanitize(initial));
  const [teacherChoice, setTeacherChoice] = useState<string | undefined>(state.teacherKey);
  const [overview, setOverview] = useState<OverviewItem[] | null>(null);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [pendingDuplicate, setPendingDuplicate] = useState<{ key: BatchKeyInput; duplicates: DuplicateBatch[] } | null>(null);

  const batchKey: BatchKeyInput | null =
    (state.step === 'rate' || state.step === 'review') && state.teacherKey && state.classKey && state.subjectKey
      ? { teacherKey: state.teacherKey, classKey: state.classKey, sectionKey: state.sectionKey ?? '', subjectKey: state.subjectKey }
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

  // Remember the teacher on this device so the list opens with their name selected.
  useEffect(() => {
    if (teacherChoice) return;
    try {
      const saved = localStorage.getItem(teacherKeyStore(config.roundId));
      if (saved && snapshot.teachers.some((t) => t.key === saved)) setTeacherChoice(saved);
    } catch {
      // Storage unavailable.
    }
  }, [config.roundId, snapshot.teachers, teacherChoice]);

  const loadOverview = useCallback(
    async (teacherKey: string) => {
      setOverview(null);
      try {
        const response = await api.post<{ items: OverviewItem[] }>('overview', { teacherKey });
        if (response.status === 200) setOverview(response.data.items);
      } catch {
        setOverview([]);
      }
    },
    [api]
  );

  useEffect(() => {
    if (state.step === 'class' && state.teacherKey) void loadOverview(state.teacherKey);
  }, [state.step, state.teacherKey, loadOverview]);

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
      const firstGap = questions.findIndex((q) => batch.students.some((s) => !scale.includes(batch.answers[s.erpId]?.[q.key])));
      const base = { ...state, ...key, teacherKey: key.teacherKey };
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
      if (result.reason === 'incomplete') await session.reload();
      if (result.reason === 'conflict') return { ok: false, reason: 'conflict' };
      return result;
    } catch {
      return { ok: false, reason: 'network' };
    }
  }

  if (state.step === 'intro') {
    return <IntroScreen config={config} onStart={() => go({ ...state, step: 'teacher' })} />;
  }
  if (state.step === 'teacher') {
    return (
      <TeacherScreen
        config={config}
        selected={teacherChoice}
        onSelect={setTeacherChoice}
        onBack={() => go({ ...state, step: 'intro' })}
        onMissing={() => go({ ...state, step: 'missing-name' })}
        onNext={() => {
          try {
            localStorage.setItem(teacherKeyStore(config.roundId), teacherChoice!);
          } catch {
            // Storage unavailable.
          }
          go({ step: 'class', teacherKey: teacherChoice, q: 0 });
        }}
      />
    );
  }
  if (state.step === 'missing-name') {
    return <MissingNameScreen config={config} onBack={() => go({ ...state, step: 'teacher' })} />;
  }
  if (state.step === 'class') {
    return (
      <>
        <ClassScreen
          key={state.teacherKey}
          config={config}
          teacherKey={state.teacherKey!}
          overview={overview}
          initial={state}
          busy={opening}
          error={openError}
          onBack={() => go({ ...state, step: 'teacher' })}
          onStart={(key) => void openBatch({ ...key, teacherKey: state.teacherKey! })}
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
  const toClass = () => go({ step: 'class', teacherKey: state.teacherKey, classKey: state.classKey, sectionKey: state.sectionKey, subjectKey: state.subjectKey, q: 0 });
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
  if (state.step === 'rate') {
    return (
      <RateScreen
        config={config}
        batchKey={batchKey}
        students={students}
        answers={session.answers}
        saveState={session.saveState}
        closed={session.closed}
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
      batchKey={batchKey}
      students={students}
      answers={session.answers}
      notes={session.notes}
      saveState={session.saveState}
      closed={session.closed}
      onBack={() => go({ ...state, step: 'rate', q: snapshot.template.questions.length - 1 })}
      onGoTo={(q) => go({ ...state, step: 'rate', q })}
      onMark={session.setMark}
      onNote={session.setNote}
      onSubmit={submit}
    />
  );
}
