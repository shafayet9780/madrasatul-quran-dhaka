'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LookupResponse, VerifyResponse } from '@/lib/survey/guardian-types';
import { normaliseMobile } from '@/lib/survey/normalise';
import { createApi } from '../t1/api';
import { ClassScreen, IdentifyScreen, IntroScreen, MatchScreen, type LookupError, type VerifyState } from './IdentityScreens';
import type { GuardianConfig, GuardianStep, Identity } from './types';

const STEPS: GuardianStep[] = ['intro', 'class', 'identify', 'match', 'answer'];
const EMPTY: Identity = { classKey: '', sectionKey: '', by: 'mobile', searched: '', children: [], name: '', relationOther: '', mobile: '' };

/** The furthest step the identity supports; a reload or the back button never lands past it. */
function allowedStep(config: GuardianConfig, identity: Identity, wanted: GuardianStep): GuardianStep {
  const cls = config.snapshot.classes.find((c) => c.key === identity.classKey);
  const placeOk = cls && (cls.sections.length ? cls.sections.some((s) => s.key === identity.sectionKey) : identity.sectionKey === '');
  if (wanted === 'intro' || wanted === 'class') return wanted;
  if (!placeOk) return 'class';
  if (wanted === 'identify') return wanted;
  if (!identity.children.length) return 'identify';
  return wanted === 'answer' && !identity.childErpId ? 'match' : wanted;
}

/** Guardian survey (G1/G2): identity first; the questions follow in the next steps. */
export function GuardianFlow({ config }: { config: GuardianConfig }) {
  const api = useMemo(() => createApi(config.roundId, config.linkKey), [config.roundId, config.linkKey]);
  const storeKey = `sv-g-identity:${config.roundId}`;
  const [step, setStep] = useState<GuardianStep>('intro');
  /** null until read from this tab's storage after mounting; nothing is saved before that. */
  const [stored, setIdentity] = useState<Identity | null>(null);
  const identity = stored ?? EMPTY;
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<LookupError | null>(null);
  const [verify, setVerify] = useState<VerifyState>('idle');

  const go = useCallback(
    (next: GuardianStep, replace = false) => {
      const params = new URLSearchParams({ k: config.linkKey });
      if (next !== 'intro') params.set('step', next);
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
    const wanted = new URLSearchParams(window.location.search).get('step') as GuardianStep | null;
    const start = allowedStep(config, saved, wanted && STEPS.includes(wanted) ? wanted : 'intro');
    if (start !== (wanted ?? 'intro')) go(start, true);
    else setStep(start);
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
      const wanted = new URLSearchParams(window.location.search).get('step') as GuardianStep | null;
      setStep(allowedStep(config, identity, wanted && STEPS.includes(wanted) ? wanted : 'intro'));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [config, identity]);

  const patch = useCallback((change: Partial<Identity>) => setIdentity((prev) => ({ ...(prev ?? EMPTY), ...change })), []);

  // Live verified / unverified line: asked once per complete number, after typing pauses.
  const mobile = normaliseMobile(identity.mobile);
  useEffect(() => {
    if (step !== 'match' || !identity.childErpId || !mobile) {
      setVerify('idle');
      return;
    }
    setVerify('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        // The raw number: the server normalises it once (a foreign number does not survive twice).
        const response = await api.post<VerifyResponse>('verify', { studentErpId: identity.childErpId, mobile: identity.mobile });
        if (!cancelled) setVerify(response.status === 200 ? (response.data.verified ? 'verified' : 'unverified') : 'idle');
      } catch {
        if (!cancelled) setVerify('idle');
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [api, step, identity.childErpId, identity.mobile, mobile]);

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
  // The question screens (G2 in P3, G1 in P4) start here.
  return (
    <main className="sv-screen" style={{ alignItems: 'center', justifyContent: 'center' }} aria-busy="true">
      <p className="sv-muted">লোড হচ্ছে…</p>
    </main>
  );
}
