'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/shadcn/button';

export function CopyLink({ url, label, done }: { url: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 flex-none bg-card shadow-none"
      onClick={async () => {
        await navigator.clipboard.writeText(url).catch(() => window.prompt(label, url));
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span aria-live="polite">{copied ? done : label}</span>
    </Button>
  );
}
