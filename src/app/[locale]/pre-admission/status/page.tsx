import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CircleCheck } from 'lucide-react';
import { FlowShell } from '@/components/pre-admission/flow-shell';
import { Button } from '@/components/shadcn/button';
import { asLocale } from '@/lib/admissions/display';
import { flowPath } from '@/lib/admissions/pages';
import { currentApplication } from '@/lib/admissions/session';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: asLocale((await params).locale), namespace: 'preAdmission.status' });
  return { title: t('submittedTitle'), robots: { index: false } };
}

// Placeholder until payments (M3) and the confirmation page (M4): an unpaid, submitted application.
export default async function StatusPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'preAdmission' });
  const current = await currentApplication().catch(() => null);
  if (!current) redirect(flowPath(locale, '/start'));
  if (current.app.status === 'draft') redirect(flowPath(locale, '/form'));
  const paid = current.app.status !== 'unpaid';

  return (
    <FlowShell locale={locale} session={current.snapshot.settings.session} back={{ href: flowPath(locale), label: t('back') }}>
      <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-4 py-10 md:py-18">
        <CircleCheck className="size-8 text-success" aria-hidden />
        <h1 className="text-2xl font-bold leading-[1.35] tracking-[-0.01em] md:text-[30px]">{paid ? t('status.paidTitle') : t('status.submittedTitle')}</h1>
        {!paid && <p className="text-[15px] leading-relaxed text-muted-foreground">{t('status.submittedLead')}</p>}
        {!paid && (
          <Button asChild variant="outline" className="h-11 self-start bg-card shadow-none">
            <Link href={flowPath(locale, '/review')}>{t('status.editApplication')}</Link>
          </Button>
        )}
      </main>
    </FlowShell>
  );
}
