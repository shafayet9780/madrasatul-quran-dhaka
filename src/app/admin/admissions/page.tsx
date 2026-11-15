import type { Metadata } from 'next';
import Link from 'next/link';
import { adminCycle, overview, transportAreas, transportCounts } from '@/lib/admissions/admin';
import { loadAnsweredSnapshots } from '@/lib/admissions/cycle';
import { STATUS_LABEL, shortDate } from '@/lib/admissions/admin-labels';
import { transportSummary, type TransportSummary } from '@/lib/admissions/transport';
import { dateTime, taka, txt } from '@/lib/admissions/display';
import { fieldWithRole } from '@/lib/admissions/form-config';
import { toBengaliDigits as bn } from '@/lib/admissions/normalise';
import { TEST_FEE } from '@/lib/admissions/payments';
import { hasTestPass } from '@/lib/admissions/test-pass';
import { cn } from '@/lib/utils';
import { PageTop } from '../AdminShell';
import { ExportButton, NoCycle, OfflineFormButton, adminTransport, classOptions } from './ListPage';
import { TestPass } from './DetailControls';
import { Card, LAT, PageBody, PageTitle, StatTile, StatTiles } from '../ui';

export const metadata: Metadata = { title: 'ভর্তি ওভারভিউ' };
export const dynamic = 'force-dynamic';

const DAY = 86_400_000;
const dhakaDate = (d: Date) => new Date(d.getTime() + 6 * 3_600_000).toISOString().slice(0, 10);

function ago(d: Date, now: Date): string {
  const minutes = Math.max(1, Math.round((now.getTime() - d.getTime()) / 60_000));
  if (minutes < 60) return `${bn(minutes)} মিনিট আগে`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${bn(hours)} ঘণ্টা আগে`;
  return shortDate(d);
}

/** Days from the first payment to today (at least 14, at most 60), with zero for quiet days. */
function dailySeries(byDay: { day: string; count: number }[], now: Date) {
  const counts = new Map(byDay.map((d) => [d.day, d.count]));
  const today = dhakaDate(now);
  const first = byDay[0]?.day ?? today;
  const end = new Date(`${today}T00:00:00Z`).getTime();
  const start = Math.max(Math.min(new Date(`${first}T00:00:00Z`).getTime(), end - 13 * DAY), end - 59 * DAY);
  const days: { day: string; label: string; count: number }[] = [];
  for (let t = start; t <= end; t += DAY) {
    const day = new Date(t).toISOString().slice(0, 10);
    days.push({ day, label: shortDate(new Date(`${day}T06:00:00Z`)), count: counts.get(day) ?? 0 });
  }
  return days;
}

function HBars({ rows, total }: { rows: { label: string; count: number; href?: string }[]; total?: number }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="mt-4 flex flex-col gap-1">
      {rows.map((r) => {
        const cells = (
          <>
            <span className={cn('truncate', r.href && 'underline decoration-muted-foreground/50 underline-offset-4 group-hover:decoration-foreground')}>{r.label}</span>
            <span className="block h-3 rounded-r-[4px] bg-primary" style={{ width: `${(r.count / max) * 100}%`, minWidth: r.count ? 2 : 0 }} aria-hidden />
            <span className={cn(LAT, 'min-w-9 text-right font-medium')}>
              {r.count}
              {total ? <span className="font-normal text-muted-foreground"> ({Math.round((r.count / total) * 100)}%)</span> : null}
            </span>
          </>
        );
        const row = 'grid grid-cols-[minmax(90px,120px)_1fr_auto] items-center gap-2.5 rounded-md px-1.5 py-1 text-[13.5px]';
        return r.href ? (
          <Link key={r.label} href={r.href} className={cn(row, 'group -mx-1.5 text-foreground no-underline hover:bg-muted')}>
            {cells}
          </Link>
        ) : (
          <div key={r.label} className={cn(row, '-mx-1.5')}>
            {cells}
          </div>
        );
      })}
    </div>
  );
}

const LIST = '/admin/admissions/applications';

/**
 * Transport: per route, paid applications that asked for it and the seats booked (admitted), with
 * the seats set in the Studio; each route opens its stops. The requests open the list they count.
 */
function TransportCard({ summary, areas }: { summary: TransportSummary; areas: { area: string; count: number }[] }) {
  const num = (n: number, href: string) =>
    n ? (
      <Link href={href} className="text-foreground underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground">
        {n}
      </Link>
    ) : (
      <span className="text-muted-foreground">0</span>
    );
  const requested = summary.routes.reduce((n, r) => n + r.requested, 0);
  const booked = summary.routes.reduce((n, r) => n + r.booked, 0);
  const typed = areas.filter((a) => a.area);
  return (
    <Card>
      <h2 className="m-0 text-[15px] font-semibold">পরিবহন</h2>
      <p className="m-0 mt-0.5 text-[13px] text-muted-foreground">
        চেয়েছেন: পরিশোধিত আবেদনে রুট বাছাই করেছেন · বুকড: অবস্থা ‘{STATUS_LABEL.admitted}’ বা ‘{STATUS_LABEL.sent_to_erp}’ · আসন সংখ্যা স্টুডিওতে (ফি ও পরিবহন → রুট)
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
          <thead>
            <tr className="text-left text-[12.5px] text-muted-foreground [&>th]:pb-1.5 [&>th]:font-normal">
              <th>রুট</th>
              <th>গাড়ি</th>
              <th className="text-right">চেয়েছেন</th>
              <th className="text-right">বুকড</th>
              <th className="text-right">আসন</th>
              <th className="text-right">খালি</th>
            </tr>
          </thead>
          <tbody>
            {summary.routes.map((r) => {
              const href = `${LIST}?transport=route:${encodeURIComponent(r.route.key)}`;
              return (
                <tr key={r.route.key} className="align-top [&>td]:border-t [&>td]:py-2">
                  <td>
                    <details className="group">
                      <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
                        {txt(r.route.name, 'bengali')} <span className="text-[12.5px] font-normal text-muted-foreground group-open:hidden">· স্টপ দেখুন</span>
                      </summary>
                      <ul className="m-0 mt-1.5 flex list-none flex-col gap-0.5 p-0 text-[13px] text-muted-foreground">
                        {r.stops.map((st) => (
                          <li key={st.stop.key} className="flex justify-between gap-4">
                            <span>{txt(st.stop.name, 'bengali')}</span>
                            <span className={LAT}>
                              {st.requested} চেয়েছেন · {st.booked} বুকড
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>
                  <td>{txt(r.vehicle?.name, 'bengali')}</td>
                  <td className={cn(LAT, 'text-right')}>{num(r.requested, href)}</td>
                  <td className={cn(LAT, 'text-right font-medium')}>{r.booked}</td>
                  <td className={cn(LAT, 'text-right')}>{r.route.seats ?? <span className="text-muted-foreground">–</span>}</td>
                  <td className={cn(LAT, 'text-right', r.left != null && r.left < 0 && 'font-medium text-destructive')}>{r.left ?? <span className="text-muted-foreground">–</span>}</td>
                </tr>
              );
            })}
            <tr className="font-medium [&>td]:border-t [&>td]:py-2">
              <td colSpan={2}>সব রুট</td>
              <td className={cn(LAT, 'text-right')}>{num(requested, `${LIST}?transport=any`)}</td>
              <td className={cn(LAT, 'text-right')}>{booked}</td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-col gap-1 text-[13.5px]">
        <p className="m-0">
          কোনো রুটে নেই: <span className={LAT}>{num(summary.noRoute.requested, `${LIST}?transport=none`)}</span>
          {typed.length > 0 && (
            <span className="text-muted-foreground">
              {' '}
              ({typed.map((a) => `${a.area} ${bn(a.count)}`).join(', ')})
            </span>
          )}
        </p>
        <p className="m-0">
          পরিবহন নেবেন না: <span className={LAT}>{num(summary.notWanted.requested, `${LIST}?transport=no`)}</span>
        </p>
        {summary.unknown.requested > 0 && <p className="m-0 text-muted-foreground">ফর্ম থেকে মুছে ফেলা রুট বা স্টপ: {bn(summary.unknown.requested)}টি</p>}
      </div>
    </Card>
  );
}

/** The office's test pass: the form opens on this device only, before launch or while closed. */
async function TestPassCard() {
  const active = await hasTestPass();
  return (
    <Card title="ফর্ম পরীক্ষা, শুধু এই ডিভাইসে">
      <p className="m-0 text-sm text-muted-foreground">
        {active ? (
          <>
            এই ব্রাউজারে পাস চালু আছে (১২ ঘণ্টা)।{' '}
            <Link href="/bengali/pre-admission" className="font-medium text-foreground">
              ফর্মটি খুলুন
            </Link>
            , আবেদন করে পেমেন্ট দিন। পরীক্ষা শেষে আবেদনগুলো মুছে ফেলুন।
          </>
        ) : (
          <>
            প্রকাশিত ফর্মটি এই ব্রাউজারে ১২ ঘণ্টার জন্য খুলবে, ফর্ম বন্ধ থাকলেও; অন্য কেউ দেখবেন না। পরীক্ষার আবেদনের ফি {taka(TEST_FEE, 'bengali')}, আইডি{' '}
            <span className={LAT}>TEST-001</span> ধরনের, গুগল শিটে যায় না, আর পরিশোধের পরেও মুছে ফেলা যায়।
          </>
        )}
      </p>
      <div className="mt-3">
        <TestPass active={active} />
      </div>
    </Card>
  );
}

export default async function AdmissionsOverview() {
  const cycle = await adminCycle();
  if (!cycle)
    return (
      <NoCycle>
        <TestPassCard />
      </NoCycle>
    );
  const { snapshot } = cycle;
  const heard = fieldWithRole(snapshot, 'heardFrom');
  const [o, classes, versions, transport] = await Promise.all([
    overview(cycle.cycleId, heard?.key ?? null),
    classOptions(cycle),
    loadAnsweredSnapshots(cycle.cycleId),
    adminTransport(cycle),
  ]);
  const [stopCounts, areas] = transport
    ? await Promise.all([transportCounts(cycle.cycleId, transport.field.key), transport.area ? transportAreas(cycle.cycleId, transport.field.key, transport.area.key) : []])
    : [[], []];
  const now = new Date();
  const days = dailySeries(o.byDay, now);
  const today = days.at(-1)?.count ?? 0;
  const yesterday = days.at(-2)?.count ?? 0;
  const maxDay = Math.max(1, ...days.map((d) => d.count));
  // Each class opens the paid list filtered to it.
  const byClass = classes.map((c) => ({ label: c.label, count: o.byClass.find((b) => b.classCode === c.value)?.count ?? 0, href: `/admin/admissions/applications?class=${c.value}` }));
  // Answers given before an option was renamed or removed keep the label of the version they answered.
  const heardOptions = [heard, ...[...versions.values()].map((v) => fieldWithRole(v, 'heardFrom'))].flatMap((f) => f?.options ?? []);
  const heardRows = heard
    ? o.heardFrom.map((h) => ({ label: h.value ? txt(heardOptions.find((x) => x.value === h.value)?.label, 'bengali') || h.value : 'উত্তর নেই', count: h.paid, started: h.started }))
    : [];

  const closesAt = snapshot.settings.closesAt ? new Date(snapshot.settings.closesAt) : null;
  const left = closesAt ? Math.ceil((closesAt.getTime() - now.getTime()) / DAY) : null;
  const sub = !closesAt
    ? 'শেষ সময় এখনো ঠিক করা হয়নি (স্টুডিওতে ফর্ম ও ফি)।'
    : closesAt > now
      ? `আবেদন চলছে। শেষ সময় ${dateTime(closesAt.toISOString(), 'bengali')}, আর ${bn(Math.max(0, left ?? 0))} দিন।`
      : `আবেদন বন্ধ হয়েছে ${dateTime(closesAt.toISOString(), 'bengali')}।`;

  const tiles = [
    { label: 'পরিশোধিত আবেদন', value: o.paid, sub: `আবেদন ফি ${taka(o.paid * snapshot.settings.applicationFee, 'bengali')}`, href: '/admin/admissions/applications' },
    { label: 'ফি বাকি', value: o.unpaid, sub: `ফর্ম আছে, পরিশোধ হয়নি; আরও ${bn(o.drafts)}টি অসম্পূর্ণ`, href: '/admin/admissions/unpaid' },
    { label: 'আজ নতুন', value: today, sub: `গতকাল ${bn(yesterday)}টি`, href: null },
    {
      label: 'অ্যাসেসমেন্ট ফি গৃহীত',
      value: o.evalFees,
      sub: o.attended ? `উপস্থিত ${bn(o.attended)} জন` : 'অ্যাসেসমেন্ট এখনো শুরু হয়নি',
      href: '/admin/admissions/evaluation-day',
    },
  ];

  return (
    <>
      <PageTop crumbs={[{ label: 'ভর্তি', href: '/admin/admissions' }, { label: 'ওভারভিউ' }]} round={false} actions={<><OfflineFormButton /><ExportButton /></>} />
      <PageBody className="gap-5">
        <PageTitle sub={sub}>প্রি-অ্যাডমিশন {bn(cycle.session)}</PageTitle>

        <StatTiles>
          {tiles.map((t) => (
            <StatTile key={t.label} label={t.label} value={t.value} sub={t.sub} href={t.href} />
          ))}
        </StatTiles>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <h2 className="m-0 text-[15px] font-semibold">প্রতিদিনের পরিশোধিত আবেদন</h2>
            <p className="m-0 mt-0.5 text-[13px] text-muted-foreground">
              {days[0].label} থেকে আজ পর্যন্ত, বারে রাখলে সংখ্যা দেখাবে
            </p>
            <div className="mt-3 flex h-[180px] items-end gap-1.5 border-b pt-7" role="list" aria-label="প্রতিদিনের পরিশোধিত আবেদন">
              {days.map((d) => {
                const tip = `${d.label}: ${bn(d.count)}টি`;
                return (
                  <div key={d.day} role="listitem" tabIndex={0} aria-label={tip} className="group relative flex h-full flex-1 items-end outline-none">
                    <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-[2] hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-white px-2 py-1.5 text-xs shadow-[0_4px_12px_rgba(23,23,23,0.08)] group-hover:block group-focus:block">
                      {tip}
                    </span>
                    <span
                      className="block w-full rounded-t-[4px] bg-primary group-hover:opacity-80 group-focus:opacity-80"
                      style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? 2 : 0 }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between pt-1.5 text-xs text-muted-foreground">
              <span>{days[0].label}</span>
              <span>{days.at(-1)!.label}</span>
            </div>
          </Card>

          <Card>
            <h2 className="m-0 text-[15px] font-semibold">শ্রেণীভিত্তিক আবেদন</h2>
            <p className="m-0 mt-0.5 text-[13px] text-muted-foreground">পরিশোধিত, মোট {bn(o.paid)} · শ্রেণীতে চাপ দিলে তালিকা খুলবে</p>
            <HBars rows={byClass} />
          </Card>

          <Card>
            {heard && (
              <>
                <h2 className="m-0 text-[15px] font-semibold">কিভাবে জেনেছেন</h2>
                <p className="m-0 mt-0.5 text-[13px] text-muted-foreground">ফর্ম শুরুতেই জিজ্ঞেস করা হয়, তাই অসম্পূর্ণ আবেদনও গোনা হয়। একাধিক উত্তর হলে প্রতিটি আলাদা।</p>
                {heardRows.length ? (
                  <table className="mt-3 w-full border-collapse text-[13.5px]">
                    <thead>
                      <tr className="text-left text-[12.5px] text-muted-foreground [&>th]:pb-1.5 [&>th]:font-normal">
                        <th>উৎস</th>
                        <th className="text-right">শুরু</th>
                        <th className="text-right">পরিশোধিত</th>
                        <th className="text-right">হার</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heardRows.map((r) => (
                        <tr key={r.label} className="[&>td]:border-t [&>td]:py-1.5">
                          <td>{r.label}</td>
                          <td className={cn(LAT, 'text-right')}>{r.started}</td>
                          <td className={cn(LAT, 'text-right font-medium')}>{r.count}</td>
                          <td className={cn(LAT, 'text-right text-muted-foreground')}>{r.started ? `${Math.round((r.count / r.started) * 100)}%` : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="m-0 mt-4 text-sm text-muted-foreground">এখনো কোনো উত্তর নেই।</p>
                )}
              </>
            )}
            <div className={cn('flex items-baseline justify-between', heard && 'mt-6')}>
              <h2 className="m-0 text-[15px] font-semibold">সাম্প্রতিক আবেদন</h2>
              <Link href="/admin/admissions/applications" className="text-[13.5px] font-medium text-foreground">
                সব দেখুন
              </Link>
            </div>
            {o.recent.length ? (
              <table className="mt-2 w-full border-collapse text-sm">
                <tbody>
                  {o.recent.map((r) => (
                    <tr key={r.id} className="[&>td]:border-t [&>td]:py-2.5">
                      <td className={cn(LAT, 'w-[76px] font-medium')}>
                        <Link href={`/admin/admissions/${r.id}`} className="text-foreground no-underline hover:underline">
                          {r.publicRef}
                        </Link>
                      </td>
                      <td>{r.studentNameBn}</td>
                      <td className="text-right text-[13px] text-muted-foreground">{r.paidAt ? ago(r.paidAt, now) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="m-0 mt-3 text-sm text-muted-foreground">এখনো কোনো পরিশোধিত আবেদন নেই।</p>
            )}
          </Card>
        </div>

        {transport && <TransportCard summary={transportSummary(transport.transport, stopCounts)} areas={areas} />}

        <TestPassCard />
      </PageBody>
    </>
  );
}
