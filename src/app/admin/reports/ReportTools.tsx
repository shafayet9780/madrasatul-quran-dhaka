'use client';

/** Excel download + print for a report page. */
export function ReportTools({ exportHref, printLabel = 'প্রিন্ট / PDF' }: { exportHref: string; printLabel?: string }) {
  return (
    <div className="flex flex-wrap gap-2 sv-no-print">
      <a className="sv-sbtn" href={exportHref}>
        Excel
      </a>
      <button type="button" className="sv-sbtn" onClick={() => window.print()}>
        {printLabel}
      </button>
    </div>
  );
}
