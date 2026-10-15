'use client';

import { useState } from 'react';
import { Icon } from '@/components/site/icon';

/** Google's map loads only when asked: nothing from Google on the page until then, and less to download on a phone. */
export function MapOnTap({ src, labels }: { src: string; labels: { show: string; note: string; title: string } }) {
  const [shown, setShown] = useState(false);
  if (shown) {
    // Focus moves to the map, so the keyboard does not fall back to the top of the page when the button goes.
    return <iframe ref={(frame) => frame?.focus()} src={src} title={labels.title} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="min-h-[360px] w-full flex-1 rounded-photo border-0 bg-panel" />;
  }
  return (
    <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-3.5 rounded-photo bg-panel p-6 text-center shadow-[inset_0_0_0_1px_var(--color-line-dark)] sm:min-h-[360px]">
      <Icon name="map-trifold" size={44} className="text-on-dark-faint" />
      <button
        type="button"
        onClick={() => setShown(true)}
        className="inline-flex min-h-11 items-center rounded-full bg-cream px-4 text-15 font-strong text-dark hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-light"
      >
        {labels.show}
      </button>
      <span className="text-13 text-on-dark-muted">{labels.note}</span>
    </div>
  );
}
