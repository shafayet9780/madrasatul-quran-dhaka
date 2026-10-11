'use client';

import Link from 'next/link';
import { ChevronRight, Circle, CircleCheck, Contrast, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Step } from '@/lib/admissions/pages';
import { cn } from '@/lib/utils';

/** Desktop rail: the guardian's steps, then the review (locked until every step is done). */
export function StepRail({ steps, index, reviewHref, onNavigate }: { steps: Step[]; index: number; reviewHref: string; onNavigate?: () => void }) {
  const t = useTranslations('preAdmission');
  const reviewOpen = steps.every((s) => s.status === 'done');
  return (
    <nav aria-label={t('hub.chapters')} className="sticky top-26 hidden w-[220px] flex-none flex-col gap-0.5 lg:flex">
      <span className="px-2.5 pb-2 text-[12.5px] text-muted-foreground">{t('chapter.chapterLabel')}</span>
      {steps.map((c, i) => (
        <Link
          key={c.key}
          href={c.href}
          aria-current={i === index ? 'step' : undefined}
          onClick={onNavigate}
          className={cn('flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground', i === index && 'bg-muted font-medium text-foreground')}
        >
          {c.status === 'done' && i !== index ? (
            <CircleCheck className="size-4 text-success" aria-hidden />
          ) : i === index || c.status === 'in_progress' ? (
            <Contrast className="size-4 text-primary" aria-hidden />
          ) : (
            <Circle className="size-4 text-input" aria-hidden />
          )}
          {c.title}
        </Link>
      ))}
      {reviewOpen ? (
        <Link href={reviewHref} onClick={onNavigate} className="mt-1.5 flex items-center gap-2.5 border-t px-2.5 pt-3.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronRight className="size-4" aria-hidden />
          {t('hub.review')}
        </Link>
      ) : (
        <span className="mt-1.5 flex items-center gap-2.5 border-t px-2.5 pt-3.5 text-sm text-muted-foreground">
          <Lock className="size-4" aria-hidden />
          {t('hub.review')}
        </span>
      )}
    </nav>
  );
}
