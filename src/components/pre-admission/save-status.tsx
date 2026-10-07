'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { Check, CloudOff, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const SaveContext = createContext<{ state: SaveState; setState: (s: SaveState) => void }>({ state: 'idle', setState: () => {} });

export function SaveStatusProvider({ children, initial = 'saved' }: { children: ReactNode; initial?: SaveState }) {
  const [state, setState] = useState<SaveState>(initial);
  return <SaveContext.Provider value={{ state, setState }}>{children}</SaveContext.Provider>;
}

export const useSaveStatus = () => useContext(SaveContext);

/** "Saved" / "Saving" / "Not saved, retrying", announced politely to screen readers. */
export function SaveIndicator() {
  const t = useTranslations('preAdmission');
  const { state } = useSaveStatus();
  if (state === 'idle') return null;
  return (
    <span role="status" className="inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
      {state === 'saving' && <LoaderCircle className="size-3.5 animate-spin" aria-hidden />}
      {state === 'saved' && <Check className="size-3.5" strokeWidth={2.4} aria-hidden />}
      {state === 'error' && <CloudOff className="size-3.5 text-warning" aria-hidden />}
      {state === 'saving' ? t('saving') : state === 'saved' ? t('saved') : t('saveFailed')}
    </span>
  );
}
