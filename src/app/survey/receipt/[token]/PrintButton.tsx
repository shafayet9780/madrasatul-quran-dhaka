'use client';

import { Icon } from '@/components/survey/ui';

export function PrintButton() {
  return (
    <button type="button" className="sv-cta" onClick={() => window.print()}>
      {Icon.download()}
      PDF ডাউনলোড
    </button>
  );
}
