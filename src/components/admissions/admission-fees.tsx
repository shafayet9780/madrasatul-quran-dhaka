import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { FeeSettings } from '@/types/fees';
import { applicableNames, usableFeeSettings } from '@/lib/fees';
import { feeGroups, keepHyphens } from '@/lib/admissions/admissions-page';
import { buildTransport } from '@/lib/admissions/snapshot';
import { taka, txt } from '@/lib/admissions/display';
import { RouteLine } from '@/components/site/route-line';
import { ButtonLink } from '@/components/site/button';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

const block = 'flex flex-col gap-3.5 rounded-card bg-cream p-[clamp(20px,2.4vw,28px)]';

/**
 * What it costs, on `paper`, all from Studio → Fees, discounts & transport: the fee table on a `surface` card (day-care and
 * non day-care side by side, so they compare at a glance), the discounts and the payment rules beside it on `cream`,
 * then the school's van routes with their vehicle and monthly charge. Without usable fee settings it says to ask the office.
 */
export async function AdmissionFees({ locale, settings }: { locale: Locale; settings: FeeSettings | null }) {
  const t = await getTranslations({ locale, namespace: 'admissions.page' });
  const tr = await getTranslations({ locale, namespace: 'preAdmission.transport' });
  const home = await getTranslations({ locale, namespace: 'home' });
  const unavailable = txt(settings?.unavailableMessage, locale) || t('price.contactOffice');

  if (!usableFeeSettings(settings))
    return (
      <section id="fees" className="bg-paper text-ink">
        <div className="page-wrap flex flex-col items-start gap-4 py-section">
          <h2 className="m-0 text-h2">{t('feesFallback')}</h2>
          <p className="m-0 text-19 text-ink-body">{unavailable}</p>
          <ButtonLink href={`/${locale}/contact`} variant="outline">
            {t('contactAdmissions')}
            <Icon name="arrow-right" size={18} />
          </ButtonLink>
        </div>
      </section>
    );

  const words = { ...(t.raw('price') as { notApplicable: string; contactOffice: string; free: string }), ...(t.raw('frequency') as { monthly: string; oneTime: string; annual: string }) };
  const groups = feeGroups(settings, locale, words);
  // Column labels keep ডে-কেয়ার on one line on narrow phones.
  const columns = [txt(settings.preHifzLabel, locale), txt(settings.hifzLabel, locale)].map(keepHyphens);
  const discounts = (settings.discounts ?? []).filter((d) => d.visible);
  const policies = (settings.policies ?? []).map((p) => txt(p.text, locale)).filter(Boolean);
  const transport = buildTransport(settings);

  return (
    <div className="bg-paper text-ink">
      <section id="fees" className="page-wrap flex flex-col gap-9 pt-section">
        <div className="flex max-w-[820px] flex-col gap-3">
          <h2 className="m-0 text-h2 text-balance">{txt(settings.heading, locale)}</h2>
          {groups.length > 0 && <p className="m-0 text-19 text-ink-body">{txt(settings.introduction, locale)}</p>}
        </div>
        <div className="flex flex-wrap items-start gap-x-8 gap-y-6">
          <div className="min-w-0 flex-[3_1_520px] rounded-card border border-line bg-surface p-[clamp(16px,2.4vw,32px)]">
            {groups.length > 0 ? (
              <>
                <table className="w-full border-collapse text-left">
                  <caption className="sr-only">{txt(settings.heading, locale)}</caption>
                  <thead>
                    <tr className="border-b-2 border-ink">
                      <th scope="col" className="pb-3 pr-3 align-bottom text-14 font-strong text-ink-muted">
                        {t('fee')}
                      </th>
                      {columns.map((c) => (
                        <th key={c} scope="col" className="pb-3 pl-3 text-right align-bottom text-16 leading-[1.3] font-bold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  {groups.map((g) => (
                    <tbody key={g.key}>
                      <tr>
                        <th scope="rowgroup" colSpan={3} className="pb-1 pt-6 text-13 font-strong text-rust">
                          {t(`groups.${g.key}`)}
                        </th>
                      </tr>
                      {g.rows.map((r) => (
                        <tr key={r.key} className="border-b border-line last:border-b-0">
                          <th scope="row" className="py-3.5 pr-3 align-top font-normal">
                            <span className="block text-17 font-strong">{r.name}</span>
                            {g.key !== 'monthly' && <span className="block text-14 text-ink-muted">{r.frequency}</span>}
                            {r.note && <span className="block text-14 text-ink-muted">{r.note}</span>}
                          </th>
                          {r.prices.map((p, i) => (
                            <td key={i} className={cn('py-3.5 pl-3 text-right align-top', p.amount ? 'text-[clamp(17px,1.6vw,20px)] font-heading tabular-nums' : 'pt-4 text-14 text-ink-muted')}>
                              {p.text}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
                <p className="m-0 mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-line-strong pt-3.5 text-14 text-ink-muted">
                  <span>{t('currency')}</span>
                  <span>{t('dayCare')}</span>
                </p>
              </>
            ) : (
              <p className="m-0 text-17">{unavailable}</p>
            )}
          </div>

          <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-4">
            {discounts.length > 0 && (
              <div id="discounts" className={block}>
                <h3 className="m-0 text-h4">{txt(settings.discountsHeading, locale)}</h3>
                {discounts.map((d) => {
                  const applies = applicableNames(d.appliesTo, settings, locale);
                  return (
                    <div key={d._key} className="flex flex-col gap-1.5 border-t border-line-strong pt-3.5">
                      <h4 className="m-0 text-18 font-bold text-rust">{txt(d.title, locale)}</h4>
                      <p className="m-0 text-16 text-ink-body">{txt(d.description, locale)}</p>
                      {txt(d.conditions, locale) && <p className="m-0 text-16 text-ink-body">{txt(d.conditions, locale)}</p>}
                      {applies.length > 0 && <p className="m-0 text-14 text-ink-muted">{t('appliesTo', { fees: applies.join(', ') })}</p>}
                    </div>
                  );
                })}
              </div>
            )}
            <div id="payment" className={block}>
              <h3 className="m-0 text-h4">{txt(settings.paymentHeading, locale)}</h3>
              <p className="m-0 text-16 text-ink-body">{txt(settings.paymentInstructions, locale)}</p>
              {policies.length > 0 && (
                <ul className="m-0 flex list-disc flex-col gap-1.5 border-t border-line-strong pl-5 pt-3.5 text-16 leading-[1.55] text-ink-body marker:text-rust">
                  {policies.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {transport.routes.length > 0 ? (
        <section id="transport" className="page-wrap flex flex-col gap-8 pb-section pt-[clamp(3.5rem,7vw,6rem)]">
          <div className="flex max-w-[820px] flex-col gap-3">
            <h2 className="m-0 text-h2 text-balance">{txt(settings.transportHeading, locale)}</h2>
            <p className="m-0 text-19 text-ink-body">{txt(settings.transportIntroduction, locale)}</p>
          </div>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-3 p-0">
            {transport.routes.map((r) => {
              const vehicle = transport.vehicles.find((v) => v.key === r.vehicle);
              const route = { name: txt(r.name, locale), stops: r.stops.map((s) => txt(s.name, locale)) };
              return (
                <li key={r.key} className="rounded-card border border-line bg-surface px-5 pb-6 pt-5">
                  <RouteLine route={route} school={home('hero.name')}>
                    <p className="-mt-1.5 mb-1 text-15 text-ink-muted">
                      {vehicle && `${txt(vehicle.name, locale)}, `}
                      {vehicle?.monthly != null ? (
                        <>
                          <strong className="font-strong text-ink">{taka(vehicle.monthly, locale)}</strong> {tr('perMonth')}
                        </>
                      ) : (
                        tr('contactOffice')
                      )}
                    </p>
                  </RouteLine>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <p className="m-0 flex items-start gap-2.5 text-16 text-ink-body">
              <Icon name="info" size={20} className="mt-0.5 shrink-0 text-rust" />
              {tr('seatNote')}
            </p>
          </div>
        </section>
      ) : (
        <div className="pb-section" />
      )}
    </div>
  );
}
