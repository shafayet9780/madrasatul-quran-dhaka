import type { FlowState, Step } from './types';

// Each step lives in the URL, so reloads, the back button and receipt links land in the right place.

const STEPS: Step[] = ['intro', 'teacher', 'missing-name', 'class', 'rate', 'review'];

export function stateToSearch(state: FlowState, linkKey: string): string {
  const params = new URLSearchParams({ k: linkKey });
  if (state.step !== 'intro') params.set('step', state.step);
  if (state.classKey) params.set('c', state.classKey);
  if (state.sectionKey) params.set('s', state.sectionKey);
  if (state.subjectKey) params.set('sub', state.subjectKey);
  if (state.step === 'rate') params.set('q', String(state.q + 1));
  return `?${params.toString()}`;
}

export function searchToState(search: URLSearchParams | Record<string, string | undefined>): FlowState {
  const get = (name: string) => (search instanceof URLSearchParams ? search.get(name) ?? undefined : search[name]);
  const step = STEPS.includes(get('step') as Step) ? (get('step') as Step) : 'intro';
  return {
    step,
    classKey: get('c'),
    sectionKey: get('s'),
    subjectKey: get('sub'),
    q: Math.max(0, Number(get('q') ?? 1) - 1 || 0),
  };
}
