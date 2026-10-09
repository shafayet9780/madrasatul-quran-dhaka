'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SaveState } from '@/components/survey/ui';
import type { BatchKeyInput, BatchState, DraftRow } from '@/lib/survey/t1-types';
import type { SurveyApi } from './api';

/**
 * clear: the student's saved marks and note go first ("not my student"); later taps are kept.
 * A null answer withdraws that mark.
 */
type Pending = Record<string, { answers: Record<string, number | null>; note?: string; clear?: true }>;

export const batchId = (key: BatchKeyInput) => `${key.teacherKey}|${key.classKey}|${key.sectionKey}|${key.subjectKey}`;
const storageKey = (roundId: string, key: BatchKeyInput) => `sv-t1-pending:${roundId}:${batchId(key)}`;

function readStored(roundId: string, key: BatchKeyInput): Pending {
  try {
    return JSON.parse(localStorage.getItem(storageKey(roundId, key)) ?? '{}') as Pending;
  } catch {
    return {};
  }
}

function writeStored(roundId: string, key: BatchKeyInput, pending: Pending) {
  try {
    if (Object.keys(pending).length) localStorage.setItem(storageKey(roundId, key), JSON.stringify(pending));
    else localStorage.removeItem(storageKey(roundId, key));
  } catch {
    // Private mode or full storage: autosave still works while online.
  }
}

/** Applies marks over saved ones; a null mark removes the answer. */
function withMarks(saved: Record<string, number>, marks: Record<string, number | null>): Record<string, number> {
  const out = { ...saved };
  for (const [questionKey, mark] of Object.entries(marks)) {
    if (mark === null) delete out[questionKey];
    else out[questionKey] = mark;
  }
  return out;
}

function merge(base: Pending, extra: Pending): Pending {
  const out: Pending = { ...base };
  for (const [id, row] of Object.entries(extra)) {
    const prev = row.clear ? undefined : out[id];
    out[id] = {
      answers: { ...(prev?.answers ?? {}), ...row.answers },
      ...(row.note !== undefined ? { note: row.note } : prev?.note !== undefined ? { note: prev.note } : {}),
      ...(row.clear || prev?.clear ? { clear: true as const } : {}),
    };
  }
  return out;
}

/**
 * One teacher batch: loads saved marks, applies taps immediately, and autosaves changed rows
 * (debounced). Unsent changes are kept on the device, so they survive going offline or a reload.
 */
export function useBatch(api: SurveyApi, roundId: string, key: BatchKeyInput | null) {
  const [batch, setBatch] = useState<BatchState | null>(null);
  const [loadError, setLoadError] = useState<'network' | 'closed' | 'invalid' | null>(null);
  const [answers, setAnswers] = useState<BatchState['answers']>({});
  const [notes, setNotes] = useState<BatchState['notes']>({});
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [closed, setClosed] = useState(false);
  /** The class or subject left the round's lists (admin refreshed them): marks stay on the device. */
  const [stale, setStale] = useState(false);

  const pending = useRef<Pending>({});
  const inflight = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = useRef(key);
  keyRef.current = key;
  const closedRef = useRef(false);
  closedRef.current = closed || stale;
  const loadRef = useRef<(() => Promise<void>) | null>(null);
  const id = key ? batchId(key) : null;

  const flush = useCallback(async (): Promise<boolean> => {
    const current = keyRef.current;
    if (!current) return true;
    if (inflight.current) await inflight.current;
    const sending = pending.current;
    if (!Object.keys(sending).length) return true;
    pending.current = {};
    setSaveState('saving');

    const run = (async () => {
      const rows: DraftRow[] = Object.entries(sending).map(([studentErpId, row]) => ({ studentErpId, ...row }));
      // Unsent rows go back to the queue, unless the teacher has moved to another class
      // (they stay on the device under that class and are sent when it is opened again).
      const restore = () => {
        if (keyRef.current === current) {
          pending.current = merge(sending, pending.current);
          writeStored(roundId, current, pending.current);
        } else {
          writeStored(roundId, current, merge(sending, readStored(roundId, current)));
        }
      };
      try {
        const response = await api.post<{ ok: boolean; reason?: string; rejected?: string[] }>('draft', { ...current, rows });
        if (response.status === 200) {
          writeStored(roundId, current, pending.current);
          const rejected = response.data.rejected ?? [];
          if (rejected.length) {
            // These students have left the class (e.g. ERP import): reload the class list.
            setSaveState('idle');
            void loadRef.current?.();
            return true;
          }
          setSaveState(Object.keys(pending.current).length ? 'saving' : 'saved');
          return true;
        }
        if (response.status === 403) {
          restore();
          closedRef.current = true;
          setClosed(true);
          setSaveState('error');
          return false;
        }
        if (response.status === 400) {
          // The class/subject is no longer in the round: keep the marks on the device, stop retrying.
          restore();
          closedRef.current = true;
          setStale(true);
          setSaveState('error');
          return false;
        }
        restore();
        setSaveState('error');
        return false;
      } catch {
        restore();
        setSaveState('offline');
        return false;
      }
    })();
    inflight.current = run;
    const ok = await run;
    inflight.current = null;
    // No timed retry once the round is closed: 'online' or a reload after the admin extends it will send.
    if (!ok && !closedRef.current && Object.keys(pending.current).length && !timer.current) {
      timer.current = setTimeout(() => {
        timer.current = null;
        void flush();
      }, 8000);
    } else if (ok && Object.keys(pending.current).length) {
      void flush();
    }
    return ok;
  }, [api, roundId]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void flush();
    }, 450);
  }, [flush]);

  const load = useCallback(async () => {
    const current = keyRef.current;
    if (!current) return;
    setLoadError(null);
    try {
      const response = await api.post<BatchState & { reason?: string }>('batch', current);
      if (response.status !== 200) {
        setLoadError(response.status === 403 ? 'closed' : 'invalid');
        return;
      }
      const stored = readStored(roundId, current);
      const saved = response.data;
      // Queued marks for students who have left the class can never be saved; drop them.
      const roster = new Set(saved.students.map((s) => s.erpId));
      pending.current = Object.fromEntries(Object.entries(merge(stored, pending.current)).filter(([erpId]) => roster.has(erpId)));
      writeStored(roundId, current, pending.current);
      const mergedAnswers = { ...saved.answers };
      const mergedNotes = { ...saved.notes };
      for (const [erpId, row] of Object.entries(pending.current)) {
        mergedAnswers[erpId] = withMarks(row.clear ? {} : (mergedAnswers[erpId] ?? {}), row.answers);
        if (row.note !== undefined) mergedNotes[erpId] = row.note;
        else if (row.clear) delete mergedNotes[erpId];
      }
      setBatch(saved);
      setAnswers(mergedAnswers);
      setNotes(mergedNotes);
      setSaveState(Object.keys(pending.current).length ? 'saving' : 'idle');
      if (Object.keys(pending.current).length) void flush();
    } catch {
      setLoadError('network');
    }
  }, [api, roundId, flush]);

  loadRef.current = load;

  useEffect(() => {
    setBatch(null);
    setAnswers({});
    setNotes({});
    setClosed(false);
    setStale(false);
    pending.current = {};
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const online = () => void flush();
    const offline = () => Object.keys(pending.current).length && setSaveState('offline');
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!closedRef.current && (Object.keys(pending.current).length || inflight.current)) event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [flush]);

  const queue = useCallback(
    (erpId: string, change: { answers?: Record<string, number | null>; note?: string; clear?: true }) => {
      const current = keyRef.current;
      if (!current) return;
      pending.current = merge(pending.current, {
        [erpId]: { answers: change.answers ?? {}, ...(change.note !== undefined ? { note: change.note } : {}), ...(change.clear ? { clear: true as const } : {}) },
      });
      writeStored(roundId, current, pending.current);
      setSaveState('saving');
      schedule();
    },
    [roundId, schedule]
  );

  /** null withdraws the mark (given by mistake). */
  const setMark = useCallback(
    (erpId: string, questionKey: string, mark: number | null) => {
      setAnswers((prev) => ({ ...prev, [erpId]: withMarks(prev[erpId] ?? {}, { [questionKey]: mark }) }));
      queue(erpId, { answers: { [questionKey]: mark } });
    },
    [queue]
  );

  const setNote = useCallback(
    (erpId: string, note: string) => {
      setNotes((prev) => {
        const next = { ...prev };
        if (note.trim()) next[erpId] = note.trim();
        else delete next[erpId];
        return next;
      });
      queue(erpId, { note: note.trim() });
    },
    [queue]
  );

  /** By-level subject, "not my student": removes the student's marks and note from the draft. */
  const clearStudent = useCallback(
    (erpId: string) => {
      const drop = <T,>(prev: Record<string, T>) => {
        const next = { ...prev };
        delete next[erpId];
        return next;
      };
      setAnswers(drop);
      setNotes(drop);
      queue(erpId, { clear: true });
    },
    [queue]
  );

  /** Saves everything now; true when nothing is left unsent. */
  const saveNow = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await flush();
    return !Object.keys(pending.current).length;
  }, [flush]);

  return { batch, loadError, answers, notes, saveState, closed, stale, setMark, setNote, clearStudent, saveNow, reload: load };
}
