'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { startApplication, type StartState } from '@/app/[locale]/pre-admission/actions';
import { emailSuggestion, normaliseEmail, normaliseMobile } from '@/lib/admissions/normalise';
import { cn } from '@/lib/utils';

export function StartForm({ locale }: { locale: string }) {
  const t = useTranslations('preAdmission');
  const [state, action, pending] = useActionState<StartState, FormData>(startApplication.bind(null, locale), {});
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState({ mobile: false, email: false });
  const [attribution, setAttribution] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) if (params.get(k)) found[k] = params.get(k)!;
    if (document.referrer && !document.referrer.startsWith(window.location.origin)) found.referrer = document.referrer;
    setAttribution(found);
  }, []);

  useEffect(() => {
    if (state.message) errorRef.current?.focus();
  }, [state]);

  const mobileOk = normaliseMobile(mobile) !== null;
  const mobileError = (touched.mobile && mobile && !mobileOk) || state.errors?.mobile ? t('start.invalid_mobile') : null;
  const emailError = (touched.email && email && !normaliseEmail(email)) || state.errors?.email ? t('start.invalid_email') : null;
  const suggestion = touched.email ? emailSuggestion(email) : null;

  return (
    <form action={action} noValidate className="flex flex-col gap-6 md:gap-5 md:rounded-xl md:border md:bg-card md:p-6">
      {Object.entries(attribution).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {state.message && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-lg border bg-card px-3 py-2.5 text-[13.5px] leading-normal text-destructive outline-none">
          {state.message === 'closed' ? t('start.closed') : t(state.message)}
        </p>
      )}

      <div>
        <Label htmlFor="mobile" className="mb-2 text-sm font-medium">
          {t('start.mobileLabel')} <span className="text-destructive" aria-hidden>*</span>
        </Label>
        <div
          className={cn(
            'flex h-11 overflow-hidden rounded-lg border border-input bg-card focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring',
            mobileError && 'border-destructive',
          )}
        >
          <span className="flex items-center border-r bg-muted px-3 text-[15px] text-muted-foreground" aria-hidden>
            +880
          </span>
          <input
            id="mobile"
            name="mobile"
            inputMode="tel"
            autoComplete="tel-national"
            required
            aria-required
            aria-invalid={!!mobileError}
            aria-describedby="mobile-help"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            onBlur={() => setTouched((s) => ({ ...s, mobile: true }))}
            className="min-w-0 flex-1 bg-transparent px-3 text-base outline-none"
          />
          {mobileOk && (
            <span className="flex items-center px-3 text-success">
              <Check className="size-[18px]" strokeWidth={2.4} aria-label={t('start.mobileValid')} />
            </span>
          )}
        </div>
        <p id="mobile-help" className={cn('mt-1.5 text-[13px] leading-normal', mobileError ? 'text-destructive' : 'text-muted-foreground')}>
          {mobileError ?? t('start.mobileHelp')}
        </p>
      </div>

      <div>
        <Label htmlFor="email" className="mb-2 text-sm font-medium">
          {t('start.emailLabel')} <span className="text-destructive" aria-hidden>*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'email-error' : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, email: true }))}
          className="h-11 rounded-lg bg-card px-3 text-base shadow-none md:text-base"
        />
        {emailError && (
          <p id="email-error" className="mt-1.5 text-[13px] text-destructive">
            {emailError}
          </p>
        )}
        {suggestion && (
          <div className="mt-2 flex items-center justify-between gap-2.5 text-[13.5px]">
            <span className="text-muted-foreground">
              {t.rich('start.emailSuggest', { email: suggestion, b: (c) => <b className="font-semibold text-foreground">{c}</b> })}
            </span>
            <Button type="button" variant="outline" size="sm" className="h-9 shadow-none" onClick={() => setEmail(suggestion)}>
              {t('start.emailFix')}
            </Button>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-1.5 border-t bg-card px-4 pb-5 pt-3 md:static md:border-0 md:p-0">
        <Button type="submit" disabled={pending} className="h-11 w-full text-[15px]">
          {pending && <LoaderCircle className="animate-spin" aria-hidden />}
          {t('start.submit')}
        </Button>
        <p className="py-2 text-center text-sm md:hidden">
          <Link href={`/${locale}/pre-admission/find`} className="underline underline-offset-[3px]">
            {t('start.findPrompt')} {t('start.findLink')}
          </Link>
        </p>
      </div>
    </form>
  );
}
