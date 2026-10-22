'use client';

import { Icon } from '@/components/site/icon';

/** Prints the notice: the sheet alone (globals.css hides the rest of the page when printing). */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-15 font-strong text-ink shadow-[inset_0_0_0_1.5px_var(--color-line-strong)] hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <Icon name="printer" />
      {label}
    </button>
  );
}
