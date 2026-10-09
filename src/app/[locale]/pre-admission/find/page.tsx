import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CircleAlert } from 'lucide-react';
import { FindForm } from '@/components/pre-admission/find-form';
import { FlowShell } from '@/components/pre-admission/flow-shell';
import { asLocale, dateTime, taka } from '@/lib/admissions/display';
import { flowPath, safeCurrentCycle } from '@/lib/admissions/pages';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ link?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: asLocale((await params).locale), namespace: 'preAdmission.find' });
  return { title: t('title'), robots: { index: false } };
}

export default async function FindPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  const { link } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'preAdmission' });
  const cycle = await safeCurrentCycle();
  const settings = cycle?.snapshot.settings;
  const session = settings?.session ?? '2027';
  const year = Number(/^\d{4}/.exec(session)?.[0] ?? new Date().getFullYear() + 1);

  return (
    <FlowShell locale={locale} session={session} back={{ href: flowPath(locale), label: t('back') }}>
      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-[22px] px-4 pb-10 pt-7 md:px-6 md:py-16">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold leading-[1.35] tracking-[-0.01em] md:text-[30px] md:leading-[1.3]">{t('find.title')}</h1>
          <p className="text-[14.5px] leading-relaxed text-muted-foreground md:text-[15px]">{t('find.lead')}</p>
        </div>
        {link === 'invalid' && (
          <p role="alert" className="flex gap-2.5 rounded-lg border bg-card p-3 text-[13.5px] leading-relaxed">
            <CircleAlert className="mt-0.5 size-4 flex-none text-warning" aria-hidden />
            {t('find.linkInvalid')}
          </p>
        )}
        <FindForm
          locale={locale}
          session={session}
          fee={settings ? taka(settings.applicationFee, locale) : ''}
          deadline={settings?.closesAt ? dateTime(settings.closesAt, locale) : null}
          whatsappUrl={settings?.whatsappUrl || null}
          years={Array.from({ length: 16 }, (_, i) => year - 1 - i)}
        />
      </main>
    </FlowShell>
  );
}
