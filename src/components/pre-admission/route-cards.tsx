'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { taka, txt, type Locale } from '@/lib/admissions/display';
import type { Transport } from '@/lib/admissions/form-config';
import { findStop } from '@/lib/admissions/transport';
import { cn } from '@/lib/utils';

/**
 * The transport routes as cards, by area (tabs): name, vehicle, monthly charge, and the stops as a
 * connected line ending at the madrasa (top to bottom on phones, left to right on wider screens).
 * `selected` (a transport stop answer) marks the guardian's stop. Used in the form and on the
 * public Admissions page.
 */
export function RouteCards({ transport, locale, selected }: { transport: Transport; locale: Locale; selected?: string }) {
  const t = useTranslations('preAdmission.transport');
  const chosen = findStop(transport, selected);
  const areas = [...new Map(transport.routes.map((r) => [r.area.bengali, r.area])).values()];
  const [picked, setPicked] = useState<{ area: string; selected?: string } | null>(null);
  // The tab follows the chosen stop; a tab picked by hand holds until another stop is chosen.
  const area = (picked?.selected === selected ? picked?.area : undefined) ?? chosen?.route.area.bengali ?? areas[0]?.bengali;
  if (!transport.routes.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {areas.length > 1 && (
        <div role="tablist" aria-label={t('areas')} className="grid grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-1 rounded-[10px] bg-muted p-1 md:w-fit md:min-w-[280px]" style={{ ['--n' as string]: areas.length }}>
          {areas.map((a) => (
            <button
              key={a.bengali}
              type="button"
              role="tab"
              aria-selected={a.bengali === area}
              onClick={() => setPicked({ area: a.bengali, selected })}
              className={cn('h-9 rounded-[7px] px-3 text-[14.5px] font-medium text-muted-foreground', a.bengali === area && 'bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,.08)]')}
            >
              {txt(a, locale)}
            </button>
          ))}
        </div>
      )}
      <div role="tabpanel" className="flex flex-col gap-3">
        {transport.routes
          .filter((r) => r.area.bengali === area)
          .map((r) => {
            const vehicle = transport.vehicles.find((v) => v.key === r.vehicle);
            const isRoute = chosen?.route.key === r.key;
            const stops = [...r.stops.map((s) => ({ key: s.key, name: txt(s.name, locale), sel: isRoute && chosen?.stop.key === s.key, end: false })), { key: '_end', name: t('madrasa'), sel: false, end: true }];
            return (
              <article
                key={r.key}
                aria-label={txt(r.name, locale)}
                className={cn('flex flex-col gap-2.5 rounded-xl border bg-card px-4 pb-3 pt-3.5 md:flex-row md:flex-wrap md:items-start md:gap-x-6 md:gap-y-4 md:px-5 md:py-4', isRoute && 'border-primary ring-1 ring-primary')}
              >
                <div className="flex items-start justify-between gap-3 md:max-w-[200px] md:flex-[1_1_170px] md:flex-col md:justify-start md:gap-1.5">
                  <div className="flex flex-col items-start gap-1 md:gap-1.5">
                    <h3 className="text-[15.5px] font-semibold leading-[1.4]">{txt(r.name, locale)}</h3>
                    {vehicle && <span className="inline-flex h-[22px] items-center rounded-md border px-2 text-[12.5px] font-medium text-muted-foreground">{txt(vehicle.name, locale)}</span>}
                  </div>
                  {vehicle?.monthly != null ? (
                    <div className="flex flex-col items-end md:mt-1 md:flex-row md:items-baseline md:gap-1">
                      <span className="text-[17px] font-bold leading-[1.3]">{taka(vehicle.monthly, locale)}</span>
                      <span className="text-[12.5px] text-muted-foreground">{t('perMonth')}</span>
                    </div>
                  ) : (
                    <span className="max-w-[140px] text-right text-[12.5px] text-muted-foreground md:text-left">{t('contactOffice')}</span>
                  )}
                </div>
                {/* Phones: a vertical line. */}
                <ol className="relative m-0 list-none p-0 before:absolute before:bottom-3.5 before:left-1.5 before:top-3.5 before:w-0.5 before:bg-input md:hidden">
                  {stops.map((s) => (
                    <li key={s.key} className={cn('relative flex min-h-[30px] items-center gap-3 text-sm', (s.sel || s.end) && 'font-semibold')}>
                      <Dot sel={s.sel} end={s.end} />
                      <span>
                        {s.name}
                        {s.end && <span className="font-normal text-muted-foreground"> ({t('madrasaPlace')})</span>}
                      </span>
                      {s.sel && <span className="rounded-md border border-primary px-1.5 text-xs font-medium text-primary">{t('yourStop')}</span>}
                    </li>
                  ))}
                </ol>
                {/* Wider screens: left to right. */}
                <ol className="m-0 hidden min-w-0 list-none p-0 pt-1 md:grid md:flex-[999_1_420px]" style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}>
                  {stops.map((s, i) => (
                    <li key={s.key} className={cn('relative flex flex-col items-center gap-2 px-1 text-center text-[13.5px] leading-[1.4]', (s.sel || s.end) && 'font-semibold')}>
                      <span aria-hidden className={cn('absolute top-1.5 h-0.5 bg-input', i === 0 ? 'left-1/2 right-0' : i === stops.length - 1 ? 'left-0 right-1/2' : 'inset-x-0')} />
                      <Dot sel={s.sel} end={s.end} />
                      <span>{s.name}</span>
                      {s.sel && <span className="sr-only">{t('yourStop')}</span>}
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
      </div>
      <p className="flex items-start gap-2 text-[13.5px] leading-[1.6] text-muted-foreground">
        <Info className="mt-[3px] size-[15px] flex-none" aria-hidden />
        <span>
          {t('seatNote')}
          <span className="hidden md:inline">
            {' '}
            {t('madrasa')}: {t('madrasaPlace')}
            {locale === 'bengali' ? '।' : '.'}
          </span>
        </span>
      </p>
    </div>
  );
}

function Dot({ sel, end }: { sel: boolean; end: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative z-[1] size-3.5 flex-none rounded-full border-2 border-input bg-card',
        sel && 'border-primary bg-primary shadow-[0_0_0_3px_var(--ring)]',
        end && 'rounded-[4px] border-foreground bg-foreground',
      )}
    />
  );
}
