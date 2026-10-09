'use client';

import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/shadcn/button';

/** Excel download (when the page has a table to export) + print for a report page. */
export function ReportTools({ exportHref, printLabel = 'প্রিন্ট / PDF' }: { exportHref?: string; printLabel?: string }) {
  return (
    <div className="flex flex-wrap gap-2 sv-no-print">
      {exportHref && (
        // .adm: shadcn's link colours, not the admin's brown link colour.
        <Button asChild variant="outline" className="adm h-9 bg-white shadow-none">
          <a href={exportHref}>
            <Download aria-hidden />
            Excel এক্সপোর্ট
          </a>
        </Button>
      )}
      <Button variant="outline" className="h-9 bg-white shadow-none" onClick={() => window.print()}>
        <Printer aria-hidden />
        {printLabel}
      </Button>
    </div>
  );
}
