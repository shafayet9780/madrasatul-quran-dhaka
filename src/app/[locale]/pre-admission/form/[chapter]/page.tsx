import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChapterForm } from '@/components/pre-admission/chapter-form';
import { FlowShell } from '@/components/pre-admission/flow-shell';
import { chapterStatus } from '@/lib/admissions/answers';
import { asLocale, txt } from '@/lib/admissions/display';
import { allFields, guardianSections } from '@/lib/admissions/form-config';
import { flowPath, requireDraft } from '@/lib/admissions/pages';
import { currentApplication } from '@/lib/admissions/session';

type Props = { params: Promise<{ locale: string; chapter: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, chapter } = await params;
  const current = await currentApplication().catch(() => null);
  const section = current?.snapshot.sections.find((s) => s.key === chapter);
  return { title: section ? txt(section.title, asLocale(locale)) : undefined, robots: { index: false } };
}

export default async function ChapterPage({ params }: Props) {
  const { locale: localeParam, chapter } = await params;
  const locale = asLocale(localeParam);
  const t = await getTranslations({ locale, namespace: 'preAdmission' });
  const { app, snapshot } = await requireDraft(locale);
  const sections = guardianSections(snapshot);
  const index = sections.findIndex((s) => s.key === chapter);
  if (index < 0) notFound();
  const section = sections[index];
  const chapters = sections.map((s) => ({
    key: s.key,
    title: txt(s.title, locale),
    status: chapterStatus(s, app.answers).status,
    href: flowPath(locale, `/form/${s.key}`),
  }));

  return (
    <FlowShell locale={locale} session={snapshot.settings.session} title={txt(section.title, locale)} back={{ href: flowPath(locale, '/form'), label: t('backToChapters') }} saving>
      <ChapterForm
        key={section.key}
        locale={locale}
        applicationId={app.id}
        session={snapshot.settings.session}
        section={section}
        otherFields={allFields(snapshot).filter((f) => !section.fields.includes(f))}
        index={index}
        chapters={chapters}
        initialAnswers={app.answers}
        hubHref={flowPath(locale, '/form')}
        reviewHref={flowPath(locale, '/review')}
        reviewOpen={chapters.every((c) => c.status === 'done')}
      />
    </FlowShell>
  );
}
