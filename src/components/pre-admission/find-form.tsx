'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Download, LoaderCircle, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { findApplication, openFound, type FindState, type FoundApplication } from '@/app/[locale]/pre-admission/actions';
import { num, type Locale } from '@/lib/admissions/display';
import { cn } from '@/lib/utils';
import { DateSelect, Required } from './fields';

function Submit({ label, variant = 'default', icon }: { label: string; variant?: 'default' | 'outline'; icon?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={cn('h-11 w-full text-[15px]', variant === 'outline' && 'bg-card shadow-none')}>
      {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : icon}
      {label}
    </Button>
  );
}

function Open({ locale, id, to, label, variant, icon }: { locale: Locale; id: string; to: string; label: string; variant?: 'default' | 'outline'; icon?: React.ReactNode }) {
  return (
    <form action={openFound.bind(null, locale)}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <Submit label={label} variant={variant} icon={icon} />
    </form>
  );
}

function Result({ r, locale, session, fee, deadline, whatsappUrl }: { r: FoundApplication; locale: Locale; session: string; fee: string; deadline: string | null; whatsappUrl: string | null }) {
  const t = useTranslations('preAdmission.find');
  const badge = { paid: { text: t('paid'), cls: 'text-success' }, due: { text: t('due'), cls: 'text-warning' }, draft: { text: t('draft'), cls: 'text-muted-foreground' } }[r.status];
  return (
    <div className="flex flex-col gap-3.5 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          {r.publicRef && <span className="font-[family-name:var(--font-english)] text-[22px] font-bold tracking-[0.02em]">{r.publicRef}</span>}
          <span className="text-[15px] font-medium">{r.studentName}</span>
          <span className="text-[13px] text-muted-foreground">{[r.classLabel, t('session', { session: num(session, locale) })].filter(Boolean).join(', ')}</span>
        </div>
        <span className={cn('inline-flex h-[26px] items-center rounded-lg border bg-card px-2.5 text-[13px] font-medium whitespace-nowrap', badge.cls)}>{badge.text}</span>
      </div>
      {r.status === 'paid' && (
        <div className="flex flex-col gap-2">
          <Open locale={locale} id={r.id} to="pdf" label={t('download')} icon={<Download aria-hidden />} />
          <Open locale={locale} id={r.id} to="status" label={t('openConfirmation')} variant="outline" />
          {whatsappUrl && (
            <Button asChild variant="outline" className="h-11 bg-card text-[15px] shadow-none">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden />
                {t('whatsapp')}
              </a>
            </Button>
          )}
        </div>
      )}
      {r.status === 'due' && (
        <div className="flex flex-col gap-2">
          <p className="text-[13.5px] leading-normal text-muted-foreground">{deadline ? t('dueDeadline', { deadline }) : t('dueNote')}</p>
          <Open locale={locale} id={r.id} to="pay" label={t('pay', { fee })} />
          <Open locale={locale} id={r.id} to="form" label={t('edit')} variant="outline" />
        </div>
      )}
      {r.status === 'draft' && (
        <div className="flex flex-col gap-2">
          <p className="text-[13.5px] leading-normal text-muted-foreground">{t('draftNote')}</p>
          <Open locale={locale} id={r.id} to="form" label={t('continue')} />
        </div>
      )}
    </div>
  );
}

export function FindForm(props: { locale: Locale; session: string; fee: string; deadline: string | null; whatsappUrl: string | null; years: number[] }) {
  const { locale } = props;
  const t = useTranslations('preAdmission');
  const [state, action, pending] = useActionState<FindState, FormData>(findApplication.bind(null, locale), {});
  const [dob, setDob] = useState('');
  // Controlled: React resets uncontrolled fields after each submission, and guardians often retry.
  const [query, setQuery] = useState('');
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (state.results || state.message) resultsRef.current?.focus();
  }, [state]);

  return (
    <>
      <form action={action} noValidate className="flex flex-col gap-[22px]">
        <div>
          <label htmlFor="query" className="mb-2 block text-sm font-medium">
            {t('find.queryLabel')}
            <Required />
          </label>
          <Input
            id="query"
            name="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            aria-invalid={!!state.errors?.query}
            aria-describedby="query-help"
            className="h-11 rounded-lg bg-card px-3 text-base shadow-none md:text-base"
          />
          <p id="query-help" className={cn('mt-1.5 text-[13px] leading-normal', state.errors?.query ? 'text-destructive' : 'text-muted-foreground')}>
            {state.errors?.query ? t('find.invalidQuery') : t.rich('find.queryHelp', { id: (c) => <span className="font-[family-name:var(--font-english)]">{c}</span> })}
          </p>
        </div>
        <fieldset className="min-w-0" aria-describedby="dob-help">
          <legend className="mb-2 text-sm font-medium">
            {t('find.dobLabel')}
            <Required />
          </legend>
          <input type="hidden" name="dob" value={dob} />
          <DateSelect id="dob" value={dob} locale={locale} years={props.years} invalid={!!state.errors?.dob} onChange={setDob} onBlur={() => {}} />
          <p id="dob-help" className={cn('mt-1.5 text-[13px] leading-normal', state.errors?.dob ? 'text-destructive' : 'text-muted-foreground')}>
            {state.errors?.dob ? t('find.invalidDob') : t('find.dobHelp')}
          </p>
        </fieldset>
        <Button type="submit" disabled={pending} className="h-11 text-[15px]">
          {pending && <LoaderCircle className="animate-spin" aria-hidden />}
          {t('find.submit')}
        </Button>
      </form>

      {(state.results || state.message) && (
        <section ref={resultsRef} tabIndex={-1} aria-label={t('find.results')} className="flex flex-col gap-2.5 border-t pt-[22px] outline-none" aria-live="polite">
          {state.message && (
            <p role={state.message === 'none' ? 'status' : 'alert'} className="rounded-xl border bg-card p-4 text-[14.5px] leading-relaxed">
              {state.message === 'none' ? t('find.none') : state.message === 'notConfigured' ? t('find.notConfigured') : t(state.message)}
            </p>
          )}
          {state.results?.map((r) => (
            <Result key={r.id} r={r} {...props} />
          ))}
        </section>
      )}
    </>
  );
}
