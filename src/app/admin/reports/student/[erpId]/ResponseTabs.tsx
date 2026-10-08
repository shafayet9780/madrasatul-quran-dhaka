'use client';

import { Tabs } from 'radix-ui';
import type { ReactNode } from 'react';

/** The three answer sets on the student page; every panel stays mounted so the internal print shows all of them. */
export function ResponseTabs({ tabs }: { tabs: { key: string; label: string; sub: string; content: ReactNode }[] }) {
  return (
    <Tabs.Root defaultValue={tabs[0].key} className="flex flex-col gap-3">
      <Tabs.List className="sv-rtabs" aria-label="কোন রিভিউ">
        {tabs.map((t) => (
          <Tabs.Trigger key={t.key} value={t.key} className="sv-rtab">
            {t.label}
            <small>{t.sub}</small>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((t) => (
        <Tabs.Content key={t.key} value={t.key} forceMount className="flex flex-col gap-3 outline-none">
          {t.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
