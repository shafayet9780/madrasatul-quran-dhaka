import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FlowShell } from '@/components/pre-admission/flow-shell';
import { PledgeForm } from '@/components/pre-admission/pledge-form';
import { asLocale, num, txt } from '@/lib/admissions/display';
import { flowPath, guardianSteps, requireDraft } from '@/lib/admissions/pages';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: asLocale((await params).locale), namespace: 'preAdmission.pledge' });
  return { title: t('title'), robots: { index: false } };
}

/** অঙ্গীকার: the parents' code of conduct and the two pledges, between the last chapter and the review. */
export default async function PledgePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'preAdmission' });
  const { app, snapshot } = await requireDraft(locale);
  const conduct = snapshot.settings.conduct;
  if (!conduct) redirect(flowPath(locale, '/review'));
  const steps = await guardianSteps(locale, snapshot, app);
  const index = steps.length - 1;
  let n = 0;
  const groups = conduct.groups.map((g) => ({ title: txt(g.title, locale), rules: g.rules.map((r) => ({ n: num(++n, locale), text: txt(r, locale) })) }));

  return (
    <FlowShell locale={locale} session={snapshot.settings.session} title={t('pledge.title')} back={{ href: flowPath(locale, '/form'), label: t('backToChapters') }} saving>
      <PledgeForm
        locale={locale}
        steps={steps}
        index={index}
        intro={txt(conduct.intro, locale)}
        groups={groups}
        pledge={txt(conduct.pledge, locale)}
        declaration={txt(conduct.declaration, locale)}
        initial={{ conduct: !!app.conductPledgedAt, family: !!app.familyDeclaredAt }}
        prevHref={steps[index - 1]?.href ?? flowPath(locale, '/form')}
        reviewHref={flowPath(locale, '/review')}
      />
    </FlowShell>
  );
}
