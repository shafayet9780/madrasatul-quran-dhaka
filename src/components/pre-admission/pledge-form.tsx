'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { pledgeAnswer } from '@/app/[locale]/pre-admission/actions';
import { num, type Locale } from '@/lib/admissions/display';
import type { Step } from '@/lib/admissions/pages';
import type { Pledge } from '@/lib/admissions/pledge';
import { cn } from '@/lib/utils';
import { SaveIndicator, useSaveStatus } from './save-status';
import { StepRail } from './step-rail';

type Props = {
  locale: Locale;
  steps: Step[];
  index: number;
  intro: string;
  groups: { title: string; rules: { n: string; text: string }[] }[];
  pledge: string;
  declaration: string;
  initial: Record<Pledge, boolean>;
  prevHref: string;
  reviewHref: string;
};

/** The rules in their groups, then the two pledges; each tick is saved at once with its time. */
export function PledgeForm({ locale, steps, index, intro, groups, pledge, declaration, initial, prevHref, reviewHref }: Props) {
  const t = useTranslations('preAdmission');
  const router = useRouter();
  const { state: saveState, setState: setSave } = useSaveStatus();
  const [agreed, setAgreed] = useState(initial);
  // Saves still on their way: two quick ticks are two saves, and the first may finish before the second.
  const [pending, setPending] = useState(0);
  const left = Number(!agreed.conduct) + Number(!agreed.family);
  // The review opens only once both ticks are stored (it checks them on the server).
  const ready = left === 0 && pending === 0 && saveState !== 'saving' && saveState !== 'error';
  const hint = left === 0 ? t('pledge.hintDone') : left === 2 ? t('pledge.hintBoth') : t('pledge.hintOne');
  // The rail shows this step's state as ticked here, before the server page is reloaded.
  const shownSteps = steps.map((s, i) => (i === index ? { ...s, status: left === 0 ? ('done' as const) : left === 2 ? ('not_started' as const) : ('in_progress' as const) } : s));

  async function tick(which: Pledge, value: boolean) {
    setAgreed((a) => ({ ...a, [which]: value }));
    setSave('saving');
    setPending((n) => n + 1);
    const result = await pledgeAnswer(which, value).catch(() => ({ ok: false as const, reason: 'failed' as const }));
    setPending((n) => n - 1);
    if (result.ok) return setSave('saved');
    if (result.reason === 'expired') return router.replace(`/${locale}/pre-admission/start`);
    if (result.reason === 'locked') return router.replace(`/${locale}/pre-admission/status`);
    setAgreed((a) => ({ ...a, [which]: !value }));
    setSave('error');
  }

  const box = (which: Pledge, text: string, strong?: boolean) => (
    <label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-3.5 text-[14.5px] leading-[1.7] md:text-[15px]', strong && 'border-2 border-foreground')}>
      <Checkbox checked={agreed[which]} onCheckedChange={(v) => void tick(which, v === true)} className="mt-1 size-[18px] bg-card shadow-none" />
      <span>{text}</span>
    </label>
  );

  return (
    <>
      <div className="sticky top-14 z-20 flex flex-col gap-1.5 border-b bg-card px-4 pb-3 pt-2.5 md:hidden">
        <span className="text-[12.5px] text-muted-foreground">{t('chapter.of', { n: num(index + 1, locale), total: num(steps.length, locale) })}</span>
        <div className="h-1 rounded-full bg-muted">
          <div className="h-1 rounded-full bg-primary transition-[width]" style={{ width: `${(2 - left) * 50}%` }} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1240px] items-start gap-12 px-4 pb-32 pt-6 md:px-8 md:pb-18 md:pt-10">
        <StepRail steps={shownSteps} index={index} reviewHref={reviewHref} />

        <main className="min-w-0 flex-1">
          <div className="flex max-w-[760px] flex-col gap-1.5 pb-4 md:pb-6">
            <span className="hidden text-[13.5px] text-muted-foreground md:block">{t('chapter.of', { n: num(index + 1, locale), total: num(steps.length, locale) })}</span>
            <h1 className="text-[22px] font-bold leading-[1.4] tracking-[-0.01em] md:text-[28px] md:leading-[1.3] md:tracking-[-0.015em]">{t('pledge.heading')}</h1>
            {intro && <p className="text-[14.5px] leading-[1.65] text-muted-foreground md:text-[15px] md:leading-[1.7]">{intro}</p>}
          </div>

          {groups.map((g, gi) => (
            <section key={gi} className="flex flex-col gap-2.5 border-t py-5 md:flex-row md:flex-wrap md:gap-x-10 md:py-8">
              <h2 className="text-[15px] font-semibold md:max-w-[260px] md:flex-[1_1_200px] md:text-base">{g.title}</h2>
              <ol className="flex flex-col gap-3 md:flex-[999_1_420px]">
                {g.rules.map((r) => (
                  <li key={r.n} className="grid grid-cols-[24px_1fr] gap-1 text-[14.5px] leading-[1.7] md:text-[15px]">
                    <b className="font-semibold text-muted-foreground" aria-hidden>
                      {r.n}
                    </b>
                    <span>{r.text}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          <section className="flex flex-col gap-3 border-t pb-2 pt-5 md:flex-row md:flex-wrap md:gap-x-10 md:py-8">
            <div className="md:max-w-[260px] md:flex-[1_1_200px]">
              <h2 className="text-[15px] font-semibold md:text-base">{t('pledge.pledgesTitle')}</h2>
              <p className="mt-1 hidden text-[13px] leading-normal text-muted-foreground md:block">{t('pledge.pledgesLead')}</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-[999_1_420px]">
              {box('conduct', pledge)}
              {box('family', declaration, true)}
              <p className="text-[13px] leading-[1.6] text-muted-foreground md:text-[13.5px]">{t('pledge.printNote')}</p>
            </div>
          </section>

          <div className="hidden items-center justify-between gap-4 border-t pt-6 md:flex">
            <Button asChild variant="outline" className="h-11 bg-card shadow-none">
              <Link href={prevHref}>{t('pledge.previous')}</Link>
            </Button>
            <span className="flex items-center gap-4">
              <span aria-live="polite" className="text-[13.5px] text-muted-foreground">
                {hint}
              </span>
              {ready ? (
                <Button asChild className="h-11 px-[18px] text-[15px]">
                  <Link href={reviewHref}>{t('hub.review')}</Link>
                </Button>
              ) : (
                <Button className="h-11 px-[18px] text-[15px]" disabled>
                  {t('hub.review')}
                </Button>
              )}
            </span>
          </div>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t bg-card px-4 pb-5 pt-3 md:hidden">
        <span aria-live="polite" className="text-[13.5px] text-muted-foreground">
          {saveState === 'error' ? <SaveIndicator /> : hint}
        </span>
        {ready ? (
          <Button asChild className="h-11 px-4 text-[15px]">
            <Link href={reviewHref}>
              {t('pledge.toReview')} <ChevronRight aria-hidden />
            </Link>
          </Button>
        ) : (
          <Button className="h-11 px-4 text-[15px]" disabled>
            {t('pledge.toReview')} <ChevronRight aria-hidden />
          </Button>
        )}
      </div>
    </>
  );
}
