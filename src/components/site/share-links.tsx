'use client';

import { useState } from 'react';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

/** Copies a link; where the browser cannot (no clipboard on a plain-http address), shows it to copy by hand. */
export function copyLink(url: string, label: string, done: () => void) {
  if (!navigator.clipboard) return void window.prompt(label, url);
  navigator.clipboard.writeText(url).then(done, () => window.prompt(label, url));
}

const pill = 'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-15 font-strong no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/** Send a page on WhatsApp (in its own green), or copy its link: an album, a notice. */
export function ShareLinks({ title, url, labels }: { title: string; url: string; labels: { share: string; copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap gap-2.5 lg:justify-end">
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title}: ${url}`)}`} target="_blank" rel="noopener noreferrer" className={cn(pill, 'bg-whatsapp-brand text-ink hover:bg-whatsapp-brand-deep')}>
        <Icon name="whatsapp-logo" />
        {labels.share}
      </a>
      <button type="button" onClick={() => copyLink(url, labels.copy, () => setCopied(true))} className={cn(pill, 'border-[1.5px] border-line-strong bg-transparent text-ink hover:bg-ink/5')}>
        <Icon name="link-simple" />
        <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
      </button>
    </div>
  );
}
