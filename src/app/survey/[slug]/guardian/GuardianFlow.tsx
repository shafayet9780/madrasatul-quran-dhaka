'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { relationText } from '@/lib/survey/guardian-logic';
import type { GuardianSubmitResult, LookupResponse, VerifyResponse } from '@/lib/survey/guardian-types';
import { normaliseMobile } from '@/lib/survey/normalise';
import { classLabel } from '@/lib/survey/snapshot';
import { createApi } from '../t1/api';
import { G2QuestionScreen, G2ReviewScreen, type SubmitError } from './G2Screens';
import { ClassScreen, IdentifyScreen, IntroScreen, MatchScreen, type LookupError, type VerifyState } from './IdentityScreens';
import type { DeviceForm, GuardianConfig, GuardianStep, Identity } from './types';

const STEPS: GuardianStep[] = ['intro', 'class', 'identify', 'match', 'answer', 'review'];
const EMPTY: Identity = { classKey: '', sectionKey: '', by: 'mobile', searched: '', children: [], name: '', relationOther: '', mobile: '' };

/** The furthest step the identity supports; a reload or the back button never lands past it. */
function allowedStep(config: GuardianConfig, identity: Identity, wanted: GuardianStep): GuardianStep {
  const cls = config.snapshot.classes.find((c) => c.key === identity.classKey);
  const placeOk = cls && (cls.sections.length ? cls.sections.some((s) => s.key === identity.sectionKey) : identity.sectionKey === '');
  if (wanted === 'intro' || wanted === 'class') return wanted;
  if (!placeOk) return 'class';
  if (wanted === 'identify') return wanted;
  if (!identity.children.length) return 'identify';
  if (wanted === 'match') return wanted;
  // Questions need the child and a complete submitter, as the match screen requires.
  const submitterOk = identity.name.trim() && identity.relation && relationText(identity.relation, identity.relationOther) && normaliseMobile(identity.mobile);
  return identity.children.some((c) => c.erpId === identity.childErpId) && submitterOk ? wanted : 'match';
}

const formKey = (roundId: string, erpId: string) => `sv-g-form:${roundId}:${erpId}`;

function readForm(roundId: string, erpId: string): DeviceForm {
  try {
    const saved = JSON.parse(localStorage.getItem(formKey(roundId, erpId)) ?? 'null');
    if (saved && typeof saved.submissionId === 'string') return { submissionId: saved.submissionId, answers: saved.answers ?? {}, comment: saved.comment ?? '' };
  } catch {
    // Storage unavailable: the form lives in memory only.
  }
  return { submissionId: crypto.randomUUID(), answers: {}, comment: '' };
}

/** Guardian survey (G1/G2): identity first; the questions follow in the next steps. */
export function GuardianFlow({ config }: { config: GuardianConfig }) {
  const api = useMemo(() => createApi(config.roundId, config.linkKey), [config.roundId, config.linkKey]);
  const storeKey = `sv-g-identity:${config.roundId}`;
  const router = useRouter();
  const [step, setStep] = useState<GuardianStep>('intro');
  const [q, setQ] = useState(0);
  const [form, setForm] = useState<DeviceForm | null>(null);
  /** null until read from this tab's storage after mounting; nothing is saved before that. */
  const [stored, setIdentity] = useState<Identity | null>(null);
  const identity = stored ?? EMPTY;
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<LookupError | null>(null);
  const [verify, setVerify] = useState<VerifyState>('idle');

  const go = useCallback(
    (next: GuardianStep, replace = false, question = 0) => {
      const params = new URLSearchParams({ k: config.linkKey });
      if (next !== 'intro') params.set('step', next);
      if (next === 'answer') params.set('q', String(question + 1));
      setQ(question);
      const url = `${window.location.pathname}?${params.toString()}`;
      if (replace) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
      setStep(next);
      window.scrollTo({ top: 0 });
    },
    [config.linkKey]
  );

  // Identity lives in this tab's sessionStorage (names and mobiles stay out of the URL).
  useEffect(() => {
    if (stored) return;
    let saved = EMPTY;
    try {
      saved = { ...EMPTY, ...JSON.parse(sessionStorage.getItem(storeKey) ?? '{}') };
    } catch {
      // Storage unavailable: start fresh.
    }
    setIdentity(saved);
    setValue(saved.searched);
    const search = new URLSearchParams(window.location.search);
    const wanted = search.get('step') as GuardianStep | null;
    const start = allowedStep(config, saved, wanted && STEPS.includes(wanted) ? wanted : 'intro');
    const question = Math.min(Math.max(0, Number(search.get('q') ?? 1) - 1 || 0), config.snapshot.template.questions.length - 1);
    if (start !== (wanted ?? 'intro')) go(start, true);
    else {
      setStep(start);
      setQ(question);
    }
  }, [stored, config, storeKey, go]);

  useEffect(() => {
    if (!stored) return;
    try {
      sessionStorage.setItem(storeKey, JSON.stringify(stored));
    } catch {
      // Storage unavailable.
    }
  }, [stored, storeKey]);

  useEffect(() => {
    const onPop = () => {
      const search = new URLSearchParams(window.location.search);
      const wanted = search.get('step') as GuardianStep | null;
      setStep(allowedStep(config, identity, wanted && STEPS.includes(wanted) ? wanted : 'intro'));
      setQ(Math.min(Math.max(0, Number(search.get('q') ?? 1) - 1 || 0), config.snapshot.template.questions.length - 1));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [config, identity]);

  // The form for the chosen child: read from this device, saved on every change.
  const childErpId = identity.childErpId;
  useEffect(() => {
    setForm(childErpId ? readForm(config.roundId, childErpId) : null);
  }, [config.roundId, childErpId]);
  const updateForm = useCallback(
    (change: Partial<DeviceForm>) => {
      setForm((prev) => {
        if (!prev || !childErpId) return prev;
        // A changed form is a new submission (a resend after a lost reply must not return the old receipt).
        const next = { ...prev, ...change, submissionId: crypto.randomUUID() };
        try {
          localStorage.setItem(formKey(config.roundId, childErpId), JSON.stringify(next));
        } catch {
          // Storage unavailable.
        }
        return next;
      });
    },
    [config.roundId, childErpId]
  );

  async function submit(): Promise<SubmitError | null> {
    if (!form || !childErpId || !identity.relation) return 'failed';
    try {
      const response = await api.post<GuardianSubmitResult>('guardian-submit', {
        submissionId: form.submissionId,
        classKey: identity.classKey,
        sectionKey: identity.sectionKey,
        studentErpId: childErpId,
        submitter: { name: identity.name, relation: identity.relation, relationOther: identity.relationOther, mobile: identity.mobile },
        answers: form.answers,
        comment: form.comment,
      });
      const result = response.data;
      if (result.ok) {
        try {
          localStorage.removeItem(formKey(config.roundId, childErpId));
          // Keep who is answering for "another child" from the receipt; the child is chosen again.
          sessionStorage.setItem(storeKey, JSON.stringify({ ...identity, children: [], childErpId: undefined }));
        } catch {
          // Storage unavailable.
        }
        router.push(`/survey/receipt/${result.receiptToken}`);
        return null;
      }
      if (response.status === 403) return 'closed';
      if (response.status === 429) return 'rate-limited';
      if (result.reason === 'incomplete') return 'incomplete';
      if (result.reason === 'invalid') {
        // The child left this class (roster re-imported) or the form no longer fits: search again.
        setError('changed');
        go('identify');
        return null;
      }
      if (result.reason === 'submitter') {
        go('match');
        return null;
      }
      return 'failed';
    } catch {
      return 'network';
    }
  }

  const patch = useCallback((change: Partial<Identity>) => setIdentity((prev) => ({ ...(prev ?? EMPTY), ...change })), []);

  // Live verified / unverified line: asked once per complete number, after typing pauses.
  const mobile = normaliseMobile(identity.mobile);
  useEffect(() => {
    // Checked on the match screen; the answer is kept for the question screens.
    if (step !== 'match') return;
    if (!identity.childErpId || !mobile) {
      setVerify('idle');
      return;
    }
    setVerify('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        // The raw number: the server normalises it once (a foreign number does not survive twice).
        const response = await api.post<VerifyResponse>('verify', { studentErpId: identity.childErpId, mobile: identity.mobile });
        if (cancelled) return;
        setVerify(response.status === 200 ? (response.data.verified ? 'verified' : 'unverified') : 'idle');
        if (response.status === 200) patch({ verified: { key: `${identity.childErpId}|${mobile}`, value: response.data.verified } });
      } catch {
        if (!cancelled) setVerify('idle');
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [api, step, identity.childErpId, identity.mobile, mobile, patch]);

  async function search() {
    setBusy(true);
    setError(null);
    try {
      const response = await api.post<LookupResponse>('lookup', { classKey: identity.classKey, sectionKey: identity.sectionKey, by: identity.by, value });
      if (response.status !== 200) {
        setError(response.status === 429 ? 'rate-limited' : response.status === 403 ? 'closed' : 'failed');
        return;
      }
      const { children } = response.data;
      if (!children.length) {
        setError('not-found');
        return;
      }
      patch({
        children,
        searched: value,
        childErpId: children.length === 1 ? children[0].erpId : undefined,
        // A parent's own number found the child: use it as the submitter mobile, unless the guardian
        // typed a different one there (an earlier prefill is replaced by the new search).
        mobile: identity.by === 'mobile' && (!identity.mobile || identity.mobile === identity.searched) ? value : identity.mobile,
      });
      go('match');
    } catch {
      setError('network');
    } finally {
      setBusy(false);
    }
  }

  if (step === 'intro') return <IntroScreen config={config} onStart={() => go('class')} />;
  if (!stored) {
    return (
      <main className="sv-screen" style={{ alignItems: 'center', justifyContent: 'center' }} aria-busy="true">
        <p className="sv-muted">লোড হচ্ছে…</p>
      </main>
    );
  }
  if (step === 'class') {
    return (
      <ClassScreen
        config={config}
        classKey={identity.classKey || undefined}
        sectionKey={identity.sectionKey || undefined}
        onClass={(classKey) => patch({ classKey, sectionKey: '', children: [], childErpId: undefined })}
        onSection={(sectionKey) => patch({ sectionKey, children: [], childErpId: undefined })}
        onBack={() => go('intro')}
        onNext={() => {
          setError(null);
          go('identify');
        }}
      />
    );
  }
  if (step === 'identify') {
    return (
      <IdentifyScreen
        config={config}
        identity={identity}
        value={value}
        busy={busy}
        error={error}
        onBy={(by) => {
          patch({ by });
          setValue('');
          setError(null);
        }}
        onValue={(next) => {
          setValue(next);
          setError(null);
        }}
        onBack={() => go('class')}
        onChangeClass={() => go('class')}
        onSearch={() => void search()}
      />
    );
  }
  if (step === 'match') {
    return <MatchScreen config={config} identity={identity} verify={verify} onChange={patch} onSearchAgain={() => go('identify')} onStart={() => go('answer')} />;
  }
  const child = identity.children.find((c) => c.erpId === childErpId);
  if (form && child && config.kind === 'G2') {
    const heading = {
      child: `${child.name} · ${classLabel(config.snapshot, identity.classKey, identity.sectionKey)}`,
      submitter: `${identity.name.trim()} (${relationText(identity.relation ?? 'other', identity.relationOther) ?? ''})`,
      // The last check for this child and number; a child found by this very number is on record.
      verified:
        identity.verified?.key === `${childErpId}|${mobile}`
          ? identity.verified.value
          : identity.by === 'mobile' && mobile !== null && normaliseMobile(identity.searched) === mobile
            ? true
            : null,
    };
    if (step === 'answer') {
      return (
        <G2QuestionScreen
          config={config}
          heading={heading}
          q={q}
          answers={form.answers}
          onAnswer={(key, value) => updateForm({ answers: { ...form.answers, [key]: value } })}
          onQuestion={(next) => go('answer', false, next)}
          onBack={() => go('match')}
          onReview={() => go('review')}
        />
      );
    }
    return (
      <G2ReviewScreen
        config={config}
        heading={heading}
        answers={form.answers}
        comment={form.comment}
        onComment={(comment) => updateForm({ comment })}
        onEdit={(question) => go('answer', false, question)}
        onBack={() => go('answer', false, config.snapshot.template.questions.length - 1)}
        onSubmit={submit}
      />
    );
  }
  // G1 question screens arrive in P4.
  return (
    <main className="sv-screen" style={{ alignItems: 'center', justifyContent: 'center' }} aria-busy="true">
      <p className="sv-muted">লোড হচ্ছে…</p>
    </main>
  );
}
