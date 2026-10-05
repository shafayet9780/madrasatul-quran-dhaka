'use client';

import { Icon, SaveChip, type SaveState } from '@/components/survey/ui';
import { batchLabel } from '@/lib/survey/labels';
import type { BatchKeyInput } from '@/lib/survey/t1-types';
import type { T1Config } from './types';

const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' });

/** Desktop header bar (T1-Rate-Desktop / T1-Review-Desktop). */
export function DeskHeader({
  config,
  teacherName,
  batchKey,
  saveState,
}: {
  config: T1Config;
  teacherName: string;
  batchKey: BatchKeyInput;
  saveState?: SaveState;
}) {
  return (
    <header className="sv-desk-header">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="sv-logo" aria-hidden="true">
            ম
          </div>
          <div className="flex flex-col" style={{ lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{config.snapshot.template.title}</span>
            <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
              {config.label} · শেষ {dayMonth.format(new Date(config.closesAt))}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4" style={{ marginLeft: 'auto', fontSize: 14 }}>
          <span style={{ fontWeight: 600 }}>{batchLabel(config.snapshot, batchKey)}</span>
          <span style={{ color: 'var(--sv-text-muted)' }}>{teacherName}</span>
          {saveState && (
            <span aria-live="polite">
              <SaveChip state={saveState} />
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

/** Offline and round-closed notices shared by the rating and review screens. */
export function StatusBanners({ saveState, closed, stale = false }: { saveState: SaveState; closed: boolean; stale?: boolean }) {
  return (
    <div role="status" style={{ display: saveState === 'offline' || closed || stale ? 'block' : 'none', padding: '12px 16px 0' }}>
      {stale ? (
        <div className="sv-banner is-warn">
          {Icon.warn()}
          <span>
            <b>এই ক্লাস বা বিষয় এই রাউন্ডের তালিকায় আর নেই।</b> আপনার মার্ক এই ফোনে রাখা আছে। ক্লাস বাছাইয়ে ফিরে আবার দেখুন, অথবা অফিসে জানান।
          </span>
        </div>
      ) : closed ? (
        <div className="sv-banner is-info">
          {Icon.clock({ size: 20 })}
          <span>
            <b>এই রাউন্ড বন্ধ হয়ে গেছে।</b> আপনার খসড়া সংরক্ষিত আছে। অ্যাডমিন সময় বাড়ালে এই লিংক থেকেই জমা দিতে পারবেন।
          </span>
        </div>
      ) : saveState === 'offline' ? (
        <div className="sv-banner is-warn">
          {Icon.offline({ size: 20 })}
          <span>
            <b>ইন্টারনেট সংযোগ নেই।</b> আপনার মার্ক এই ফোনে রাখা আছে; সংযোগ ফিরলে নিজে থেকেই সংরক্ষিত হবে। পেজ বন্ধ করবেন না।
          </span>
        </div>
      ) : null}
    </div>
  );
}
