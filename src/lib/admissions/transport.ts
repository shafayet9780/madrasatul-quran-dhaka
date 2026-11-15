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

/** Statuses whose transport seat is booked: the child is admitted (or already sent to the ERP). */
export const BOOKED_STATUSES = ['admitted', 'sent_to_erp'] as const;

/** One count from the database: paid applications by transport stop answer and status. */
export type StopCount = { value: string | null; status: string; count: number };

export type RouteSummary = {
  route: TransportRoute;
  vehicle?: Transport['vehicles'][number];
  requested: number;
  booked: number;
  /** Seats left (seats less booked), when the route has seats set; can go below zero. */
  left: number | null;
  stops: { stop: TransportRoute['stops'][number]; requested: number; booked: number }[];
};

export type TransportSummary = {
  routes: RouteSummary[];
  /** Answered "my area is not on any route". */
  noRoute: { requested: number; booked: number };
  /** Paid applications that did not ask for transport. */
  notWanted: { requested: number; booked: number };
  /** A stop no longer in the form (route or stop deleted in the Studio). */
  unknown: { requested: number; booked: number };
};

const isBooked = (status: string) => (BOOKED_STATUSES as readonly string[]).includes(status);

/**
 * Transport requests (paid applications) and booked seats (admitted) per route and stop, read
 * against the current routes. A submitted application keeps only the answers it showed, so a stop
 * answer always means the guardian asked for transport. Pure.
 */
export function transportSummary(transport: Transport | undefined, counts: StopCount[]): TransportSummary {
  const routes: RouteSummary[] = (transport?.routes ?? []).map((route) => ({
    route,
    vehicle: transport!.vehicles.find((v) => v.key === route.vehicle),
    requested: 0,
    booked: 0,
    left: null,
    stops: route.stops.map((stop) => ({ stop, requested: 0, booked: 0 })),
  }));
  const zero = () => ({ requested: 0, booked: 0 });
  const summary: TransportSummary = { routes, noRoute: zero(), notWanted: zero(), unknown: zero() };
  for (const c of counts) {
    const booked = isBooked(c.status) ? c.count : 0;
    const add = (t: { requested: number; booked: number }) => {
      t.requested += c.count;
      t.booked += booked;
    };
    if (!c.value) add(summary.notWanted);
    else if (c.value === NO_ROUTE) add(summary.noRoute);
    else {
      const [routeKey, stopKey] = c.value.split(':');
      const r = routes.find((x) => x.route.key === routeKey);
      const s = r?.stops.find((x) => x.stop.key === stopKey);
      if (!r || !s) add(summary.unknown);
      else {
        add(r);
        add(s);
      }
    }
  }
  for (const r of routes) r.left = r.route.seats != null ? r.route.seats - r.booked : null;
  return summary;
}

/** The list filter's choices: any route, each route, each vehicle, not on a route, not wanted. */
export function transportFilterOptions(transport: Transport | undefined, locale: Locale): { value: string; label: string }[] {
  if (!transport) return [];
  return [
    { value: 'any', label: locale === 'bengali' ? 'যেকোনো রুট' : 'Any route' },
    ...transport.routes.map((r) => ({ value: `route:${r.key}`, label: locale === 'bengali' ? `${txt(r.name, locale)} রুট` : `${txt(r.name, locale)} route` })),
    ...transport.vehicles.map((v) => ({ value: `vehicle:${v.key}`, label: locale === 'bengali' ? `সব ${txt(v.name, locale)}` : `Every ${txt(v.name, locale)}` })),
    { value: 'none', label: txt(NO_ROUTE_LABEL, locale) },
    { value: 'no', label: locale === 'bengali' ? 'পরিবহন নেবেন না' : 'No transport' },
  ];
}

/** A filter choice as route keys (any route, a route, a vehicle's routes) or a kind, or null when unknown. */
export function transportFilter(transport: Transport | undefined, choice: string | undefined): { routes: string[] } | { kind: 'none' | 'no' } | null {
  if (!transport || !choice) return null;
  if (choice === 'none' || choice === 'no') return { kind: choice };
  if (choice === 'any') return { routes: transport.routes.map((r) => r.key) };
  const [type, key] = choice.split(':');
  if (type === 'route' && transport.routes.some((r) => r.key === key)) return { routes: [key] };
  if (type === 'vehicle' && transport.vehicles.some((v) => v.key === key)) return { routes: transport.routes.filter((r) => r.vehicle === key).map((r) => r.key) };
  return null;
}

/**
 * The routes and vehicles of several form versions, newest first: a route hidden or deleted since
 * guardians chose it still counts. The newest version's wording and seats win.
 */
export function transportAcrossVersions(snapshots: { transport?: Transport }[]): Transport | undefined {
  const routes = new Map<string, TransportRoute>();
  const vehicles = new Map<string, Transport['vehicles'][number]>();
  for (const s of snapshots) {
    for (const r of s.transport?.routes ?? []) if (!routes.has(r.key)) routes.set(r.key, r);
    for (const v of s.transport?.vehicles ?? []) if (!vehicles.has(v.key)) vehicles.set(v.key, v);
  }
  return routes.size ? { routes: [...routes.values()], vehicles: [...vehicles.values()] } : undefined;
}
