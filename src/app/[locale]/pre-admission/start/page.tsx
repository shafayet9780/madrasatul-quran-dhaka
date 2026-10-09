import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FlowShell } from '@/components/pre-admission/flow-shell';
import { StartForm } from '@/components/pre-admission/start-form';
import { Button } from '@/components/shadcn/button';
import { asLocale } from '@/lib/admissions/display';
import { flowPath, safeCurrentCycle } from '@/lib/admissions/pages';
import { currentApplication } from '@/lib/admissions/session';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: asLocale((await params).locale), namespace: 'preAdmission.start' });
  return { title: t('title'), robots: { index: false } };
}

export default async function StartPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'preAdmission' });
  const [cycle, current] = await Promise.all([safeCurrentCycle(), currentApplication().catch(() => null)]);
  const open = !!cycle && cycle.enabled && cycle.window === 'open';
  const existing = current && (current.app.status === 'draft' || current.app.status === 'unpaid') ? current.app : null;

  return (
    <FlowShell locale={locale} session={cycle?.session ?? '2027'} title={t('start.title')} back={{ href: flowPath(locale), label: t('back') }}>
      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-6 px-4 pb-40 pt-7 md:px-6 md:py-18">
        <div className="flex flex-col gap-1.5 md:gap-2">
          <h1 className="text-2xl font-bold leading-[1.35] tracking-[-0.01em] md:text-[30px] md:leading-[1.3] md:tracking-[-0.015em]">{t('start.title')}</h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground md:text-[15.5px]">{t('start.lead')}</p>
        </div>

        {existing && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-[14.5px]">
            <span>{existing.studentNameBn ? t('start.existing', { name: existing.studentNameBn }) : t('start.existingUnnamed')}</span>
            <Button asChild variant="outline" className="h-9 shadow-none">
              <Link href={flowPath(locale, '/form')}>{t('start.existingContinue')}</Link>
            </Button>
          </div>
        )}

        {open ? (
          <StartForm locale={locale} />
        ) : (
          <p role="status" className="rounded-xl border bg-card p-4 text-[15px]">
            {t('start.closed')}
          </p>
        )}

        <p className="hidden text-sm text-muted-foreground md:block">
          {t('start.findPrompt')}{' '}
          <Link href={flowPath(locale, '/find')} className="font-medium text-foreground underline underline-offset-[3px]">
            {t('start.findLink')}
          </Link>
        </p>
        <p className="-mt-3 text-[13px] leading-relaxed text-muted-foreground">{t('start.privacy')}</p>
      </main>
    </FlowShell>
  );
}
