'use client';

import { useActionState, useState } from 'react';
import { LoaderCircle, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { submitApplication, type SubmitState } from '@/app/[locale]/pre-admission/actions';

/** Fee summary, declaration and the pay button (fixed at the bottom on phones). */
export function ReviewSubmit({ locale, fee, evaluationFee, declaration, payLabel }: { locale: string; fee: string; evaluationFee: string; declaration: string; payLabel: string }) {
  const t = useTranslations('preAdmission');
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitApplication.bind(null, locale), {});
  const [agreed, setAgreed] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-3.5 rounded-xl border bg-card p-4 md:p-5">
      <h2 className="text-base font-semibold md:text-[17px]">{t('review.feeTitle')}</h2>
      <div className="flex justify-between gap-3 text-[14.5px]">
        <span>
          {t('review.applicationFee')} <span className="text-[13px] text-muted-foreground">{t('review.nonRefundable')}</span>
        </span>
        <span>{fee}</span>
      </div>
      <div className="flex justify-between gap-3 text-[14.5px] text-muted-foreground">
        <span>{t('review.evaluationFee')}</span>
        <span>{evaluationFee}</span>
      </div>
      <div className="flex justify-between border-t pt-3.5 text-base font-semibold md:text-[17px]">
        <span>{t('review.payNow')}</span>
        <span>{fee}</span>
      </div>

      <label className="flex cursor-pointer items-start gap-3 pt-1">
        <input type="hidden" name="declared" value={agreed ? 'yes' : ''} />
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-1 size-[18px] bg-card shadow-none" aria-describedby="declaration-text" />
        <span id="declaration-text" className="text-sm leading-relaxed md:text-[13.5px]">
          {declaration}
        </span>
      </label>

      {state.message && (
        <p role="alert" className="text-[13.5px] text-destructive">
          {state.message === 'declaration' ? t('review.declarationNeeded') : state.message === 'invalid' ? t('review.incompleteLead') : t(state.message)}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-1.5 border-t bg-card px-4 pb-5 pt-3 md:static md:border-0 md:p-0">
        <Button type="submit" disabled={!agreed || pending} className="h-11 w-full text-[15px]">
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
          {pending ? t('review.submitting') : payLabel}
        </Button>
        {!agreed && <span className="text-center text-[13px] text-muted-foreground">{t('review.declarationNeeded')}</span>}
      </div>
      <p className="text-[13px] leading-relaxed text-muted-foreground md:text-[12.5px]">{t('review.methods')}</p>
    </form>
  );
}
