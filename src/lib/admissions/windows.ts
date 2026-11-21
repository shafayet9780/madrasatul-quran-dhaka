// The cycle's application windows (Studio → Pre-admission form → Cycle settings → Windows): a pre-admission
// window, then an admission window, each with its own dates. The same form takes applications in each; the site's
// wording follows the window that applies now. Pure: shared by the server, the Studio and the client.

export const WINDOW_KINDS = ['preAdmission', 'admission'] as const;
export type WindowKind = (typeof WINDOW_KINDS)[number];
export type AdmissionWindow = { kind: WindowKind; opensAt?: string; closesAt?: string };
export type WindowState = 'not_open' | 'open' | 'closed';

type Dated = { windows?: AdmissionWindow[]; opensAt?: string; closesAt?: string };

/** The windows; a form from before windows (or with none) is one pre-admission window with the cycle's own dates. */
export function admissionWindows(settings: Dated): AdmissionWindow[] {
  return settings.windows?.length ? settings.windows : [{ kind: 'preAdmission', opensAt: settings.opensAt, closesAt: settings.closesAt }];
}

const at = (iso: string | undefined, fallback: number) => (iso ? new Date(iso).getTime() : fallback);

/** The window that applies now: the open one, else the next to open, else the last to close. */
export function currentWindow(settings: Dated, now: Date = new Date()): AdmissionWindow & { state: WindowState } {
  const n = now.getTime();
  const windows = admissionWindows(settings);
  const open = windows.filter((w) => at(w.opensAt, -Infinity) <= n && n <= at(w.closesAt, Infinity));
  if (open.length) return { ...open.sort((a, b) => at(b.opensAt, -Infinity) - at(a.opensAt, -Infinity))[0], state: 'open' };
  const next = windows.filter((w) => at(w.opensAt, -Infinity) > n).sort((a, b) => at(a.opensAt, 0) - at(b.opensAt, 0))[0];
  if (next) return { ...next, state: 'not_open' };
  return { ...[...windows].sort((a, b) => at(b.closesAt, Infinity) - at(a.closesAt, Infinity))[0], state: 'closed' };
}

/** Studio checks: a kind each, each deadline after its opening, and no two windows open at once. */
export function checkWindows(windows: Partial<AdmissionWindow>[] | undefined): string[] {
  const problems: string[] = [];
  const list = windows ?? [];
  list.forEach((w, i) => {
    if (!w.kind) problems.push(`Window ${i + 1}: choose Pre-admission or Admission.`);
    if (w.opensAt && w.closesAt && w.closesAt <= w.opensAt) problems.push(`Window ${i + 1}: the deadline must be after the opening time.`);
  });
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const [a, b] = [list[i], list[j]];
      if (at(a.opensAt, -Infinity) <= at(b.closesAt, Infinity) && at(b.opensAt, -Infinity) <= at(a.closesAt, Infinity))
        problems.push(`Windows ${i + 1} and ${j + 1} overlap: one must close before the other opens.`);
    }
  return problems;
}
