import { describe, expect, it } from 'vitest';
import type { Transport } from './form-config';
import { transportAcrossVersions, transportFilter, transportFilterOptions, transportSummary } from './transport';

const bi = (bengali: string) => ({ bengali });
const transport: Transport = {
  vehicles: [
    { key: 'micro', name: bi('মাইক্রো'), monthly: 5000 },
    { key: 'auto', name: bi('অটো'), monthly: 2500 },
  ],
  routes: [
    { key: 'mirpur_micro', name: bi('মিরপুর মাইক্রো'), area: bi('মিরপুর'), vehicle: 'micro', seats: 10, stops: [{ key: 'm10', name: bi('মিরপুর ১০') }, { key: 'm13', name: bi('মিরপুর ১৩') }] },
    { key: 'uttara_auto', name: bi('উত্তরা অটো'), area: bi('উত্তরা'), vehicle: 'auto', stops: [{ key: 's18', name: bi('সেক্টর ১৮') }] },
  ],
};

describe('transport summary', () => {
  it('counts requests (paid) and booked seats (admitted) per route and stop, with the seats left', () => {
    const s = transportSummary(transport, [
      { value: 'mirpur_micro:m10', status: 'paid', count: 4 },
      { value: 'mirpur_micro:m10', status: 'admitted', count: 3 },
      { value: 'mirpur_micro:m13', status: 'sent_to_erp', count: 1 },
      { value: 'mirpur_micro:m13', status: 'not_selected', count: 2 },
      { value: 'uttara_auto:s18', status: 'admitted', count: 1 },
      { value: 'none', status: 'paid', count: 2 },
      { value: null, status: 'admitted', count: 5 },
      { value: 'gone:x', status: 'paid', count: 1 },
    ]);
    const [mirpur, uttara] = s.routes;
    expect(mirpur).toMatchObject({ requested: 10, booked: 4, left: 6 });
    expect(mirpur.stops.map((x) => [x.stop.key, x.requested, x.booked])).toEqual([
      ['m10', 7, 3],
      ['m13', 3, 1],
    ]);
    expect(uttara).toMatchObject({ requested: 1, booked: 1, left: null });
    expect(s.noRoute).toEqual({ requested: 2, booked: 0 });
    expect(s.notWanted).toEqual({ requested: 5, booked: 5 });
    expect(s.unknown).toEqual({ requested: 1, booked: 0 });
  });

  it('turns a filter choice into route keys', () => {
    expect(transportFilter(transport, 'any')).toEqual({ routes: ['mirpur_micro', 'uttara_auto'] });
    expect(transportFilter(transport, 'route:uttara_auto')).toEqual({ routes: ['uttara_auto'] });
    expect(transportFilter(transport, 'vehicle:micro')).toEqual({ routes: ['mirpur_micro'] });
    expect(transportFilter(transport, 'none')).toEqual({ kind: 'none' });
    expect(transportFilter(transport, 'route:nope')).toBeNull();
    expect(transportFilterOptions(transport, 'bengali').map((o) => o.value)).toEqual(['any', 'route:mirpur_micro', 'route:uttara_auto', 'vehicle:micro', 'vehicle:auto', 'none', 'no']);
  });

  it('keeps a route hidden since guardians chose it, the newest version winning', () => {
    const newer: Transport = { ...transport, routes: [{ ...transport.routes[0], seats: 12 }] };
    const merged = transportAcrossVersions([{ transport: newer }, { transport }])!;
    expect(merged.routes.map((r) => [r.key, r.seats])).toEqual([
      ['mirpur_micro', 12],
      ['uttara_auto', undefined],
    ]);
  });
});
