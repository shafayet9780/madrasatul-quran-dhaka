import Link from 'next/link';
import { requestOrigin } from '@/lib/survey/admin-auth';
import { formatDateTime } from '@/lib/survey/dates';
import { displayMobile } from '@/lib/survey/labels';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { roundStatus } from '@/lib/survey/round-status';
import { surveyPath } from '@/lib/survey/rounds';
import { loadGuardianTracker } from '@/lib/survey/tracker';
import { cn } from '@/lib/utils';
import { CopyReminder } from './TrackerControls';
import { PageTop } from '../AdminShell';
import { ReportFilters } from '../reports/ReportFilters';
import { ReportTools } from '../reports/ReportTools';
import { PageBody, PageTitle, StatTile, StatTiles } from '../ui';

const DAY = 24 * 60 * 60 * 1000;
const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' });

/** Tracker for one guardian round (R6-Tracker-Guardian): progress, reminders, unverified, more than one form. */
export async function GuardianTracker({ roundId, rounds, place, now }: { roundId: string; rounds: { value: string; label: string }[]; place?: string; now: Date }) {
  const [data, origin] = await Promise.all([loadGuardianTracker(roundId), requestOrigin()]);
  if (!data) return null;
  const { round, places, done, total, verified, unverified, multiple } = data;
  const status = roundStatus(round, now);
  // A closed round's link no longer works: no reminders (extend the round on the rounds page first).
  const closed = status === 'closed';
  const daysLeft = Math.ceil((round.closesAt.getTime() - now.getTime()) / DAY);
  const when =
    status === 'open' ? `বন্ধ হতে ${bn(daysLeft)} দিন বাকি` : status === 'scheduled' ? `খুলবে ${formatDateTime(round.opensAt)}` : `বন্ধ হয়েছে ${formatDateTime(round.closesAt)}`;
  // Default: the class with the most guardians still to answer.
  const chosen = places.find((p) => `${p.classKey}|${p.sectionKey}` === place) ?? [...places].sort((a, b) => b.pending.length - a.pending.length)[0];
  const link = new URL(surveyPath(round.slug, round.linkKey), origin).toString();
  const message = (child: string) =>
    `আসসালামু আলাইকুম। ${child}-এর জন্য “${round.snapshot.template.title}” (${round.label}) এখনো জমা হয়নি। লিংক: ${link} · শেষ সময় ${dayMonth.format(round.closesAt)}। জাযাকাল্লাহু খাইরান।`;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const kpis = [
    { label: 'সাড়া', value: `${bn(done)}/${bn(total)}`, note: `${bn(percent)}% শিক্ষার্থীর অভিভাবক`, href: null },
    { label: 'যাচাইকৃত', value: bn(verified), note: 'মোবাইল ERP-র সাথে মিলেছে', href: null },
    { label: 'অযাচাইকৃত', value: bn(unverified.length), note: 'গণ্য, তবে আলাদা দেখানো', href: '#unverified' },
    { label: 'একাধিক জমা', value: bn(multiple.length), note: 'সর্বশেষটি গণ্য', href: '#multiple' },
  ];
  const noNumber = chosen ? chosen.pending.filter((c) => !c.fatherMobile && !c.motherMobile).length : 0;
  const contact = (c: { fatherMobile: string | null; motherMobile: string | null }) =>
    [c.fatherMobile && `বাবা ${displayMobile(c.fatherMobile)}`, c.motherMobile && `মা ${displayMobile(c.motherMobile)}`].filter(Boolean).join(' · ');

  return (
    <>
      <PageTop crumbs={[{ label: 'সংগ্রহ' }, { label: 'রেসপন্স ট্র্যাকার' }]} round={false} actions={<ReportTools exportHref={`/admin/reports/export?kind=guardian-tracker&round=${round.id}`} />} />
      <PageBody>
        <PageTitle sub={`${round.snapshot.template.title} · ${round.label} · ${when}`}>রেসপন্স ট্র্যাকার</PageTitle>
        <ReportFilters action="/admin/tracker" selects={[{ name: 'round', label: 'জরিপ ও রাউন্ড', value: round.id, options: rounds }]} />

        <StatTiles>
          {kpis.map((k) => (
            <StatTile key={k.label} label={k.label} value={k.value} sub={k.note} href={k.href} />
          ))}
        </StatTiles>

        <div id="pending" className="grid scroll-mt-20 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(260px,1fr)_2fr]">
          <section className="flex flex-col gap-1.5 rounded-xl border bg-card p-5" aria-labelledby="by-class">
            <h2 id="by-class" className="m-0 mb-1.5 text-[15px] font-semibold">
              শ্রেণিভিত্তিক সাড়া
            </h2>
            {places.map((p) => {
              const key = `${p.classKey}|${p.sectionKey}`;
              const current = chosen && key === `${chosen.classKey}|${chosen.sectionKey}`;
              return (
                <Link
                  key={key}
                  href={`/admin/tracker?round=${round.id}&place=${encodeURIComponent(key)}#pending`}
                  aria-current={current ? 'true' : undefined}
                  className={cn('grid grid-cols-[100px_minmax(0,1fr)_52px] items-center gap-2.5 rounded-lg px-2.5 py-2 text-foreground no-underline hover:bg-muted', current && 'bg-muted font-semibold')}
                >
                  <span className="text-sm">{p.label}</span>
                  <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
                    <span className="block h-2 rounded-full bg-[#b86a2e]" style={{ width: `${p.total ? Math.round((p.done / p.total) * 100) : 0}%` }} />
                  </span>
                  <span className="text-right text-[13px] tabular-nums">
                    {bn(p.done)}/{bn(p.total)}
                  </span>
                </Link>
              );
            })}
          </section>

          {chosen && (
            <section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-5" aria-labelledby="pending-title">
              <div className="flex flex-col gap-0.5">
                <h2 id="pending-title" className="m-0 text-[15px] font-semibold">
                  {chosen.label} · এখনো জমা হয়নি ({bn(chosen.pending.length)})
                </h2>
                <p className="m-0 text-[13.5px] text-muted-foreground">
                  {closed
                    ? 'রাউন্ড বন্ধ, তাই বার্তা পাঠানো যাবে না। আরও সময় দিতে রাউন্ড পাতায় মেয়াদ বাড়ান।'
                    : 'প্রত্যেক অভিভাবককে আলাদা বার্তা পাঠান। গ্রুপে নাম তালিকা পাঠাবেন না। বার্তায় শুধু এই রাউন্ডের লিংক থাকে।'}
                </p>
              </div>
              {!closed && noNumber > 0 && (
                <p className="m-0 rounded-lg bg-[var(--sv-warn-bg)] px-3.5 py-2.5 text-[13.5px]">
                  {bn(noNumber)} জনের কোনো নম্বর নেই, তাই বার্তা পাঠানো যাবে না। ERP-তে নম্বর যোগ করুন, তারপর আবার ইমপোর্ট করুন।
                </p>
              )}
              {chosen.pending.length === 0 ? (
                <p className="m-0 text-sm text-muted-foreground">এই শ্রেণির সব অভিভাবক জমা দিয়েছেন।</p>
              ) : (
                <div role="region" aria-label="জমা হয়নি এমন শিক্ষার্থীর তালিকা" tabIndex={0} className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-[13px] text-muted-foreground [&>th]:border-b [&>th]:px-2.5 [&>th]:py-2 [&>th]:font-medium">
                        <th scope="col">শিক্ষার্থী</th>
                        <th scope="col">যোগাযোগ</th>
                        <th scope="col" className="text-right">
                          কাজ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {chosen.pending.map((c) => (
                        <tr key={c.erpId} className="[&>td]:border-b [&>td]:px-2.5 [&>td]:py-2.5 last:[&>td]:border-b-0">
                          <td>
                            <span className="block font-medium">{c.name}</span>
                            <span className="block text-[13px] text-muted-foreground">{c.roll !== null ? `রোল ${bn(c.roll)}` : `রোল নেই · আইডি ${bn(c.erpId)}`}</span>
                          </td>
                          <td className={cn('text-[13.5px]', !contact(c) && 'text-muted-foreground')}>{contact(c) || 'নম্বর নেই'}</td>
                          <td className="text-right">
                            {closed ? (
                              <span className="text-[13px] text-muted-foreground">রাউন্ড বন্ধ</span>
                            ) : c.fatherMobile || c.motherMobile ? (
                              <CopyReminder text={message(c.name)} child={c.name} />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!closed && (
                <p className="m-0 rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed">
                  <b className="font-semibold">বার্তার নমুনা:</b> “{message('[শিক্ষার্থীর নাম]')}”
                </p>
              )}
            </section>
          )}
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <section id="unverified" className="flex scroll-mt-20 flex-col gap-2.5 rounded-xl border bg-card p-5" aria-labelledby="unverified-title">
            <h2 id="unverified-title" className="m-0 text-[15px] font-semibold">
              অযাচাইকৃত জমা ({bn(unverified.length)})
            </h2>
            <p className="m-0 text-[13.5px] text-muted-foreground">প্রদানকারীর মোবাইল ERP-র বাবা বা মায়ের নম্বরের সাথে মেলেনি। জমা গণ্য হয়েছে; রিপোর্টে “শুধু যাচাইকৃত” ফিল্টারে বাদ যায়।</p>
            {unverified.length === 0 && <p className="m-0 text-sm text-muted-foreground">নেই।</p>}
            {unverified.map((f) => (
              <div key={f.submissionId} className="flex flex-col border-t pt-2.5">
                <span className="font-medium">
                  {f.who} ({f.relation}) · {f.child.name}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {f.place} · {displayMobile(f.mobile)} · {formatDateTime(f.submittedAt)}
                </span>
              </div>
            ))}
          </section>
          <section id="multiple" className="flex scroll-mt-20 flex-col gap-2.5 rounded-xl border bg-card p-5" aria-labelledby="multiple-title">
            <h2 id="multiple-title" className="m-0 text-[15px] font-semibold">
              একাধিক জমা ({bn(multiple.length)})
            </h2>
            <p className="m-0 text-[13.5px] text-muted-foreground">
              একই শিক্ষার্থীর জন্য একাধিক রিভিউ এসেছে। সর্বশেষটি গণ্য হয়; আগেরগুলো রাখা আছে। গণ্য ফর্মটি অন্য নম্বর থেকে এলে চিহ্নিত থাকে — অস্বাভাবিক মনে হলে অভিভাবককে ফোন করুন।
            </p>
            {multiple.length === 0 && <p className="m-0 text-sm text-muted-foreground">নেই।</p>}
            {multiple.map((m) => (
              <div key={m.child.erpId} className="flex flex-col gap-1.5 border-t pt-2.5">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{m.child.name}</span>
                  <span className="text-[13px] text-muted-foreground">{m.place}</span>
                </div>
                {m.forms.map((f) => (
                  <div key={f.submissionId} className="flex flex-wrap items-center gap-2 text-[13.5px]">
                    <span className={cn('inline-flex h-[22px] items-center rounded-md border px-2 text-xs font-medium', f.current ? 'text-success' : 'text-muted-foreground')}>{f.current ? 'গণ্য' : 'আগের'}</span>
                    <span>
                      {f.who} ({f.relation}) · {displayMobile(f.mobile)} · {f.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত'}
                    </span>
                    <span className="text-muted-foreground">{formatDateTime(f.submittedAt)}</span>
                    {f.current && m.forms.some((o) => !o.current && o.mobile !== f.mobile) && (
                      <span className="inline-flex h-[22px] items-center rounded-md border px-2 text-xs font-medium text-warning">আগের ফর্ম অন্য নম্বর থেকে</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </section>
        </div>
      </PageBody>
    </>
  );
}
