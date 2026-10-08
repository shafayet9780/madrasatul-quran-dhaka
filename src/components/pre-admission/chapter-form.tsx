'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Circle, CircleAlert, CircleCheck, Contrast, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/shadcn/button';
import { saveAnswers } from '@/app/[locale]/pre-admission/actions';
import { ageOn, classesForAge, sessionStart } from '@/lib/admissions/age';
import { checkField, checkSection, isVisible, type AnswerError, type Answers, type AnswerValue, type ChapterStatus } from '@/lib/admissions/answers';
import { num, txt, type Locale } from '@/lib/admissions/display';
import type { FormField, FormSection } from '@/lib/admissions/form-config';
import { cn } from '@/lib/utils';
import { FieldBlock } from './fields';
import { SaveIndicator, useSaveStatus } from './save-status';

export type ChapterNav = { key: string; title: string; status: ChapterStatus; href: string };

type Props = {
  locale: Locale;
  applicationId: string;
  session: string;
  section: FormSection;
  /** Fields of other chapters, for show-when rules and the age hint. */
  otherFields: FormField[];
  index: number;
  chapters: ChapterNav[];
  initialAnswers: Answers;
  hubHref: string;
  reviewHref: string;
  reviewOpen: boolean;
};

type Block = { group?: FormSection['groups'][number]; fields: FormField[] };

/** Ungrouped fields first, then each group (in the order set in Sanity) with all of its fields. */
function blocks(section: FormSection): Block[] {
  const known = new Set(section.groups.map((g) => g.key));
  const loose = section.fields.filter((f) => !f.group || !known.has(f.group));
  return [
    ...(loose.length ? [{ fields: loose }] : []),
    ...section.groups.map((group) => ({ group, fields: section.fields.filter((f) => f.group === group.key) })).filter((b) => b.fields.length),
  ];
}

/** Runs of half-width fields sit side by side on wider screens. */
function rows(fields: FormField[]): FormField[][] {
  const out: FormField[][] = [];
  for (const f of fields) {
    const last = out.at(-1);
    if (f.width === 'half' && last?.[0].width === 'half' && last.length < 2) last.push(f);
    else out.push([f]);
  }
  return out;
}

const PENDING_KEY = (id: string) => `mq-admission-pending:${id}`;

export function ChapterForm({ locale, applicationId, session, section, otherFields, index, chapters, initialAnswers, hubHref, reviewHref, reviewOpen }: Props) {
  const t = useTranslations('preAdmission');
  const router = useRouter();
  const { setState: setSave } = useSaveStatus();
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const pending = useRef<Record<string, unknown>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const chain = useRef<Promise<void>>(Promise.resolve());

  // Autosave: patches are queued, debounced and sent one at a time; failures are kept (also in
  // localStorage, so a closed tab loses nothing) and retried.
  const flush = useCallback((): Promise<void> => {
    clearTimeout(timer.current);
    chain.current = chain.current.then(async () => {
      const patch = pending.current;
      if (!Object.keys(patch).length) return;
      pending.current = {};
      const result = await saveAnswers(patch).catch(() => ({ ok: false as const, reason: 'failed' as const }));
      if (result.ok) {
        if (!Object.keys(pending.current).length) {
          setSave('saved');
          try {
            localStorage.removeItem(PENDING_KEY(applicationId));
          } catch {}
        }
        return;
      }
      if (result.reason === 'expired') return router.replace(`/${locale}/pre-admission/start`);
      if (result.reason === 'locked') return router.replace(`/${locale}/pre-admission/status`);
      pending.current = { ...patch, ...pending.current };
      setSave('error');
      timer.current = setTimeout(() => void flush(), 5000);
    });
    return chain.current;
  }, [applicationId, locale, router, setSave]);

  const queue = useCallback(
    (key: string, value: unknown) => {
      pending.current[key] = value;
      try {
        localStorage.setItem(PENDING_KEY(applicationId), JSON.stringify(pending.current));
      } catch {}
      setSave('saving');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 800);
    },
    [applicationId, flush, setSave],
  );

  // A save that never reached the server (tab closed, offline) is replayed on the next visit.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PENDING_KEY(applicationId));
      if (!saved) return;
      const patch = JSON.parse(saved) as Answers;
      // File records are saved by the upload route; only typed answers are replayed.
      const own = Object.fromEntries(Object.entries(patch).filter(([, v]) => typeof v !== 'object' || Array.isArray(v)));
      if (!Object.keys(own).length) return;
      setAnswers((a) => ({ ...a, ...own }));
      pending.current = own;
      void flush();
    } catch {}
  }, [applicationId, flush]);

  useEffect(() => {
    const onHide = () => void flush();
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [flush]);

  function change(field: FormField, value: AnswerValue | '') {
    setAnswers((a) => {
      const next = { ...a };
      if (value === '') delete next[field.key];
      else next[field.key] = value;
      return next;
    });
    // Uploads are saved by the upload route itself.
    if (field.type !== 'file') queue(field.key, value);
    else setSave('saved');
  }

  const all = useMemo(() => [...otherFields, ...section.fields], [otherFields, section.fields]);
  const dobField = all.find((f) => f.role === 'dateOfBirth');
  const age = dobField && typeof answers[dobField.key] === 'string' ? ageOn(answers[dobField.key] as string, sessionStart(session)) : null;
  const sessionYear = Number(/^\d{4}/.exec(session)?.[0] ?? new Date().getFullYear() + 1);
  const dobYears = Array.from({ length: 14 }, (_, i) => sessionYear - 2 - i);

  const check = checkSection(section, answers);
  const errorFor = (f: FormField): AnswerError | undefined => {
    if (!showAll && !touched.has(f.key)) return undefined;
    if (!isVisible(f, answers)) return undefined;
    return checkField(f, answers[f.key]).error;
  };
  const errorText = (f: FormField, e: AnswerError | undefined) => {
    if (!e) return null;
    if (e === 'required' && f.type === 'file') return t('chapter.errors.required');
    return t(`chapter.errors.${e}`);
  };
  const problems = section.fields.filter((f) => check.errors[f.key]);

  async function next() {
    setShowAll(true);
    if (problems.length) {
      requestAnimationFrame(() => {
        summaryRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        summaryRef.current?.focus({ preventScroll: true });
      });
      return;
    }
    setLeaving(true);
    await flush();
    // A save that failed stays here (shown as not saved, retried) rather than moving on without it.
    if (Object.keys(pending.current).length) return setLeaving(false);
    router.push(nextHref);
  }

  const nextChapter = chapters[index + 1];
  const prevChapter = chapters[index - 1];
  const nextHref = nextChapter ? nextChapter.href : reviewHref;
  const nextLabel = nextChapter ? t('chapter.nextTo', { chapter: nextChapter.title }) : t('chapter.toReview');
  const progress = check.required ? Math.round((check.answered / check.required) * 100) : 100;

  return (
    <>
      <div className="sticky top-14 z-20 flex flex-col gap-1.5 border-b bg-card px-4 pb-3 pt-2.5 md:hidden">
        <span className="text-[12.5px] text-muted-foreground">{t('chapter.of', { n: num(index + 1, locale), total: num(chapters.length, locale) })}</span>
        <div className="h-1 rounded-full bg-muted">
          <div className="h-1 rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1240px] items-start gap-12 px-4 pb-32 pt-1 md:px-8 md:pb-18 md:pt-10">
        <nav aria-label={t('hub.chapters')} className="sticky top-26 hidden w-[220px] flex-none flex-col gap-0.5 lg:flex">
          <span className="px-2.5 pb-2 text-[12.5px] text-muted-foreground">{t('chapter.chapterLabel')}</span>
          {chapters.map((c, i) => (
            <Link
              key={c.key}
              href={c.href}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => void flush()}
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
            <Link href={reviewHref} className="mt-1.5 flex items-center gap-2.5 border-t px-2.5 pt-3.5 text-sm text-muted-foreground hover:text-foreground">
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

        <main className="min-w-0 flex-1">
          <div className="hidden flex-col gap-1 pb-6 md:flex">
            <span className="text-[13.5px] text-muted-foreground">{t('chapter.of', { n: num(index + 1, locale), total: num(chapters.length, locale) })}</span>
            <h1 className="text-[28px] font-bold leading-[1.3] tracking-[-0.015em]">{txt(section.title, locale)}</h1>
          </div>
          <h1 className="sr-only md:hidden">{txt(section.title, locale)}</h1>

          {showAll && problems.length > 0 && (
            <div ref={summaryRef} tabIndex={-1} role="alert" className="mb-2 mt-4 flex scroll-mt-32 gap-2.5 rounded-lg border border-destructive bg-card p-3 outline-none md:mt-0">
              <CircleAlert className="mt-0.5 size-4 flex-none text-destructive" aria-hidden />
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-destructive">{t('chapter.errorSummary', { count: num(problems.length, locale) })}</span>
                {problems.map((f) => (
                  <a
                    key={f.key}
                    href={`#f-${f.key}`}
                    className="text-destructive underline underline-offset-[3px]"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(`f-${f.key}-group`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                      document.getElementById(`f-${f.key}`)?.focus({ preventScroll: true });
                    }}
                  >
                    {txt(f.label, locale)}
                  </a>
                ))}
              </div>
            </div>
          )}

          {blocks(section).map((block, bi) => {
            const visible = block.fields.filter((f) => isVisible(f, answers));
            if (!visible.length) return null;
            const optional = visible.every((f) => !f.required);
            return (
              <section key={block.group?.key ?? `b${bi}`} className={cn('flex flex-col gap-5 py-6 md:flex-row md:flex-wrap md:gap-x-10 md:py-8', bi > 0 && 'border-t')}>
                {block.group && (
                  <div className="md:max-w-[260px] md:flex-[1_1_200px]">
                    <h2 className="text-base font-semibold">
                      {txt(block.group.title, locale)}
                      {optional && <span className="text-sm font-normal text-muted-foreground"> {t('chapter.ifApplicable')}</span>}
                    </h2>
                    {txt(block.group.description, locale) && <p className="mt-1 text-[13px] leading-normal text-muted-foreground">{txt(block.group.description, locale)}</p>}
                  </div>
                )}
                <div className={cn('flex min-w-0 flex-col gap-5 md:flex-[999_1_420px]', !block.group && section.groups.length > 0 && 'md:ml-[300px]', !section.groups.length && 'md:max-w-[640px]')}>
                  {rows(visible).map((row) => (
                    <div key={row[0].key} className={cn(row.length > 1 && 'grid gap-5 sm:grid-cols-2')}>
                      {row.map((f) => {
                        const error = errorFor(f);
                        return (
                          <FieldBlock
                            key={f.key}
                            field={f}
                            value={answers[f.key]}
                            locale={locale}
                            error={errorText(f, error)}
                            onChange={(v) => change(f, v)}
                            onBlur={() => {
                              setTouched((s) => (s.has(f.key) ? s : new Set(s).add(f.key)));
                              void flush();
                            }}
                            classFit={f.role === 'classApplied' ? { fits: classesForAge(f.options, age), age } : undefined}
                            years={f.role === 'dateOfBirth' ? dobYears : undefined}
                          />
                        );
                      })}
                      {row.some((f) => f.role === 'dateOfBirth') && age && (
                        <p className="mt-1.5 text-[13px] text-muted-foreground">
                          {t.rich('chapter.ageAt', {
                            age: t('chapter.age', { years: num(age.years, locale), months: num(age.months, locale) }),
                            b: (c) => <b className="font-semibold text-foreground">{c}</b>,
                          })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          <div className="hidden items-center justify-between gap-3 border-t pt-6 md:flex">
            <Button asChild variant="outline" className="h-11 bg-card shadow-none">
              <Link href={prevChapter ? prevChapter.href : hubHref} onClick={() => void flush()}>
                {prevChapter ? prevChapter.title : t('chapter.toHub')}
              </Link>
            </Button>
            <Button className="h-11 px-[18px] text-[15px]" onClick={next} disabled={leaving}>
              {nextLabel}
            </Button>
          </div>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t bg-card px-4 pb-5 pt-3 md:hidden">
        <SaveIndicator />
        <Button className="h-11 px-4 text-[15px]" onClick={next} disabled={leaving}>
          {t('chapter.next')} <ChevronRight aria-hidden />
        </Button>
      </div>
    </>
  );
}
