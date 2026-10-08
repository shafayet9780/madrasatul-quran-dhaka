import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronDown, CircleAlert } from 'lucide-react';
import { FlowShell } from '@/components/pre-admission/flow-shell';
import { ReviewSubmit } from '@/components/pre-admission/review-submit';
import { answerText } from '@/lib/admissions/answer-text';
import { chapterStatus, isVisible, type FileAnswer } from '@/lib/admissions/answers';
import { asLocale, num, taka, txt } from '@/lib/admissions/display';
import { countOtherApplications } from '@/lib/admissions/drafts';
import { guardianSections, type FormField } from '@/lib/admissions/form-config';
import { flowPath, requireDraft } from '@/lib/admissions/pages';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: asLocale((await params).locale), namespace: 'preAdmission.review' });
  return { title: t('title'), robots: { index: false } };
}

const SHOWN = 4;

export default async function ReviewPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'preAdmission' });
  const { app, snapshot } = await requireDraft(locale);
  const { settings } = snapshot;
  const chapters = guardianSections(snapshot);
  const incomplete = chapters.filter((s) => chapterStatus(s, app.answers).status !== 'done');
  const others = incomplete.length ? 0 : await countOtherApplications(app).catch(() => 0);
  const labels = {
    yes: t('chapter.yes'),
    no: t('chapter.no'),
    notGiven: t('notGiven'),
    fileAttached: (type: string) => t('review.fileAttached', { type }),
  };
  const fee = taka(settings.applicationFee, locale);

  // Every chapter as configured, including the start-page answers (mobile, email) in theirs.
  const sections = snapshot.sections.map((section) => {
    const fields = section.fields.filter((f) => isVisible(f, app.answers) && !(f.type === 'file' && f.fileKind === 'photo'));
    const photo = section.fields.find((f) => f.type === 'file' && f.fileKind === 'photo' && app.answers[f.key]);
    const editable = chapters.some((c) => c.key === section.key);
    const row = (f: FormField) => ({ key: f.key, label: txt(f.label, locale), value: answerText(f, app.answers[f.key], locale, labels), lat: f.role === 'email' || f.role === 'studentNameEn' });
    return {
      key: section.key,
      title: txt(section.title, locale),
      editHref: editable ? flowPath(locale, `/form/${section.key}`) : null,
      photo: photo ? (app.answers[photo.key] as FileAnswer) : null,
      rows: fields.slice(0, SHOWN).map(row),
      extra: fields.slice(SHOWN).map(row),
    };
  });

  return (
    <FlowShell locale={locale} session={settings.session} title={t('hub.review')} back={{ href: flowPath(locale, '/form'), label: t('backToChapters') }}>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-6 px-4 pb-40 pt-6 md:px-8 md:pb-18 md:pt-10 lg:flex-row lg:gap-12">
        <main className="w-full min-w-0 flex-1">
          <div className="flex flex-col gap-1.5 pb-5 md:pb-6">
            <h1 className="text-2xl font-bold leading-[1.35] tracking-[-0.01em] md:text-[28px] md:leading-[1.3] md:tracking-[-0.015em]">{t('review.title')}</h1>
            <p className="text-[14.5px] leading-relaxed text-muted-foreground md:text-[15px]">{t('review.lead')}</p>
          </div>

          {incomplete.length > 0 && (
            <div role="alert" className="mb-4 flex gap-2.5 rounded-lg border border-destructive bg-card p-3">
              <CircleAlert className="mt-0.5 size-4 flex-none text-destructive" aria-hidden />
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-destructive">{t('review.incompleteLead')}</span>
                {incomplete.map((s) => (
                  <Link key={s.key} href={flowPath(locale, `/form/${s.key}`)} className="text-destructive underline underline-offset-[3px]">
                    {t('review.incomplete', { chapter: txt(s.title, locale) })}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {sections.map((s) => (
            <section key={s.key} className="border-t py-5 first-of-type:border-t-0 md:py-6">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold">{s.title}</h2>
                {s.editHref && (
                  <Link href={s.editHref} className="text-sm font-medium underline underline-offset-[3px]" aria-label={`${t('review.edit')}: ${s.title}`}>
                    {t('review.edit')}
                  </Link>
                )}
              </div>
              <div className="flex gap-3.5 md:gap-5">
                {s.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/admissions/file?key=${encodeURIComponent(s.photo.key)}`} alt="" className="h-20 w-16 flex-none rounded-lg border object-cover md:h-[90px] md:w-[72px]" />
                )}
                <dl className="grid flex-1 grid-cols-[minmax(0,40%)_1fr] gap-x-4 gap-y-2 text-[14.5px] md:grid-cols-[minmax(0,320px)_1fr]">
                  {s.rows.map((r) => (
                    <div key={r.key} className="contents">
                      <dt className="text-muted-foreground">{r.label}</dt>
                      <dd className={r.value === t('notGiven') ? 'text-muted-foreground' : undefined}>{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {s.extra.length > 0 && (
                <details className="group mt-3">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    {t('review.more', { count: num(s.extra.length, locale) })}
                    <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <dl className="mt-3 grid grid-cols-[minmax(0,40%)_1fr] gap-x-4 gap-y-2 text-[14.5px] md:grid-cols-[minmax(0,320px)_1fr]">
                    {s.extra.map((r) => (
                      <div key={r.key} className="contents">
                        <dt className="text-muted-foreground">{r.label}</dt>
                        <dd className={r.value === t('notGiven') ? 'text-muted-foreground' : undefined}>{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </section>
          ))}
        </main>

        {incomplete.length === 0 && (
          <aside className="w-full lg:sticky lg:top-26 lg:max-w-[380px] lg:flex-[1_1_320px] lg:pt-20">
            {others > 0 && (
              <p role="status" className="mb-3 rounded-lg border bg-card p-3 text-[13.5px] leading-relaxed">
                {t('review.duplicate')}
              </p>
            )}
            <ReviewSubmit
              locale={locale}
              fee={fee}
              evaluationFee={taka(settings.evaluationFee, locale)}
              declaration={txt(settings.declaration, locale)}
              payLabel={t('review.pay', { fee })}
            />
          </aside>
        )}
      </div>
    </FlowShell>
  );
}
