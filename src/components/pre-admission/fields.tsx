'use client';

import { useState } from 'react';
import { Bus, Check, Info, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { RadioGroup, RadioGroupItem } from '@/components/shadcn/radio-group';
import { Textarea } from '@/components/shadcn/textarea';
import type { Age } from '@/lib/admissions/age';
import { tickChoice, type AnswerValue, type FileAnswer } from '@/lib/admissions/answers';
import { num, taka, txt, type Locale } from '@/lib/admissions/display';
import { FILE_MISSING, NO_ROUTE, type FormField, type Transport } from '@/lib/admissions/form-config';
import { findStop } from '@/lib/admissions/transport';
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
  /** Class field: the classes that fit the age, those the answers so far rule out, and whether the chosen one has an unmet requirement. */
  classFit?: { fits: string[]; age: Age | null; blocked?: string[]; unmet?: boolean };
  /** Date of birth: year range offered. */
  years?: number[];
  /** Transport stop questions: the routes the options belong to. */
  transport?: Transport;
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
  // Uploads and the stop question explain themselves before the control (upload box and its
  // "don't have it now" tick box; the stop list and the chosen route under it).
  const helpFirst = field.type === 'file' || field.type === 'transportStop';
  const helpAbove = help && (
    <p id={helpId} className="-mt-1.5 mb-2 text-[14px] font-[450] leading-normal text-muted-foreground">
      {help}
    </p>
  );
  const footer = (
    <>
      {help && !helpFirst && (
        <p id={helpId} className="mt-1.5 text-[14px] font-[450] leading-normal text-muted-foreground">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-[14px] font-[450] leading-normal text-destructive">
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
      {helpFirst && helpAbove}
      {control}
      {footer}
    </div>
  );
}

function Control({ field, value, locale, error, onChange, onBlur, classFit, years, transport, describedBy }: FieldProps & { describedBy?: string }) {
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
    case 'checkbox':
      return <Checkboxes id={id} field={field} value={value} locale={locale} error={error} onChange={onChange} onBlur={onBlur} />;
    case 'file': {
      const file = value && typeof value === 'object' && !Array.isArray(value) ? (value as FileAnswer) : undefined;
      const missing = !file && !!field.allowMissing && value === FILE_MISSING;
      return (
        <>
          {missing ? (
            <div role="status" className="flex gap-2.5 rounded-lg border bg-card p-3 text-sm leading-[1.6]">
              <Info className="mt-[3px] size-4 flex-none text-muted-foreground" aria-hidden />
              <span>{txt(field.missingNote, locale) || txt(field.missingLabel, locale)}</span>
            </div>
          ) : (
            <FileField field={field} value={file} locale={locale} error={error} describedBy={describedBy} onUploaded={(f) => onChange(f)} />
          )}
          {field.allowMissing && !file && (
            <label className="mt-1 flex cursor-pointer items-start gap-2.5 py-2 text-[14.5px] leading-normal">
              <Checkbox
                id={missing ? id : undefined}
                checked={missing}
                className="mt-0.5 size-[18px] bg-card shadow-none"
                onCheckedChange={(checked) => {
                  onChange(checked === true ? FILE_MISSING : '');
                  onBlur();
                }}
              />
              {txt(field.missingLabel, locale)}
            </label>
          )}
        </>
      );
    }
    case 'transportStop':
      return <StopSelect common={common} field={field} value={asString(value)} locale={locale} transport={transport} onChange={onChange} onBlur={onBlur} />;
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

/**
 * Checkboxes. An option marked "only this choice" (none of the above) clears the others when
 * ticked, and is cleared when another is ticked; a note says so when choices were cleared.
 */
function Checkboxes({ id, field, value, locale, error, onChange, onBlur }: { id: string; field: FormField; value: AnswerValue | undefined; locale: Locale; error: string | null; onChange: (v: string[] | '') => void; onBlur: () => void }) {
  const t = useTranslations('preAdmission.chapter');
  const [note, setNote] = useState('');
  const selected = Array.isArray(value) ? value : [];
  const exclusive = field.options.some((o) => o.exclusive);
  return (
    <>
      {exclusive && <p className="mb-1 text-[14px] font-[450] leading-normal text-muted-foreground">{t('several')}</p>}
      <div className={cn('flex flex-wrap gap-x-[22px]', exclusive && 'flex-col')}>
        {field.options.map((o, i) => (
          <label key={o.value} className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-[15px] md:min-h-[34px] md:text-[14.5px]">
            <Checkbox
              id={i === 0 ? id : undefined}
              checked={selected.includes(o.value)}
              aria-invalid={!!error || undefined}
              className="size-[18px] bg-card shadow-none"
              onCheckedChange={(checked) => {
                const next = checked ? tickChoice(field, selected, o.value) : selected.filter((v) => v !== o.value);
                setNote(checked && o.exclusive && selected.some((v) => v !== o.value) ? t('exclusiveCleared', { option: txt(o.label, locale) }) : '');
                onChange(next.length ? field.options.map((x) => x.value).filter((v) => next.includes(v)) : '');
                onBlur();
              }}
            />
            {txt(o.label, locale)}
          </label>
        ))}
      </div>
      {exclusive && (
        <p aria-live="polite" className="mt-1.5 flex min-h-[21px] items-start gap-2 text-[13.5px] leading-[1.55] text-muted-foreground">
          {note && (
            <>
              <Info className="mt-[3px] size-[15px] flex-none" aria-hidden />
              <span>{note}</span>
            </>
          )}
        </p>
      )}
    </>
  );
}

/** Nearest stop: one native select grouped by route, then "my area is not on any route". */
function StopSelect({ common, field, value, locale, transport, onChange, onBlur }: { common: Common; field: FormField; value: string; locale: Locale; transport?: Transport; onChange: (v: string) => void; onBlur: () => void }) {
  const t = useTranslations('preAdmission');
  const chosen = findStop(transport, value);
  const vehicleOf = (key: string) => transport?.vehicles.find((v) => v.key === key);
  const fee = (monthly: number | undefined) => (monthly != null ? taka(monthly, locale) : null);
  const summary = chosen
    ? fee(chosen.vehicle?.monthly)
      ? t('transport.summary', { route: txt(chosen.route.name, locale), vehicle: txt(chosen.vehicle?.name, locale), fee: fee(chosen.vehicle?.monthly)! })
      : t('transport.summaryNoFee', { route: txt(chosen.route.name, locale), vehicle: txt(chosen.vehicle?.name, locale) })
    : null;
  const none = field.options.find((o) => o.value === NO_ROUTE);
  return (
    <>
      <select
        {...common}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onBlur();
        }}
        className={cn(
          'h-11 w-full rounded-lg border border-input bg-card pl-2.5 pr-2 text-base outline-none focus:border-primary focus:ring-[3px] focus:ring-ring aria-invalid:border-destructive md:max-w-[440px]',
          !value && 'text-muted-foreground',
        )}
      >
        <option value="">{t('chapter.select')}</option>
        {transport?.routes.map((r) => {
          const monthly = fee(vehicleOf(r.vehicle)?.monthly);
          return (
            <optgroup key={r.key} label={monthly ? t('transport.routeOption', { route: txt(r.name, locale), fee: monthly }) : txt(r.name, locale)} className="text-foreground">
              {r.stops.map((s) => (
                <option key={s.key} value={`${r.key}:${s.key}`} className="text-foreground">
                  {txt(s.name, locale)}
                </option>
              ))}
            </optgroup>
          );
        })}
        {none && (
          <option value={NO_ROUTE} className="text-foreground">
            {txt(none.label, locale)}
          </option>
        )}
      </select>
      {summary && (
        <p className="mt-2 flex items-center gap-2 text-[13.5px]">
          <Bus className="size-4 flex-none text-muted-foreground" aria-hidden />
          <span>{summary}</span>
        </p>
      )}
    </>
  );
}

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
export function DateSelect({ id, value, locale, years, invalid, onChange, onBlur }: { id: string; value: string; locale: Locale; years?: number[]; invalid: boolean; onChange: (v: string) => void; onBlur: () => void }) {
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
  const blocked = fit?.blocked ?? [];
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
        {field.options.map((o, i) => {
          // A class the answers so far rule out cannot be chosen (one already chosen stays, with the message on the other question).
          const ruledOut = blocked.includes(o.value) && value !== o.value;
          const warn = blocked.includes(o.value) || (value === o.value && !!fit?.unmet);
          const notes = (o.requires ?? []).map((r) => txt(r.message, locale)).join(' · ');
          return (
          <label
            key={o.value}
            className={cn(
              'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-card px-3.5 py-2 text-[15px]',
              value === o.value && 'border-primary ring-1 ring-primary',
              invalid && !value && 'border-destructive',
              ruledOut && 'cursor-not-allowed opacity-60',
            )}
          >
            <RadioGroupItem id={i === 0 ? `f-${field.key}` : undefined} value={o.value} disabled={ruledOut} className="size-[18px] shadow-none" />
            <span className="flex flex-1 flex-col">
              {txt(o.label, locale)}
              {notes && <span className={cn('text-[12.5px] leading-snug', warn ? 'text-warning' : 'text-muted-foreground')}>{notes}</span>}
            </span>
            {fits.includes(o.value) && !blocked.includes(o.value) ? (
              <span className="text-[12.5px] text-success">{t('classFits')}</span>
            ) : o.special ? (
              <span className="text-[12.5px] text-muted-foreground">{t('classSpecial')}</span>
            ) : null}
          </label>
          );
        })}
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
