import { taka, txt, type Locale } from './display';
import { NO_ROUTE, NO_ROUTE_LABEL, type Transport, type TransportRoute } from './form-config';

// Transport stop answers (`<route key>:<stop key>`) read back against the routes frozen with the
// form, so every view shows the route, vehicle and charge the guardian saw. Pure.

export type ChosenStop = { route: TransportRoute; stop: TransportRoute['stops'][number]; vehicle?: Transport['vehicles'][number] };

export function findStop(transport: Transport | undefined, value: unknown): ChosenStop | null {
  if (!transport || typeof value !== 'string') return null;
  const [routeKey, stopKey] = value.split(':');
  const route = transport.routes.find((r) => r.key === routeKey);
  const stop = route?.stops.find((s) => s.key === stopKey);
  if (!route || !stop) return null;
  return { route, stop, vehicle: transport.vehicles.find((v) => v.key === route.vehicle) };
}

/** "৳৫,০০০ মাসে" / "৳5,000 a month", or null when the charge is set by the office. */
export function monthlyText(monthly: number | undefined, locale: Locale): string | null {
  if (monthly == null) return null;
  return locale === 'bengali' ? `মাসিক ${taka(monthly, locale)}` : `${taka(monthly, locale)} a month`;
}

/** "মিরপুর ১০, মিরপুর মাইক্রো রুট (মাইক্রো, মাসিক ৳৫,০০০)"; the "not on any route" choice reads as itself. */
export function stopText(transport: Transport | undefined, value: unknown, locale: Locale): string | null {
  if (value === NO_ROUTE) return txt(NO_ROUTE_LABEL, locale);
  const chosen = findStop(transport, value);
  if (!chosen) return null;
  const details = [txt(chosen.vehicle?.name, locale), monthlyText(chosen.vehicle?.monthly, locale)].filter(Boolean).join(', ');
  const route = locale === 'bengali' ? `${txt(chosen.route.name, locale)} রুট` : `${txt(chosen.route.name, locale)} route`;
  return `${txt(chosen.stop.name, locale)}, ${route}${details ? ` (${details})` : ''}`;
}
