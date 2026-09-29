import type { FeeLocale, FeePrice, FeeSettings, SchoolFee } from '@/types/fees';
import {
  applicableNames,
  formatPrice,
  groupFees,
  usableFeeSettings,
} from '@/lib/fees';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import styles from './financial-information.module.css';

export function financialLinks(
  settings: FeeSettings | null,
  locale: FeeLocale
) {
  const bn = locale === 'bengali';
  return [
    { id: 'fees', label: bn ? 'ফি' : 'Fees' },
    ...(usableFeeSettings(settings) && settings.transport?.some(v => v.visible)
      ? [{ id: 'transport', label: bn ? 'পরিবহন' : 'Transport' }]
      : []),
    ...(usableFeeSettings(settings) && settings.discounts?.some(d => d.visible)
      ? [{ id: 'discounts', label: bn ? 'ছাড়' : 'Discounts' }]
      : []),
    ...(usableFeeSettings(settings)
      ? [{ id: 'payment', label: bn ? 'পেমেন্ট' : 'Payment' }]
      : []),
  ];
}

function Price({
  value,
  locale,
}: {
  value: FeePrice | undefined;
  locale: FeeLocale;
}) {
  const isAmount =
    value?.status === 'priced' &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount) &&
    value.amount > 0;
  return (
    <span className={isAmount ? styles.price : styles.status}>
      {formatPrice(value, locale)}
    </span>
  );
}

export function FinancialInformation({
  settings,
  locale,
}: {
  settings: FeeSettings | null;
  locale: FeeLocale;
}) {
  const bn = locale === 'bengali';
  const contact = (
    <Link className={styles.contactLink} href={`/${locale}/contact`}>
      {bn ? 'ভর্তি বিষয়ে যোগাযোগ করুন' : 'Contact Admissions'}
      <ArrowUpRight size={16} aria-hidden="true" />
    </Link>
  );
  const unavailableMessage = settings?.unavailableMessage?.[locale];
  if (!usableFeeSettings(settings))
    return (
      <div className={styles.financial}>
        <section id="fees" className={`${styles.section} ${styles.empty}`}>
          <h2 className={styles.heading}>
            {bn ? 'ফি সম্পর্কিত তথ্য' : 'Fee information'}
          </h2>
          <p className={styles.introduction}>
            {unavailableMessage ||
              (bn
                ? 'বর্তমান ফি জানতে অফিসে যোগাযোগ করুন।'
                : 'Please contact the office for current fee information.')}
          </p>
          {contact}
        </section>
      </div>
    );

  const frequency = (fee: SchoolFee) =>
    fee.frequency === 'custom'
      ? fee.customFrequency?.[locale]
      : {
          monthly: bn ? 'মাসিক' : 'Monthly',
          oneTime: bn ? 'এককালীন' : 'One-time',
          annual: bn ? 'বাৎসরিক' : 'Annual',
        }[fee.frequency];
  const groupLabels = {
    monthly: bn ? 'মাসিক ফি' : 'Monthly fees',
    admission: bn ? 'এককালীন ও বাৎসরিক ফি' : 'One-time and annual fees',
    custom: bn ? 'অন্যান্য ফি' : 'Other fees',
  };
  const groups = groupFees(settings.fees);
  const labels = [
    settings.preHifzLabel?.[locale] || 'Pre-Hifz',
    settings.hifzLabel?.[locale] || 'Hifz',
  ];
  const vehicles = settings.transport?.filter(v => v.visible) || [];
  const discounts = settings.discounts?.filter(d => d.visible) || [];

  return (
    <div className={styles.financial}>
      <section id="fees" className={styles.section}>
        <h2 className={styles.heading}>{settings.heading[locale]}</h2>
        <p className={styles.introduction}>{settings.introduction?.[locale]}</p>
        <div className={styles.panel}>
          <table className={`${styles.table} ${styles.desktopFees}`}>
            <caption className="sr-only">{settings.heading[locale]}</caption>
            <thead>
              <tr>
                <th scope="col">{bn ? 'ফি ও সময়কাল' : 'Fee and frequency'}</th>
                {labels.map((label, i) => (
                  <th key={i} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map(group => (
              <tbody key={group.key}>
                <tr className={styles.groupLabel}>
                  <th scope="rowgroup" colSpan={3}>
                    {groupLabels[group.key as keyof typeof groupLabels]}
                  </th>
                </tr>
                {group.items.map(fee => (
                  <tr key={fee._key} className={styles.feeRow}>
                    <th scope="row">
                      <span className={styles.feeName}>
                        {fee.name?.[locale]}
                      </span>
                      <span className={styles.frequency}>{frequency(fee)}</span>
                      {fee.note?.[locale] && (
                        <span className={styles.note}>{fee.note[locale]}</span>
                      )}
                    </th>
                    <td>
                      <Price value={fee.preHifz} locale={locale} />
                    </td>
                    <td>
                      <Price value={fee.hifz} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
          <div className={styles.mobileFees}>
            {groups.map(group => (
              <div className={styles.mobileGroup} key={group.key}>
                <h3>{groupLabels[group.key as keyof typeof groupLabels]}</h3>
                {group.items.map(fee => (
                  <article key={fee._key} className={styles.feeCard}>
                    <header>
                      <h4>{fee.name?.[locale]}</h4>
                      <span className={styles.frequency}>{frequency(fee)}</span>
                    </header>
                    <dl>
                      {(['preHifz', 'hifz'] as const).map((program, i) => (
                        <div key={program}>
                          <dt>{labels[i]}</dt>
                          <dd>
                            <Price value={fee[program]} locale={locale} />
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {fee.note?.[locale] && (
                      <p className={styles.note}>{fee.note[locale]}</p>
                    )}
                  </article>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.panelFooter}>
            <span>
              {bn
                ? 'সকল পরিমাণ বাংলাদেশি টাকায়'
                : 'All amounts in Bangladeshi Taka'}
            </span>
            {contact}
          </div>
        </div>
      </section>
      {vehicles.length > 0 && (
        <section id="transport" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.heading}>
              {settings.transportHeading?.[locale]}
            </h2>
            <span className={styles.optional}>
              {bn ? 'ঐচ্ছিক · মাসিক' : 'Optional · Monthly'}
            </span>
          </div>
          <p className={styles.introduction}>
            {settings.transportIntroduction?.[locale]}
          </p>
          <div className={styles.panel}>
            <table className={`${styles.table} ${styles.transportTable}`}>
              <caption className="sr-only">
                {settings.transportHeading?.[locale]}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{bn ? 'যানবাহন' : 'Vehicle'}</th>
                  <th scope="col">{bn ? 'মাসিক ফি' : 'Monthly fee'}</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(vehicle => (
                  <tr key={vehicle._key} className={styles.feeRow}>
                    <th scope="row">
                      <span className={styles.feeName}>
                        {vehicle.name?.[locale]}
                      </span>
                      {vehicle.note?.[locale] && (
                        <span className={styles.note}>
                          {vehicle.note[locale]}
                        </span>
                      )}
                    </th>
                    <td>
                      <Price value={vehicle.price} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {discounts.length > 0 && (
        <section
          id="discounts"
          className={`${styles.section} ${styles.detailsSection}`}
        >
          <h2 className={styles.heading}>
            {settings.discountsHeading?.[locale]}
          </h2>
          <div>
            {discounts.map(discount => (
              <article key={discount._key} className={styles.discount}>
                <h3>{discount.title?.[locale]}</h3>
                <p>{discount.description?.[locale]}</p>
                <p className={styles.eligibility}>
                  {discount.conditions?.[locale]}
                </p>
                <span className={styles.appliesTo}>
                  {bn ? 'প্রযোজ্য ফি: ' : 'Applies to: '}
                  {applicableNames(discount.appliesTo, settings, locale).join(
                    ', '
                  ) || (bn ? 'অফিসে নিশ্চিত করুন' : 'Confirm with the office')}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
      <section
        id="payment"
        className={`${styles.section} ${styles.detailsSection}`}
      >
        <h2 className={styles.heading}>{settings.paymentHeading?.[locale]}</h2>
        <div>
          <p className={styles.instructions}>
            {settings.paymentInstructions?.[locale]}
          </p>
          <ul role="list" className={styles.policies}>
            {settings.policies?.map(policy => (
              <li key={policy._key}>{policy.text?.[locale]}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
