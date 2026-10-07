import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, Circle, CircleCheck, Contrast, Lock } from 'lucide-react';
import { CopyLink } from '@/components/pre-admission/copy-link';
import { FlowShell } from '@/components/pre-admission/flow-shell';
import { Button } from '@/components/shadcn/button';
import { chapterStatus } from '@/lib/admissions/answers';
import { asLocale, num, txt } from '@/lib/admissions/display';
import { fieldWithRole, guardianSections } from '@/lib/admissions/form-config';
import { flowPath, requireDraft } from '@/lib/admissions/pages';
import { resumeUrl, sessionToken } from '@/lib/admissions/session';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: asLocale((await params).locale), namespace: 'preAdmission.hub' });
  return { title: t('title'), robots: { index: false } };
}

export default async function HubPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'preAdmission' });
  const { app, snapshot } = await requireDraft(locale);
  const token = (await sessionToken())!;
  const link = await resumeUrl(locale, token);

  const chapters = guardianSections(snapshot).map((section) => {
    const s = chapterStatus(section, app.answers);
    const minutes = Math.max(1, Math.round((section.fields.length * 10) / 60));
    return {
      section,
      ...s,
      href: flowPath(locale, `/form/${section.key}`),
      sub: section.groups.map((g) => txt(g.title, locale)).join(', '),
      statusText:
        s.status === 'done'
          ? t('hub.statusDone')
          : s.status === 'in_progress'
            ? t('hub.statusProgress', { answered: num(s.answered, locale), total: num(s.required, locale) })
            : t('hub.statusTodo', { minutes: num(minutes, locale) }),
    };
  });
  const done = chapters.filter((c) => c.status === 'done').length;
  const allDone = done === chapters.length;
  const required = chapters.reduce((n, c) => n + c.required, 0);
  const answered = chapters.reduce((n, c) => n + c.answered, 0);
  const next = chapters.find((c) => c.status !== 'done');
  const nextLabel = next
    ? t(next.status === 'not_started' && done === 0 ? 'hub.startChapter' : 'hub.continueChapter', { chapter: txt(next.section.title, locale) })
    : t('hub.goReview');
  const nextHref = next ? next.href : flowPath(locale, '/review');

  const classField = fieldWithRole(snapshot, 'classApplied');
  const classLabel = classField?.options.find((o) => o.value === app.answers[classField.key]);
  const subtitle = [app.studentNameBn, classLabel && txt(classLabel.label, locale)].filter(Boolean).join(', ') || t('hub.untitled');

  return (
    <FlowShell locale={locale} session={snapshot.settings.session} back={{ href: flowPath(locale), label: t('back') }}>
      <main className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 pb-32 pt-6 md:gap-7 md:px-6 md:pb-18 md:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold leading-[1.35] tracking-[-0.01em] md:text-[30px] md:leading-[1.3] md:tracking-[-0.015em]">{t('hub.title')}</h1>
            <p className="text-[15px] text-muted-foreground md:text-[15.5px]">{subtitle}</p>
          </div>
          <Button asChild className="hidden h-11 px-[18px] text-[15px] md:inline-flex">
            <Link href={nextHref}>{nextLabel}</Link>
          </Button>
        </div>

        {app.status === 'unpaid' && <p className="rounded-xl border bg-card p-4 text-[14.5px] leading-relaxed">{t('hub.submittedNote')}</p>}

        <div className="flex flex-col gap-2">
          <span className="text-[13.5px] md:text-sm">{t('hub.progress', { done: num(done, locale), total: num(chapters.length, locale) })}</span>
          <div
            role="progressbar"
            aria-label={t('hub.progress', { done: num(done, locale), total: num(chapters.length, locale) })}
            aria-valuemin={0}
            aria-valuemax={required}
            aria-valuenow={answered}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${required ? Math.round((answered / required) * 100) : 0}%` }} />
          </div>
        </div>

        <nav aria-label={t('hub.chapters')} className="overflow-hidden rounded-xl border bg-card">
          <ul>
            {chapters.map((c) => (
              <li key={c.section.key} className="border-b">
                <Link href={c.href} className="flex min-h-16 items-center gap-3.5 px-4 py-3 hover:bg-muted/60">
                  {c.status === 'done' ? (
                    <CircleCheck className="size-5 flex-none text-success" aria-hidden />
                  ) : c.status === 'in_progress' ? (
                    <Contrast className="size-5 flex-none text-primary" aria-hidden />
                  ) : (
                    <Circle className="size-5 flex-none text-input" aria-hidden />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-px">
                    <span className="text-[15px] font-medium md:text-base">{txt(c.section.title, locale)}</span>
                    <span className="text-[13px] text-muted-foreground md:hidden">{c.statusText}</span>
                    {c.sub && <span className="hidden truncate text-[13.5px] text-muted-foreground md:block">{c.sub}</span>}
                  </span>
                  <span className="hidden flex-none text-[13.5px] text-muted-foreground md:inline">{c.statusText}</span>
                  <ChevronRight className="size-4 flex-none text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              {allDone ? (
                <Link href={flowPath(locale, '/review')} className="flex min-h-16 items-center gap-3.5 px-4 py-3 hover:bg-muted/60">
                  <Circle className="size-5 flex-none text-primary" aria-hidden />
                  <span className="flex flex-1 flex-col gap-px">
                    <span className="text-[15px] font-medium md:text-base">{t('hub.review')}</span>
                    <span className="text-[13px] text-muted-foreground md:text-[13.5px]">{t('hub.reviewReady')}</span>
                  </span>
                  <ChevronRight className="size-4 flex-none text-muted-foreground" aria-hidden />
                </Link>
              ) : (
                <div className="flex min-h-16 items-center gap-3.5 bg-muted px-4 py-3 text-muted-foreground" aria-disabled>
                  <Lock className="size-5 flex-none" aria-hidden />
                  <span className="flex flex-1 flex-col gap-px">
                    <span className="text-[15px] font-medium md:text-base">{t('hub.review')}</span>
                    <span className="text-[13px] md:text-[13.5px]">{t('hub.reviewLocked')}</span>
                  </span>
                </div>
              )}
            </li>
          </ul>
        </nav>

        <div className="flex items-center justify-between gap-3 md:gap-4">
          <p className="text-[13.5px] leading-normal text-muted-foreground md:text-sm">{t('hub.resumeNote')}</p>
          <CopyLink url={link} label={t('hub.copyLink')} done={t('hub.copied')} />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card px-4 pb-5 pt-3 md:hidden">
        <Button asChild className="h-11 w-full text-[15px]">
          <Link href={nextHref}>{nextLabel}</Link>
        </Button>
      </div>
    </FlowShell>
  );
}
