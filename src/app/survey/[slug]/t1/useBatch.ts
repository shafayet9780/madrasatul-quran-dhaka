'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SaveState } from '@/components/survey/ui';
import type { BatchKeyInput, BatchState, DraftRow } from '@/lib/survey/t1-types';
import type { SurveyApi } from './api';

type Pending = Record<string, { answers: Record<string, number>; note?: string }>;

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

function merge(base: Pending, extra: Pending): Pending {
  const out: Pending = { ...base };
  for (const [id, row] of Object.entries(extra)) {
    out[id] = {
      answers: { ...(out[id]?.answers ?? {}), ...row.answers },
      ...(row.note !== undefined ? { note: row.note } : out[id]?.note !== undefined ? { note: out[id].note } : {}),
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

  const pending = useRef<Pending>({});
  const inflight = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = useRef(key);
  keyRef.current = key;
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
      const restore = () => {
        pending.current = merge(sending, pending.current);
        writeStored(roundId, current, pending.current);
      };
      try {
        const response = await api.post<{ ok: boolean; reason?: string }>('draft', { ...current, rows });
        if (response.status === 200) {
          writeStored(roundId, current, pending.current);
          setSaveState(Object.keys(pending.current).length ? 'saving' : 'saved');
          return true;
        }
        if (response.status === 403) {
          restore();
          setClosed(true);
          setSaveState('error');
          return false;
        }
        if (response.status === 400) {
          // The server refused these rows (e.g. a student left the class): drop them and reload.
          writeStored(roundId, current, pending.current);
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
    if (!ok && Object.keys(pending.current).length && !timer.current) {
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
      pending.current = merge(stored, pending.current);
      const saved = response.data;
      const mergedAnswers = { ...saved.answers };
      const mergedNotes = { ...saved.notes };
      for (const [erpId, row] of Object.entries(pending.current)) {
        mergedAnswers[erpId] = { ...(mergedAnswers[erpId] ?? {}), ...row.answers };
        if (row.note !== undefined) mergedNotes[erpId] = row.note;
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

  useEffect(() => {
    setBatch(null);
    setAnswers({});
    setNotes({});
    setClosed(false);
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
      if (Object.keys(pending.current).length || inflight.current) event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [flush]);

  const queue = useCallback(
    (erpId: string, change: { answers?: Record<string, number>; note?: string }) => {
      const current = keyRef.current;
      if (!current) return;
      pending.current = merge(pending.current, { [erpId]: { answers: change.answers ?? {}, ...(change.note !== undefined ? { note: change.note } : {}) } });
      writeStored(roundId, current, pending.current);
      setSaveState('saving');
      schedule();
    },
    [roundId, schedule]
  );

  const setMark = useCallback(
    (erpId: string, questionKey: string, mark: number) => {
      setAnswers((prev) => ({ ...prev, [erpId]: { ...(prev[erpId] ?? {}), [questionKey]: mark } }));
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

  /** Saves everything now; true when nothing is left unsent. */
  const saveNow = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await flush();
    return !Object.keys(pending.current).length;
  }, [flush]);

  return { batch, loadError, answers, notes, saveState, closed, setMark, setNote, saveNow, reload: load };
}
