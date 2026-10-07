'use client';

import { useState } from 'react';
import { Check, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { RadioGroup, RadioGroupItem } from '@/components/shadcn/radio-group';
import { Textarea } from '@/components/shadcn/textarea';
import type { Age } from '@/lib/admissions/age';
import type { AnswerValue, FileAnswer } from '@/lib/admissions/answers';
import { num, txt, type Locale } from '@/lib/admissions/display';
import type { FormField } from '@/lib/admissions/form-config';
import { emailSuggestion, normaliseMobile } from '@/lib/admissions/normalise';
import { cn } from '@/lib/utils';
import { FileField } from './file-field';

export type FieldProps = {
  field: FormField;
  value: AnswerValue | undefined;
  locale: Locale;
  error: string | null;
  onChange: (value: AnswerValue | '') => void;
  onBlur: () => void;
  /** Class field: options that fit the child's age, and the age itself. */
  classFit?: { fits: string[]; age: Age | null };
  /** Date of birth: year range offered. */
  years?: number[];
};

const inputClass = 'h-11 rounded-lg bg-card px-3 text-base shadow-none md:text-base';
const asString = (v: AnswerValue | undefined) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '');

export function Required() {
  const t = useTranslations('preAdmission');
  return (
    <>
      {' '}
      <span className="text-destructive" aria-hidden>
        *
      </span>
      <span className="sr-only">({t('required')})</span>
    </>
  );
}

/** Label, control, help and error for one field. */
export function FieldBlock(props: FieldProps) {
  const { field, locale, error } = props;
  const id = `f-${field.key}`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const help = txt(field.help, locale);
  const describedBy = [error && errorId, help && helpId].filter(Boolean).join(' ') || undefined;
  const grouped = ['radio', 'checkbox', 'yesno', 'date'].includes(field.type) || field.role === 'classApplied';
  const label = (
    <>
      {txt(field.label, locale)}
      {field.required && <Required />}
    </>
  );

  const control = <Control {...props} describedBy={describedBy} />;
  const footer = (
    <>
      {help && (
        <p id={helpId} className="mt-1.5 text-[13px] leading-normal text-muted-foreground">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] leading-normal text-destructive">
          {error}
        </p>
      )}
    </>
  );

  if (grouped) {
    return (
      <fieldset id={`${id}-group`} className="min-w-0 scroll-mt-28" aria-describedby={describedBy}>
        <legend className="mb-1 text-sm font-medium leading-[1.45]">{label}</legend>
        {control}
        {footer}
      </fieldset>
    );
  }
  return (
    <div id={`${id}-group`} className="min-w-0 scroll-mt-28">
      {field.type === 'file' ? (
        <span className="mb-2 block text-sm font-medium leading-[1.45]">{label}</span>
      ) : (
        <label htmlFor={id} className="mb-2 block text-sm font-medium leading-[1.45]">
          {label}
        </label>
      )}
      {control}
      {footer}
    </div>
  );
}

function Control({ field, value, locale, error, onChange, onBlur, classFit, years, describedBy }: FieldProps & { describedBy?: string }) {
  const t = useTranslations('preAdmission.chapter');
  const id = `f-${field.key}`;
  const common = { id, 'aria-invalid': !!error || undefined, 'aria-describedby': describedBy, 'aria-required': field.required || undefined };
  const placeholder = txt(field.placeholder, locale) || undefined;

  if (field.role === 'classApplied') {
    return <ClassChoice field={field} value={asString(value)} locale={locale} fit={classFit} onChange={onChange} onBlur={onBlur} invalid={!!error} />;
  }

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          {...common}
          value={asString(value)}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="min-h-24 rounded-lg bg-card px-3 py-2.5 text-base shadow-none md:text-base"
        />
      );
    case 'tel':
      return <MobileInput common={common} value={asString(value)} error={!!error} onChange={onChange} onBlur={onBlur} />;
    case 'email':
      return <EmailInput common={common} value={asString(value)} onChange={onChange} onBlur={onBlur} />;
    case 'number':
      return <Input {...common} inputMode="numeric" value={asString(value)} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className={cn(inputClass, 'max-w-40')} />;
    case 'date':
      return <DateSelect id={id} value={asString(value)} locale={locale} years={years} invalid={!!error} onChange={onChange} onBlur={onBlur} />;
    case 'select':
      return (
        <select
          {...common}
          value={asString(value)}
          onChange={(e) => {
            onChange(e.target.value);
            onBlur();
          }}
          className={cn(
            'h-11 w-full rounded-lg border border-input bg-card pl-2.5 pr-2 text-base outline-none focus:border-primary focus:ring-[3px] focus:ring-ring aria-invalid:border-destructive md:max-w-[360px]',
            !value && 'text-muted-foreground',
          )}
        >
          <option value="">{placeholder ?? t('select')}</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value} className="text-foreground">
              {txt(o.label, locale)}
            </option>
          ))}
        </select>
      );
    case 'radio':
    case 'yesno': {
      const options = field.type === 'yesno' ? [{ value: 'yes', label: t('yes') }, { value: 'no', label: t('no') }] : field.options.map((o) => ({ value: o.value, label: txt(o.label, locale) }));
      return (
        <RadioGroup
          value={asString(value)}
          onValueChange={(v) => {
            onChange(v);
            onBlur();
          }}
          aria-invalid={!!error || undefined}
          className="flex flex-wrap gap-x-[22px] gap-y-0"
        >
          {options.map((o, i) => (
            <label key={o.value} className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-[15px] md:min-h-[34px] md:text-[14.5px]">
              <RadioGroupItem id={i === 0 ? id : undefined} value={o.value} className="size-[18px] bg-card shadow-none" aria-invalid={!!error || undefined} />
              {o.label}
            </label>
          ))}
        </RadioGroup>
      );
    }
    case 'checkbox': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-x-[22px]">
          {field.options.map((o, i) => (
            <label key={o.value} className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-[15px] md:min-h-[34px] md:text-[14.5px]">
              <Checkbox
                id={i === 0 ? id : undefined}
                checked={selected.includes(o.value)}
                aria-invalid={!!error || undefined}
                className="size-[18px] bg-card shadow-none"
                onCheckedChange={(checked) => {
                  const next = checked ? [...selected, o.value] : selected.filter((v) => v !== o.value);
                  onChange(next.length ? field.options.map((x) => x.value).filter((v) => next.includes(v)) : '');
                  onBlur();
                }}
              />
              {txt(o.label, locale)}
            </label>
          ))}
        </div>
      );
    }
    case 'file':
      return (
        <FileField
          field={field}
          value={value && typeof value === 'object' && !Array.isArray(value) ? (value as FileAnswer) : undefined}
          locale={locale}
          error={error}
          describedBy={describedBy}
          onUploaded={(file) => onChange(file)}
        />
      );
    default:
      return (
        <Input
          {...common}
          value={asString(value)}
          placeholder={placeholder}
          lang={/english/i.test(field.label.bengali) || /^[A-Za-z]/.test(field.label.bengali) ? 'en' : undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={inputClass}
        />
      );
  }
}

type Common = { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string; 'aria-required'?: boolean };

function MobileInput({ common, value, error, onChange, onBlur }: { common: Common; value: string; error: boolean; onChange: (v: string) => void; onBlur: () => void }) {
  const ok = !!value && normaliseMobile(value) !== null;
  return (
    <div
      className={cn(
        'flex h-11 overflow-hidden rounded-lg border border-input bg-card focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring',
        error && 'border-destructive',
      )}
    >
      <span className="flex items-center border-r bg-muted px-3 text-[15px] text-muted-foreground" aria-hidden>
        +880
      </span>
      <input {...common} inputMode="tel" autoComplete="tel-national" value={value.replace(/^880/, '0')} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className="min-w-0 flex-1 bg-transparent px-3 text-base outline-none" />
      {ok && (
        <span className="flex items-center px-3 text-success">
          <Check className="size-[18px]" strokeWidth={2.4} aria-hidden />
        </span>
      )}
    </div>
  );
}

function EmailInput({ common, value, onChange, onBlur }: { common: Common; value: string; onChange: (v: string) => void; onBlur: () => void }) {
  const t = useTranslations('preAdmission.start');
  const [blurred, setBlurred] = useState(false);
  const suggestion = blurred ? emailSuggestion(value) : null;
  return (
    <>
      <Input
        {...common}
        type="email"
        inputMode="email"
        autoComplete="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          setBlurred(true);
          onBlur();
        }}
        className={inputClass}
      />
      {suggestion && (
        <div className="mt-2 flex items-center justify-between gap-2.5 text-[13.5px]">
          <span className="text-muted-foreground">{t.rich('emailSuggest', { email: suggestion, b: (c) => <b className="font-semibold text-foreground">{c}</b> })}</span>
          <button type="button" className="h-9 rounded-lg border bg-card px-3 text-sm font-medium" onClick={() => onChange(suggestion)}>
            {t('emailFix')}
          </button>
        </div>
      )}
    </>
  );
}

/** Day / month / year selects (no fiddly date picker on phones); the value is YYYY-MM-DD once complete. */
function DateSelect({ id, value, locale, years, invalid, onChange, onBlur }: { id: string; value: string; locale: Locale; years?: number[]; invalid: boolean; onChange: (v: string) => void; onBlur: () => void }) {
  const t = useTranslations('preAdmission.chapter');
  const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const [parts, setParts] = useState({ d: parsed ? String(+parsed[3]) : '', m: parsed ? String(+parsed[2]) : '', y: parsed?.[1] ?? '' });
  const now = new Date().getFullYear();
  const yearList = years ?? Array.from({ length: 91 }, (_, i) => now + 1 - i);
  const months = t('months').split('|');

  function set(part: 'd' | 'm' | 'y', v: string) {
    const next = { ...parts, [part]: v };
    setParts(next);
    if (next.d && next.m && next.y) {
      const iso = `${next.y}-${next.m.padStart(2, '0')}-${next.d.padStart(2, '0')}`;
      onChange(iso);
      onBlur();
    } else if (value) onChange('');
  }

  const select = (part: 'd' | 'm' | 'y', label: string, options: { v: string; t: string }[], first?: boolean) => (
    <select
      id={first ? id : undefined}
      aria-label={label}
      aria-invalid={invalid || undefined}
      value={parts[part]}
      onChange={(e) => set(part, e.target.value)}
      className={cn('h-11 w-full min-w-0 rounded-lg border border-input bg-card pl-2.5 pr-1 text-base outline-none focus:border-primary focus:ring-[3px] focus:ring-ring aria-invalid:border-destructive', !parts[part] && 'text-muted-foreground')}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.v} value={o.v} className="text-foreground">
          {o.t}
        </option>
      ))}
    </select>
  );

  return (
    <div className="grid max-w-[420px] grid-cols-[0.8fr_1.3fr_1fr] gap-2">
      {select('d', t('day'), Array.from({ length: 31 }, (_, i) => ({ v: String(i + 1), t: num(i + 1, locale) })), true)}
      {select('m', t('month'), months.map((m, i) => ({ v: String(i + 1), t: m })))}
      {select('y', t('year'), yearList.map((y) => ({ v: String(y), t: num(y, locale) })))}
    </div>
  );
}

/** Class choice as bordered radio cards, with the classes that fit the child's age marked. */
function ClassChoice({ field, value, locale, fit, onChange, onBlur, invalid }: { field: FormField; value: string; locale: Locale; fit?: FieldProps['classFit']; onChange: (v: string) => void; onBlur: () => void; invalid: boolean }) {
  const t = useTranslations('preAdmission.chapter');
  const fits = fit?.fits ?? [];
  const mismatch = !!value && fits.length > 0 && !fits.includes(value);
  return (
    <>
      <RadioGroup
        value={value}
        onValueChange={(v) => {
          onChange(v);
          onBlur();
        }}
        className="flex flex-col gap-2"
      >
        {field.options.map((o, i) => (
          <label
            key={o.value}
            className={cn(
              'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-card px-3.5 py-2 text-[15px]',
              value === o.value && 'border-primary ring-1 ring-primary',
              invalid && !value && 'border-destructive',
            )}
          >
            <RadioGroupItem id={i === 0 ? `f-${field.key}` : undefined} value={o.value} className="size-[18px] shadow-none" />
            <span className="flex-1">{txt(o.label, locale)}</span>
            {fits.includes(o.value) ? (
              <span className="text-[12.5px] text-success">{t('classFits')}</span>
            ) : o.special ? (
              <span className="text-[12.5px] text-muted-foreground">{t('classSpecial')}</span>
            ) : null}
          </label>
        ))}
      </RadioGroup>
      {mismatch && (
        <div role="status" className="mt-2.5 flex items-start gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-[13.5px] leading-normal">
          <TriangleAlert className="mt-0.5 size-4 flex-none text-warning" aria-hidden />
          <span>{t('classMismatch')}</span>
        </div>
      )}
    </>
  );
}
